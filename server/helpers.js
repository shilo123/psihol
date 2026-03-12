import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');

const IS_NETLIFY = !!process.env.NETLIFY;

// In-memory store for serverless (Netlify) where filesystem is read-only
const memoryStore = {};

async function loadInitialData(filename) {
  try {
    const filePath = join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return filename.endsWith('.json') && filename !== 'system-prompt.json' ? [] : {};
  }
}

export async function readJSON(filename) {
  if (IS_NETLIFY) {
    if (!(filename in memoryStore)) {
      memoryStore[filename] = await loadInitialData(filename);
    }
    return memoryStore[filename];
  }

  try {
    const filePath = join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writeJSON(filename, data) {
  if (IS_NETLIFY) {
    memoryStore[filename] = data;
    return;
  }

  const filePath = join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const userId = token.replace('mock-token-', '');
  const users = await readJSON('users.json');
  return users.find(u => u.id === userId) || null;
}
