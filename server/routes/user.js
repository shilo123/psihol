import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromToken, updateUser, findUserById, getDb } from '../db.js';

const router = Router();

// GET /profile
router.get('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /profile
router.put('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { parentName, parentAge, parentStyle, challenges } = req.body;
    const updates = {};
    if (parentName !== undefined) updates.parentName = parentName;
    if (parentAge !== undefined) updates.parentAge = parentAge;
    if (parentStyle !== undefined) updates.parentStyle = parentStyle;
    if (challenges !== undefined) updates.challenges = challenges;

    const updatedUser = await updateUser(user.id, updates);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /children
router.get('/children', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(user.children || []);
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /children
router.post('/children', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, birthDate, gender, personality } = req.body;
    if (!name) return res.status(400).json({ error: 'Child name is required' });

    const child = {
      id: uuidv4(),
      name,
      birthDate: birthDate || '',
      gender: gender || '',
      personality: personality || ''
    };

    const children = [...(user.children || []), child];
    await updateUser(user.id, { children });

    res.status(201).json(child);
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /children/:id
router.put('/children/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, birthDate, gender, personality } = req.body;
    const children = [...(user.children || [])];
    const childIndex = children.findIndex(c => c.id === req.params.id);

    if (childIndex === -1) return res.status(404).json({ error: 'Child not found' });

    if (name !== undefined) children[childIndex].name = name;
    if (birthDate !== undefined) children[childIndex].birthDate = birthDate;
    if (gender !== undefined) children[childIndex].gender = gender;
    if (personality !== undefined) children[childIndex].personality = personality;

    await updateUser(user.id, { children });
    res.json(children[childIndex]);
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /account - Self-delete account and all data
router.delete('/account', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const db = await getDb();
    await db.collection('users').deleteOne({ id: user.id });
    await db.collection('conversations').deleteMany({ userId: user.id });
    await db.collection('memories').deleteMany({ userId: user.id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
