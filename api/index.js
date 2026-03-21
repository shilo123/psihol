import 'dotenv/config';
import express from 'express';
import authRoutes from '../server/routes/auth.js';
import chatRoutes from '../server/routes/chat.js';
import userRoutes from '../server/routes/user.js';
import adminRoutes from '../server/routes/admin.js';
import { getUserFromToken } from '../server/db.js';

const app = express();

app.use(express.json());

// Admin auth middleware
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

async function requireAdmin(req, res, next) {
  const user = await getUserFromToken(req);
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return res.status(403).json({ error: 'אין הרשאת מנהל' });
  }
  next();
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasOpenAI: !!process.env.OPENAI_API_KEY,
  });
});

export default app;
