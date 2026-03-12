import { Router } from 'express';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readJSON } from '../helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROMPT_FILE = join(__dirname, '..', 'data', 'system-prompt.json');

const router = Router();

// GET /system-prompt - Get the system prompt
router.get('/system-prompt', async (req, res) => {
  try {
    const data = await fs.readFile(PROMPT_FILE, 'utf-8');
    const promptData = JSON.parse(data);
    res.json(promptData);
  } catch (error) {
    console.error('Get system prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /system-prompt - Update the system prompt
router.put('/system-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const promptData = { prompt };
    await fs.writeFile(PROMPT_FILE, JSON.stringify(promptData, null, 2), 'utf-8');

    res.json(promptData);
  } catch (error) {
    console.error('Update system prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users - List all users (admin)
router.get('/users', async (req, res) => {
  try {
    const users = await readJSON('users.json');
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

// GET /stats - Quick stats
router.get('/stats', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    const chats = await readJSON('chats.json');
    res.json({
      totalUsers: users.length,
      totalConversations: chats.length,
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
