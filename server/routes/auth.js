import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findUserByEmail, createUser, updateUser, findUserById } from '../db.js';

const router = Router();

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, name, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await findUserByEmail(email);

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
        createdAt: new Date().toISOString()
      };
      await createUser(user);
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

    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = token?.replace('mock-token-', '');

    let user = await findUserById(userId);
    if (!user && email) user = await findUserByEmail(email);

    if (!user) {
      // Create new user
      user = {
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
        createdAt: new Date().toISOString()
      };
      await createUser(user);
      return res.json(user);
    }

    // Update existing user
    const updates = {
      parentName: parentName || user.parentName,
      parentAge: parentAge || user.parentAge,
      parentStyle: parentStyle || user.parentStyle,
      children: (children || []).map(child => ({
        id: child.id || uuidv4(),
        name: child.name,
        birthDate: child.birthDate,
        gender: child.gender,
        personality: child.personality || ''
      })),
      challenges: challenges || user.challenges
    };

    const updatedUser = await updateUser(user.id, updates);
    res.json(updatedUser);
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
    const user = await findUserById(userId);

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
