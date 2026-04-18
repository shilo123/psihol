import { Router } from 'express';
import { getAllUsers, countConversations, getSystemPrompt, setSystemPrompt, getTechnicalPrompt, setTechnicalPrompt, getTokenUsageStats, findUserById, updateUser, getMemories, getDb, getSetting, setSetting, getLowConfidenceQuestions, deleteLowConfidenceQuestion } from '../db.js';
import { sendPushNotification } from '../pushNotifications.js';

const router = Router();

// GET /system-prompt
router.get('/system-prompt', async (req, res) => {
  try {
    const prompt = await getSystemPrompt();
    res.json({ prompt });
  } catch (error) {
    console.error('Get system prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /system-prompt
router.put('/system-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    await setSystemPrompt(prompt);
    res.json({ prompt });
  } catch (error) {
    console.error('Update system prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /technical-prompt
router.get('/technical-prompt', async (req, res) => {
  try {
    const prompt = await getTechnicalPrompt();
    res.json({ prompt });
  } catch (error) {
    console.error('Get technical prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /technical-prompt
router.put('/technical-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    await setTechnicalPrompt(prompt);
    res.json({ prompt });
  } catch (error) {
    console.error('Update technical prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users
router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users.map(u => ({
      id: u.id,
      name: u.parentName || u.name || '',
      email: u.email,
      picture: u.picture || '',
      authProvider: u.authProvider || '',
      isGuest: !!u.isGuest,
      parentStyle: u.parentStyle || '',
      children: (u.children || []).map(c => ({ name: c.name, gender: c.gender, personality: c.personality || '' })),
      childrenCount: (u.children || []).length,
      createdAt: u.createdAt
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id - full user details with memories
router.get('/users/:id', async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const memories = await getMemories(user.id);
    const { passwordHash, ...safe } = user;
    res.json({ ...safe, memories });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /users/:id - update user
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, parentName } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (parentName !== undefined) updates.parentName = parentName;

    const updated = await updateUser(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/:id - delete user and their data
router.delete('/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.collection('users').deleteOne({ id: req.params.id });
    await db.collection('conversations').deleteMany({ userId: req.params.id });
    await db.collection('memories').deleteMany({ userId: req.params.id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /settings/temperature
router.get('/settings/temperature', async (req, res) => {
  try {
    const temp = await getSetting('chatTemperature');
    res.json({ temperature: temp !== null ? parseFloat(temp) : 0.7 });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /settings/temperature
router.put('/settings/temperature', async (req, res) => {
  try {
    const { temperature } = req.body;
    const val = parseFloat(temperature);
    if (isNaN(val) || val < 0 || val > 2) return res.status(400).json({ error: 'Temperature must be 0-2' });
    await setSetting('chatTemperature', val.toString());
    res.json({ temperature: val });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const users = await getAllUsers();
    const totalConversations = await countConversations();
    const tokenStats = await getTokenUsageStats();
    res.json({
      totalUsers: users.length,
      totalConversations,
      status: 'active',
      tokens: tokenStats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /low-confidence - Get questions where AI wasn't confident
router.get('/low-confidence', async (req, res) => {
  try {
    const questions = await getLowConfidenceQuestions();
    res.json(questions);
  } catch (error) {
    console.error('Get low-confidence questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /low-confidence/:id
router.delete('/low-confidence/:id', async (req, res) => {
  try {
    const deleted = await deleteLowConfidenceQuestion(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete low-confidence question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /send-push/:userId — send custom push notification to user
router.post('/send-push/:userId', async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });

    const user = await findUserById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const fcmToken = user.program?.fcmToken;
    if (!fcmToken) return res.status(400).json({ error: 'User has no FCM token' });

    const success = await sendPushNotification(fcmToken, title, body);
    res.json({ success });
  } catch (error) {
    console.error('Send push error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
