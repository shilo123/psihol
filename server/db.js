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

  client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  db = client.db(DB_NAME);

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('conversations').createIndex({ userId: 1 });
  await db.collection('conversations').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('conversations').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  // 3 days inactivity TTL - update existing TTL index if it was different
  try {
    await db.command({ collMod: 'conversations', index: { keyPattern: { lastUsedAt: 1 }, expireAfterSeconds: 3 * 24 * 60 * 60 } });
  } catch {
    await db.collection('conversations').createIndex({ lastUsedAt: 1 }, { expireAfterSeconds: 3 * 24 * 60 * 60 });
  }
  await db.collection('memories').createIndex({ userId: 1 });

  // TTL for token usage - keep for 90 days
  await db.collection('token_usage').createIndex({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
  // TTL for low confidence questions - keep for 60 days
  await db.collection('low_confidence_questions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

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

const MAX_MESSAGES_PER_CONVERSATION = 200;

export async function pushMessage(conversationId, userId, message) {
  const database = await getDb();
  await database.collection('conversations').updateOne(
    { id: conversationId, userId },
    {
      $push: { messages: { $each: [message], $slice: -MAX_MESSAGES_PER_CONVERSATION } },
      $set: { lastUsedAt: new Date() }
    }
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

const DEFAULT_TECHNICAL_PROMPT = `*** שאלות המשך ***
בסוף כל תשובה (לפני תגי confidence ו-memory), הוסיפי בדיוק 2 שאלות המשך רלוונטיות שההורה עשוי לרצות לשאול.
השתמשי בפורמט הבא (כל שאלה בשורה נפרדת):
[[followup:טקסט השאלה]]
לדוגמה:
[[followup:איך אני מתמודד/ת עם זה בלילה?]]
[[followup:האם זה נורמלי לגיל הזה?]]
השאלות צריכות להיות קצרות, רלוונטיות לנושא, ולעזור להורה להעמיק בנושא.

*** ציון ביטחון ***
בסוף כל תשובה, הוסיפי תג מיוחד שמציין עד כמה את בטוחה בתשובה שלך בסולם 1-10:
[[confidence:מספר]]
לדוגמה: [[confidence:8]] אם את בטוחה מאוד, או [[confidence:4]] אם את פחות בטוחה.
10 = בטוחה לגמרי, 1 = לא בטוחה בכלל. תני ציון כנה.

*** שמירת זיכרונות ***
כשההורה מספר פרט חשוב על ילד (למשל: בעיה ספציפית, הישג, שינוי, התנהגות חוזרת), הוסיפי בסוף התשובה שלך תג מיוחד בפורמט:
[[memory:שם_הילד:תוכן_הזיכרון]]
לדוגמה: [[memory:יותם:עדיין עושה קקי במכנסיים]] או [[memory:נועה:התחילה לישון לבד]]
שמרי רק פרטים משמעותיים שיהיה חשוב לזכור בשיחות הבאות. אל תשמרי דברים טריוויאליים.

*** זיהוי ילדים חדשים ***
ילדים רשומים במערכת: {REGISTERED_CHILDREN}
אם ההורה מזכיר ילד שלא נמצא ברשימת הילדים הרשומים, הוסיפי תג מיוחד:
[[add_child:שם:גיל:אופי]]
לדוגמה: אם ההורה אומר "הבן שלי יוסי בן 5 מאוד עקשן" ויוסי לא ברשימה, הוסיפי:
[[add_child:יוסי:5:stubborn]]
ערכי אופי אפשריים: sensitive, stubborn, anxious, energetic, calm
הוסיפי את התג רק פעם אחת לכל ילד חדש שמזוהה. המשיכי לענות כרגיל.

*** עדכון מידע על ילדים קיימים ***
ילדים רשומים ומידע קיים: {REGISTERED_CHILDREN_DETAILS}
אם ההורה מזכיר מידע חדש על ילד רשום - למשל גיל חדש ("הוא כבר בן 6", "היא עברה ל-3"), שם חדש/כינוי, או אופי שונה - הוסיפי תג:
[[update_child:שם_קיים:שדה=ערך_חדש]]
שדות אפשריים: age (גיל), name (שם חדש), personality (אופי חדש), gender (מגדר)
דוגמאות:
- ההורה אומר "יוסי כבר בן 6" והגיל הרשום הוא 5 → [[update_child:יוסי:age=6]]
- ההורה אומר "אגב, אנחנו קוראים לו יוסי, לא יוסף" → [[update_child:יוסף:name=יוסי]]
- ההורה אומר "הוא הפך להיות ילד מאוד רגיש לאחרונה" → [[update_child:יוסי:personality=sensitive]]
הוסיפי את התג רק כשהמידע החדש שונה ממה שרשום. אל תוסיפי אם הגיל/מידע זהה לרשום.`;

export async function getTechnicalPrompt() {
  const prompt = await getSetting('technicalPrompt');
  return prompt || DEFAULT_TECHNICAL_PROMPT;
}

export async function setTechnicalPrompt(prompt) {
  await setSetting('technicalPrompt', prompt);
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

  // Check for duplicate content to avoid redundant memories
  const existing = await database.collection('memories').findOne({
    userId,
    content: memory.content,
  });
  if (existing) {
    // Update timestamp instead of creating duplicate
    await database.collection('memories').updateOne(
      { id: existing.id },
      { $set: { updatedAt: new Date().toISOString() } }
    );
    return existing;
  }

  // Limit memories per user to 100 - delete oldest if exceeded
  const count = await database.collection('memories').countDocuments({ userId });
  if (count >= 100) {
    const oldest = await database.collection('memories')
      .find({ userId })
      .sort({ createdAt: 1 })
      .limit(count - 99)
      .toArray();
    if (oldest.length > 0) {
      await database.collection('memories').deleteMany({
        id: { $in: oldest.map(m => m.id) }
      });
    }
  }

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

// --- Low-confidence questions ---
export async function saveLowConfidenceQuestion(data) {
  const database = await getDb();
  await database.collection('low_confidence_questions').insertOne({
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function getLowConfidenceQuestions() {
  const database = await getDb();
  return database.collection('low_confidence_questions')
    .find()
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
}

export async function deleteLowConfidenceQuestion(id) {
  const database = await getDb();
  const result = await database.collection('low_confidence_questions').deleteOne({ id });
  return result.deletedCount > 0;
}

// --- Auth helper ---
export async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const userId = token.replace('mock-token-', '');
  return findUserById(userId);
}
