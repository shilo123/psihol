import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import { getDb } from './db.js';
import { rateLimit } from './rateLimit.js';

// Load .env from project root (not server/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'https://psihologit.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '50kb' })); // Limit request body size

// ── Rate Limiters ──
// Global: 100 requests per minute per IP
app.use(rateLimit({ windowMs: 60_000, max: 100, prefix: 'global' }));

// Routes with per-group rate limits
// Auth: 10 login/signup attempts per minute (anti brute-force)
app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 10, prefix: 'auth', message: 'יותר מדי ניסיונות התחברות. נסו שוב בעוד דקה.' }), authRoutes);
// Chat (AI messages): 15 messages per minute per IP (protects OpenAI budget)
app.use('/api/chat', rateLimit({ windowMs: 60_000, max: 15, prefix: 'chat' }), chatRoutes);
// User profile: 20 requests per minute
app.use('/api/user', rateLimit({ windowMs: 60_000, max: 20, prefix: 'user' }), userRoutes);
// Admin: 30 requests per minute
app.use('/api/admin', rateLimit({ windowMs: 60_000, max: 30, prefix: 'admin' }), adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Pre-connect to MongoDB on startup (avoid cold start on first request)
  getDb().then(() => console.log('MongoDB pre-connected')).catch(err => console.error('MongoDB pre-connect failed:', err));
});
