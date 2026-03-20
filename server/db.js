import { MongoClient } from 'mongodb';

const DB_NAME = 'Psihologit';

let client = null;
let db = null;

export async function getDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('conversations').createIndex({ userId: 1 });
  await db.collection('conversations').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('conversations').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('conversations').createIndex({ lastUsedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days inactivity TTL
  await db.collection('memories').createIndex({ userId: 1 });

  // Backfill lastUsedAt for existing conversations that don't have it
  await db.collection('conversations').updateMany(
    { lastUsedAt: { $exists: false } },
    { $set: { lastUsedAt: new Date() } }
  );

  console.log('Connected to MongoDB:', DB_NAME);
  return db;
}

// --- Users ---
export async function findUserByEmail(email) {
  const database = await getDb();
  return database.collection('users').findOne({ email });
}

export async function findUserById(id) {
  const database = await getDb();
  return database.collection('users').findOne({ id });
}

export async function createUser(user) {
  const database = await getDb();
  await database.collection('users').insertOne(user);
  return user;
}

export async function updateUser(id, updates) {
  const database = await getDb();
  await database.collection('users').updateOne({ id }, { $set: updates });
  return database.collection('users').findOne({ id });
}

export async function getAllUsers() {
  const database = await getDb();
  return database.collection('users').find().toArray();
}

// --- Conversations ---
export async function getConversationsByUser(userId) {
  const database = await getDb();
  return database.collection('conversations')
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getConversationById(id, userId) {
  const database = await getDb();
  return database.collection('conversations').findOne({ id, userId });
}

export async function createConversation(conversation) {
  const database = await getDb();
  await database.collection('conversations').insertOne(conversation);
  return conversation;
}

export async function updateConversation(id, userId, updates) {
  const database = await getDb();
  await database.collection('conversations').updateOne({ id, userId }, { $set: updates });
}

export async function pushMessage(conversationId, userId, message) {
  const database = await getDb();
  await database.collection('conversations').updateOne(
    { id: conversationId, userId },
    { $push: { messages: message }, $set: { lastUsedAt: new Date() } }
  );
}

export async function updateConversationAfterChat(conversationId, userId, { title, assistantMessage }) {
  const database = await getDb();
  const update = { $push: { messages: assistantMessage } };
  update.$set = { lastUsedAt: new Date() };
  if (title) update.$set.title = title;
  await database.collection('conversations').updateOne({ id: conversationId, userId }, update);
}

export async function deleteConversation(id, userId) {
  const database = await getDb();
  const result = await database.collection('conversations').deleteOne({ id, userId });
  return result.deletedCount > 0;
}

export async function countConversations() {
  const database = await getDb();
  return database.collection('conversations').countDocuments();
}

// --- Token usage tracking ---
// Pricing per 1M tokens (as of 2026)
const MODEL_PRICING = {
  'gpt-4.1':      { input: 2.00, output: 8.00 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
};

export async function trackTokenUsage({ inputTokens, outputTokens, model = 'gpt-4.1' }) {
  const database = await getDb();
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4.1'];
  await database.collection('token_usage').insertOne({
    inputTokens,
    outputTokens,
    model,
    inputCost: (inputTokens / 1_000_000) * pricing.input,
    outputCost: (outputTokens / 1_000_000) * pricing.output,
    timestamp: new Date(),
  });
}

export async function getTokenUsageStats() {
  const database = await getDb();
  const result = await database.collection('token_usage').aggregate([
    {
      $group: {
        _id: null,
        totalInputTokens: { $sum: '$inputTokens' },
        totalOutputTokens: { $sum: '$outputTokens' },
        totalInputCost: { $sum: '$inputCost' },
        totalOutputCost: { $sum: '$outputCost' },
        totalMessages: { $sum: 1 },
      }
    }
  ]).toArray();

  if (result.length === 0) {
    return { totalInputTokens: 0, totalOutputTokens: 0, totalInputCost: 0, totalOutputCost: 0, totalMessages: 0, totalCost: 0 };
  }

  const r = result[0];
  return {
    totalInputTokens: r.totalInputTokens,
    totalOutputTokens: r.totalOutputTokens,
    totalInputCost: r.totalInputCost,
    totalOutputCost: r.totalOutputCost,
    totalMessages: r.totalMessages,
    totalCost: r.totalInputCost + r.totalOutputCost,
  };
}

// --- Settings (system prompt etc.) ---
export async function getSetting(key) {
  const database = await getDb();
  const doc = await database.collection('settings').findOne({ key });
  return doc?.value ?? null;
}

export async function setSetting(key, value) {
  const database = await getDb();
  await database.collection('settings').updateOne(
    { key },
    { $set: { key, value, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function getSystemPrompt() {
  const prompt = await getSetting('systemPrompt');
  return prompt || 'את מדריכת הורים מוסמכת עם ניסיון של שנים רבות. את מדברת בעברית, בטון חם, אמפתי ומקצועי. את נותנת עצות מעשיות ומותאמות אישית לפי גיל הילד והאתגר הספציפי. את לא פסיכולוגית - את מדריכת הורים. את משתמשת בשיטות מבוססות מחקר.';
}

export async function setSystemPrompt(prompt) {
  await setSetting('systemPrompt', prompt);
}

// --- User Memories (per-user AI context) ---
export async function getMemories(userId) {
  const database = await getDb();
  return database.collection('memories')
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function addMemory(userId, memory) {
  const database = await getDb();
  const doc = {
    id: memory.id,
    userId,
    childName: memory.childName || null,
    content: memory.content,
    category: memory.category || 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await database.collection('memories').insertOne(doc);
  return doc;
}

export async function deleteMemory(id, userId) {
  const database = await getDb();
  const result = await database.collection('memories').deleteOne({ id, userId });
  return result.deletedCount > 0;
}

// --- Auth helper ---
export async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const userId = token.replace('mock-token-', '');
  return findUserById(userId);
}
