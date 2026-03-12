import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON, getUserFromToken } from '../helpers.js';

const router = Router();

// GET /profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /profile - Update user profile
router.put('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentName, parentAge, parentStyle, challenges } = req.body;

    const users = await readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (parentName !== undefined) users[userIndex].parentName = parentName;
    if (parentAge !== undefined) users[userIndex].parentAge = parentAge;
    if (parentStyle !== undefined) users[userIndex].parentStyle = parentStyle;
    if (challenges !== undefined) users[userIndex].challenges = challenges;

    await writeJSON('users.json', users);
    res.json(users[userIndex]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /children - Get user's children
router.get('/children', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json(user.children || []);
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /children - Add a child
router.post('/children', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, birthDate, gender, personality } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Child name is required' });
    }

    const child = {
      id: uuidv4(),
      name,
      birthDate: birthDate || '',
      gender: gender || '',
      personality: personality || ''
    };

    const users = await readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].children.push(child);
    await writeJSON('users.json', users);

    res.status(201).json(child);
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /children/:id - Update a child
router.put('/children/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, birthDate, gender, personality } = req.body;

    const users = await readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const childIndex = users[userIndex].children.findIndex(c => c.id === req.params.id);

    if (childIndex === -1) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (name !== undefined) users[userIndex].children[childIndex].name = name;
    if (birthDate !== undefined) users[userIndex].children[childIndex].birthDate = birthDate;
    if (gender !== undefined) users[userIndex].children[childIndex].gender = gender;
    if (personality !== undefined) users[userIndex].children[childIndex].personality = personality;

    await writeJSON('users.json', users);
    res.json(users[userIndex].children[childIndex]);
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
