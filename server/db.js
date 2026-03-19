import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'Psihologit';

let client = null;
let db = null;

export async function getDb() {
  if (db) return db;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('conversations').createIndex({ userId: 1 });
  await db.collection('conversations').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('conversations').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

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
    { $push: { messages: message } }
  );
}

export async function updateConversationAfterChat(conversationId, userId, { title, assistantMessage }) {
  const database = await getDb();
  const update = { $push: { messages: assistantMessage } };
  if (title) update.$set = { title };
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

// --- Auth helper ---
export async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const userId = token.replace('mock-token-', '');
  return findUserById(userId);
}
