import 'dotenv/config';
import express from 'express';
import serverless from 'serverless-http';
import authRoutes from '../../server/routes/auth.js';
import chatRoutes from '../../server/routes/chat.js';
import userRoutes from '../../server/routes/user.js';
import adminRoutes from '../../server/routes/admin.js';
import { getDb } from '../../server/db.js';

const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check — diagnose env vars and MongoDB connection
app.get('/api/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    },
    mongodb: 'not tested',
  };

  try {
    await getDb();
    checks.mongodb = 'connected';
  } catch (err) {
    checks.mongodb = 'error: ' + err.message;
  }

  const allOk = checks.env.MONGODB_URI && checks.mongodb === 'connected';
  res.status(allOk ? 200 : 503).json({ status: allOk ? 'ok' : 'degraded', ...checks });
});

export const handler = serverless(app);
