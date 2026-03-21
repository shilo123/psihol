import 'dotenv/config';
import express from 'express';
import authRoutes from '../server/routes/auth.js';
import chatRoutes from '../server/routes/chat.js';
import userRoutes from '../server/routes/user.js';
import adminRoutes from '../server/routes/admin.js';
const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasOpenAI: !!process.env.OPENAI_API_KEY,
  });
});

export default app;
