import { Router } from 'express';
import { getAllUsers, countConversations, getSystemPrompt, setSystemPrompt } from '../db.js';

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

// GET /users
router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users.map(u => ({
      id: u.id,
      name: u.parentName || u.name || '',
      email: u.email,
      childrenCount: (u.children || []).length,
      createdAt: u.createdAt
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const users = await getAllUsers();
    const totalConversations = await countConversations();
    res.json({
      totalUsers: users.length,
      totalConversations,
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
