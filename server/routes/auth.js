import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON } from '../helpers.js';

const router = Router();

// POST /login - Google login stub
router.post('/login', async (req, res) => {
  try {
    const { email, name, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const users = await readJSON('users.json');
    let user = users.find(u => u.email === email);

    if (!user) {
      user = {
        id: uuidv4(),
        email,
        name: name || '',
        picture: picture || '',
        parentName: '',
        parentAge: '',
        parentStyle: '',
        children: [],
        challenges: [],
        conversations: [],
        createdAt: new Date().toISOString()
      };
      users.push(user);
      await writeJSON('users.json', users);
    }

    const token = 'mock-token-' + user.id;

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /register - Onboarding data
router.post('/register', async (req, res) => {
  try {
    const { parentName, parentAge, parentStyle, children, challenges, email } = req.body;

    const users = await readJSON('users.json');

    // Find user by email or token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = token?.replace('mock-token-', '');
    let userIndex = users.findIndex(u => u.id === userId || u.email === email);

    if (userIndex === -1) {
      // Create new user if not found
      const newUser = {
        id: uuidv4(),
        email: email || '',
        name: parentName || '',
        picture: '',
        parentName: parentName || '',
        parentAge: parentAge || '',
        parentStyle: parentStyle || '',
        children: (children || []).map(child => ({
          id: uuidv4(),
          name: child.name,
          birthDate: child.birthDate,
          gender: child.gender,
          personality: child.personality || ''
        })),
        challenges: challenges || [],
        conversations: [],
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      await writeJSON('users.json', users);
      return res.json(newUser);
    }

    // Update existing user
    users[userIndex] = {
      ...users[userIndex],
      parentName: parentName || users[userIndex].parentName,
      parentAge: parentAge || users[userIndex].parentAge,
      parentStyle: parentStyle || users[userIndex].parentStyle,
      children: (children || []).map(child => ({
        id: child.id || uuidv4(),
        name: child.name,
        birthDate: child.birthDate,
        gender: child.gender,
        personality: child.personality || ''
      })),
      challenges: challenges || users[userIndex].challenges
    };

    await writeJSON('users.json', users);
    res.json(users[userIndex]);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me - Get current user from token
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const userId = token.replace('mock-token-', '');
    const users = await readJSON('users.json');
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
