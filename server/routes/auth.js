import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser, updateUser, findUserById } from '../db.js';

const router = Router();

// POST /login - Email + password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'נדרשים אימייל וסיסמה' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'חשבון זה נרשם דרך גוגל. השתמשו בכניסה דרך גוגל.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }

    const token = 'mock-token-' + user.id;
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'שגיאה פנימית' });
  }
});

// POST /signup - Email + password registration
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'נדרשים שם, אימייל וסיסמה' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'כתובת האימייל כבר רשומה במערכת' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      email,
      name,
      picture: '',
      passwordHash,
      authProvider: 'email',
      parentName: '',
      parentAge: '',
      parentStyle: '',
      children: [],
      challenges: [],
      createdAt: new Date().toISOString()
    };

    await createUser(user);
    const token = 'mock-token-' + user.id;
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'שגיאה פנימית' });
  }
});

// POST /google - Google Sign-In (verify ID token)
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    // Verify token with Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = await googleRes.json();
    const { email, name, picture, sub: googleId } = payload;

    // Verify audience matches our client ID
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      return res.status(401).json({ error: 'Invalid token audience' });
    }

    let user = await findUserByEmail(email);

    if (!user) {
      // Create new user from Google
      user = {
        id: uuidv4(),
        email,
        name: name || '',
        picture: picture || '',
        googleId,
        authProvider: 'google',
        parentName: name || '',
        parentAge: '',
        parentStyle: '',
        children: [],
        challenges: [],
        createdAt: new Date().toISOString()
      };
      await createUser(user);
    } else if (!user.googleId) {
      // Link Google to existing account
      await updateUser(user.id, { googleId, picture: picture || user.picture, authProvider: 'google' });
      user.googleId = googleId;
      user.picture = picture || user.picture;
    }

    const token = 'mock-token-' + user.id;
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'שגיאה פנימית' });
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
      return res.json(sanitizeUser(user));
    }

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
    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /guest - Create a temporary guest user (auto-deletes after 3 days)
router.post('/guest', async (req, res) => {
  try {
    const GUEST_NAMES = ['נועה', 'יוסי', 'מיכל', 'אורי', 'דנה', 'עומר', 'שירה', 'איתי', 'רונית', 'גיל', 'תמר', 'אלון', 'ליאת', 'עידו', 'הדס'];
    const name = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const user = {
      id,
      email: `guest-${id.slice(0, 8)}@guest.psihologit.app`,
      name,
      picture: '',
      parentName: '',
      parentAge: '',
      parentStyle: '',
      children: [],
      challenges: [],
      isGuest: true,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    await createUser(user);
    const token = 'mock-token-' + user.id;
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Guest login error:', error);
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

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: strip sensitive fields before sending to client
function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

export default router;
