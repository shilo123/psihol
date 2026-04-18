import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getUserFromToken,
  getSystemPrompt,
  getTechnicalPrompt,
  getConversationsByUser,
  getConversationById,
  createConversation,
  pushMessage,
  updateConversationAfterChat,
  deleteConversation,
  updateConversation,
  trackTokenUsage,
  getMemories,
  addMemory,
  getSetting,
  saveLowConfidenceQuestion,
  DEFAULT_TECHNICAL_PROMPT,
  incrementBoundaryCount,
  calculateProgramDay,
} from '../db.js';
import boundariesProgram from '../../shared/programs/boundaries.json' with { type: 'json' };

const router = Router();

// Read at runtime, not import time (dotenv loads after imports)
function getOpenAIKey() { return process.env.OPENAI_API_KEY || null; }
const MAX_MESSAGES_BEFORE_SUMMARY = 20;

// ============================================================
// Helpers
// ============================================================

// Detect which child is being discussed based on conversation history
function detectActiveChild(messages, children) {
  if (!children || children.length === 0) return null;
  if (children.length === 1) return children[0];

  // Scan messages from newest to oldest for child selection
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user') {
      const match = msg.content.match(/^אני מדבר\/ת על (.+)$/);
      if (match) {
        const selectedName = match[1].trim();
        const child = children.find(c => c.name === selectedName);
        if (child) return child;
      }
    }
  }
  return null;
}

function buildSystemMessage(systemPrompt, technicalPrompt, user, memories = []) {
  let contextParts = [systemPrompt];

  if (user.parentName) contextParts.push(`\nשם ההורה: ${user.parentName}`);
  if (user.parentGender) {
    const genderLabel = user.parentGender === 'mom' ? 'אמא' : 'אבא';
    const genderInstruction = user.parentGender === 'mom'
      ? 'פני אליה בלשון נקבה: "את", "שלך", "נסי", "עשית" וכו\'. אל תשתמשי בלשון זכר כלפיה.'
      : 'פני אליו בלשון זכר: "אתה", "שלך", "נסה", "עשית" וכו\'. אל תשתמשי בלשון נקבה כלפיו.';
    contextParts.push(`ההורה הוא: ${genderLabel}`);
    contextParts.push(`*** חשוב - מגדר ההורה ***\n${genderInstruction}`);
  }
  // Dynamic parent age - calculate from birth year if available, otherwise use static
  if (user.parentBirthYear) {
    const dynamicAge = new Date().getFullYear() - user.parentBirthYear;
    contextParts.push(`גיל ההורה: ${dynamicAge}`);
  } else if (user.parentAge) {
    contextParts.push(`גיל ההורה: ${user.parentAge}`);
  }
  if (user.parentStyle) contextParts.push(`סגנון הורות: ${user.parentStyle}`);

  const personalityHebrew = {
    sensitive: 'רגיש/ה', stubborn: 'עקשן/ית', anxious: 'חרדתי/ת',
    energetic: 'אנרגטי/ת', calm: 'רגוע/ה',
  };

  if (user.children && user.children.length > 0) {
    contextParts.push('\nילדים:');
    user.children.forEach((child, i) => {
      const genderLabel = child.gender === 'girl' ? 'בת' : 'בן';
      const genderNote = child.gender === 'girl' ? '(נקבה - דברי עליה בלשון נקבה!)' : '(זכר - דבר עליו בלשון זכר!)';
      const persLabel = personalityHebrew[child.personality] || child.personality || '';
      const parts = [`${i + 1}. ${child.name} - ${genderLabel} ${genderNote}`];
      if (child.birthDate) parts.push(`גיל: ${calculateAge(child.birthDate)}`);
      if (persLabel) parts.push(`אופי: ${persLabel}`);
      contextParts.push(parts.join(', '));
    });
    contextParts.push('\n*** חשוב מאוד - מגדר ***');
    contextParts.push('כשאת מדברת על ילד (בן), השתמשי בלשון זכר: "הוא", "שלו", "עושה", "רוצה", "מרגיש".');
    contextParts.push('כשאת מדברת על ילדה (בת), השתמשי בלשון נקבה: "היא", "שלה", "עושה", "רוצה", "מרגישה".');
    contextParts.push('זה קריטי - אל תערבבי בין לשון זכר לנקבה. התאימי את כל הפניות, הכינויים והפעלים למגדר הנכון של הילד/ה.');
  }

  if (user.challenges && user.challenges.length > 0) {
    const challengeLabels = {
      tantrums: 'התפרצויות זעם', defiance: 'סירוב לשמוע', sleep: 'קושי בשינה',
      siblings: 'ריבים בין אחים', separation: 'חרדת נטישה', eating: 'בעיות אכילה',
      screens: 'התמכרות למסכים', social: 'קשיים חברתיים',
    };
    const labels = user.challenges.map(c => challengeLabels[c] || c);
    contextParts.push(`\nאתגרים מרכזיים: ${labels.join(', ')}`);
  }

  // User memories - things the AI remembers about this family
  if (memories.length > 0) {
    contextParts.push('\n*** זיכרונות מהשיחות הקודמות (השתמשי בהם בעדינות ובדרך אגב) ***');
    memories.forEach(m => {
      const childNote = m.childName ? ` (${m.childName})` : '';
      contextParts.push(`- ${m.content}${childNote}`);
    });
    contextParts.push('השתמשי בזיכרונות אלה כדי להראות שאת מכירה את המשפחה. אל תציגי אותם כרשימה - שלבי אותם בטבעיות בשיחה. למשל: "אגב, מה עם..." או "איך הולך עם..."');
  }

  contextParts.push('\nהתאימי את התשובות שלך לפרופיל הספציפי של הילד/ים. השתמשי בשמות שלהם. התייחסי לגיל ולאתגרים.');
  contextParts.push('*** חשוב מאוד - אורך התשובה ***');
  contextParts.push('הגבילי כל תשובה ל-150 מילים לכל היותר. תני תשובה מפורטת ומועילה עם 2-3 טיפים מעשיים. אל תחזרי על דברים. תכנסי ישר לעניין אבל תני מספיק פירוט שההורה ירגיש שקיבל ערך אמיתי.');

  // Technical instructions (follow-up questions, confidence scores, memory extraction, child detection)
  // Replace {REGISTERED_CHILDREN} placeholder with actual registered children names
  const registeredNames = (user.children && user.children.length > 0)
    ? user.children.map(c => c.name).join(', ')
    : 'אין ילדים רשומים';
  // Replace {REGISTERED_CHILDREN_DETAILS} with detailed child info for update detection
  const personalityHeb = { sensitive: 'רגיש/ה', stubborn: 'עקשן/ית', anxious: 'חרדתי/ת', energetic: 'אנרגטי/ת', calm: 'רגוע/ה' };
  const registeredDetails = (user.children && user.children.length > 0)
    ? user.children.map(c => {
        const age = c.birthDate ? Math.floor((Date.now() - new Date(c.birthDate).getTime()) / (365.25 * 86400000)) : (c.age || '?');
        const gender = c.gender === 'girl' ? 'בת' : 'בן';
        const pers = personalityHeb[c.personality] || c.personality || '';
        return `${c.name} (${gender}, גיל ${age}, אופי: ${pers})`;
      }).join('; ')
    : 'אין ילדים רשומים';
  const resolvedTechnicalPrompt = technicalPrompt
    .replace('{REGISTERED_CHILDREN}', registeredNames)
    .replace('{REGISTERED_CHILDREN_DETAILS}', registeredDetails);
  contextParts.push('\n' + resolvedTechnicalPrompt);

  // Program context (intervention plan)
  if (user.program && user.program.programId === 'boundaries') {
    const { day: currentDay, completed } = calculateProgramDay(user.program.startedAt);
    const rawDay = !completed ? boundariesProgram.days.find(d => d.day === currentDay) : null;
    if (rawDay) {
      const g = user.parentGender === 'dad' ? 'dad' : 'mom';
      const title = rawDay[`title_${g}`] || rawDay.title_mom;
      const instructions = rawDay[`instructions_${g}`] || rawDay.instructions_mom;
      const selfSentences = rawDay[`practice_sentences_for_self_${g}`] || rawDay.practice_sentences_for_self_mom;
      const commonMistake = rawDay[`common_mistake_${g}`] || rawDay.common_mistake;

      contextParts.push(`\n*** תוכנית התערבות פעילה — הצבת גבולות ***`);
      contextParts.push(`ההורה נמצא/ת ביום ${rawDay.day} מתוך 5 בתוכנית "הצבת גבולות".`);
      contextParts.push(`נושא היום: ${title}`);
      contextParts.push(`הנחיות היום: ${instructions.join(' | ')}`);
      if (selfSentences) {
        contextParts.push(`משפטים לתרגול עצמי: ${selfSentences.join(' | ')}`);
      }
      if (rawDay.sentences_to_child) {
        contextParts.push(`משפטים לילד: ${rawDay.sentences_to_child.join(' | ')}`);
      }
      contextParts.push(`טעות נפוצה ביום הזה: ${commonMistake}`);
      contextParts.push(`כשההורה שואל/ת שאלות שקשורות לגבולות, שלבי את תוכן התוכנית בתשובה בצורה טבעית. הזכירי באיזה יום הם בתוכנית ומה הנושא של היום.`);
      contextParts.push(`אם השאלה לא קשורה לגבולות — ענו כרגיל בלי להזכיר את התוכנית.`);
    }
  }

  // Boundary detection tag (for non-program users)
  if (!user.program && !user.programDismissed) {
    contextParts.push(`\n*** חובה — זיהוי שאלות שקשורות להצבת גבולות ***`);
    contextParts.push(`היי רגישה מאוד לזיהוי הזה. אם השאלה של ההורה קשורה — ישירות או בעקיפין — לאחד מהנושאים הבאים, הוסיפי את התג [[boundary_related:true]] בסוף התשובה:`);
    contextParts.push(`- הצבת גבולות, חוקים, כללים, סדר, שגרה, עקביות`);
    contextParts.push(`- ילד שלא מקשיב, לא שומע, לא שומע בקול, מתעלם`);
    contextParts.push(`- ילד שלא משתף פעולה, מסרב, אומר "לא", מתנגד`);
    contextParts.push(`- התנהגות מאתגרת: צעקות, היסטריות, זריקת חפצים, דחיפות, חוצפות, מילים גסות`);
    contextParts.push(`- ויכוחים, מריבות, עימותים עם הילד`);
    contextParts.push(`- שעת שינה, זמן מסך, פלאפון, טאבלט, טלוויזיה — כשהילד לא מוכן להפסיק`);
    contextParts.push(`- אכילה כשהילד מסרב, קימות בלילה כשקשורות לחוסר גבולות`);
    contextParts.push(`- עונשים, תגמולים, תוצאות, "אם... אז..."`);
    contextParts.push(`- הורה שמרגיש/ה חסר/ת אונים, לא יודע/ת איך להגיב, מאבד/ת שליטה`);
    contextParts.push(`- ילד שתמיד רוצה עוד, לא מסתפק, דורשני`);
    contextParts.push(`- ריבים בין אחים כשקשורים לחוסר כללים`);
    contextParts.push(`דוגמאות לשאלות שחייבות להיות מזוהות:`);
    contextParts.push(`"הילד שלי לא הולך לישון" → כן! [[boundary_related:true]]`);
    contextParts.push(`"הילד צועק עליי כשאני אומרת לא" → כן! [[boundary_related:true]]`);
    contextParts.push(`"מה עושים כשהילד לא מוכן לעזוב את הפלאפון" → כן! [[boundary_related:true]]`);
    contextParts.push(`"הבן שלי מרביץ לאחות" → כן! [[boundary_related:true]]`);
    contextParts.push(`"איך גורמים לילד לשמוע" → כן! [[boundary_related:true]]`);
    contextParts.push(`אם בספק — עדיף לסמן כן. רק שאלות שבאמת לא קשורות (למשל התפתחות, חיתולים, אוכל בריא) — אל תסמני.`);
  }

  // Multi-child selection instructions (dynamic, depends on user's children)
  if (user.children && user.children.length > 1) {
    const childButtons = user.children.map(c => `[[child:${c.name}:${c.personality || 'calm'}:${c.gender || 'boy'}]]`).join(' ');
    contextParts.push(`\n*** הוראה קריטית - בחירת ילד ***`);
    contextParts.push(`להורה הזה יש ${user.children.length} ילדים. בהודעה הראשונה בכל שיחה חדשה, או כשלא ברור על איזה ילד מדובר, חובה לשאול את ההורה על איזה ילד הוא/היא רוצה לדבר.`);
    contextParts.push(`את חייבת להציג את הכפתורים האלה בשורה נפרדת כדי שההורה יוכל לבחור:`);
    contextParts.push(childButtons);
    contextParts.push(`הפורמט [[child:שם:אופי]] הוא חובה - המערכת הופכת אותו לכפתורים לחיצים. אל תשני את הערכים.`);
    contextParts.push(`דוגמה לתשובה ראשונה: "שלום ${user.parentName}! שמחה לראות אותך 😊 על איזה מהילדים תרצה לדבר היום?\n\n${childButtons}"`);
  }

  return contextParts.join('\n');
}

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years < 1) return `${months} חודשים`;
  if (years === 1) return 'שנה';
  return `${years} שנים`;
}

// Summarize old messages when history is too long
async function summarizeHistory(messages, userId = null) {
  if (!getOpenAIKey() || messages.length <= MAX_MESSAGES_BEFORE_SUMMARY) {
    return null;
  }

  // Keep last 10 messages as-is, summarize the rest
  const toSummarize = messages.slice(0, -10);
  const summaryMessages = [
    {
      role: 'system',
      content: 'סכמי את השיחה הבאה בין הורה למדריכת הורים. כתבי סיכום תמציתי בעברית שכולל: הנושאים שנידונו, העצות שניתנו, והבעיות המרכזיות. כתבי בגוף שלישי. מקסימום 300 מילים.'
    },
    ...toSummarize.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getOpenAIKey()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: summaryMessages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const usage = data.usage;
    if (usage) {
      trackTokenUsage({
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        model: 'gpt-4.1-mini',
        userId,
      }).catch(() => {});
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Summary generation failed:', error);
    return null;
  }
}

// Build the messages array for OpenAI, with optional summarization
async function buildOpenAIMessages(systemMessage, allMessages, userId = null) {
  if (allMessages.length <= MAX_MESSAGES_BEFORE_SUMMARY) {
    return [
      { role: 'system', content: systemMessage },
      ...allMessages.map(m => ({ role: m.role, content: m.content }))
    ];
  }

  // Try to summarize old messages
  const summary = await summarizeHistory(allMessages, userId);
  const recentMessages = allMessages.slice(-10);

  if (summary) {
    return [
      { role: 'system', content: systemMessage + `\n\nסיכום השיחה עד כה:\n${summary}` },
      ...recentMessages.map(m => ({ role: m.role, content: m.content }))
    ];
  }

  // Fallback: just use last 20 messages
  const fallback = allMessages.slice(-MAX_MESSAGES_BEFORE_SUMMARY);
  return [
    { role: 'system', content: systemMessage },
    ...fallback.map(m => ({ role: m.role, content: m.content }))
  ];
}

// Estimate tokens (rough: 1 token ≈ 4 chars for Hebrew/mixed)
function estimateTokens(text) {
  return Math.ceil((text || '').length / 3);
}

// Stream OpenAI response
async function streamOpenAI(res, messages, userId = null) {
  let fullContent = '';

  if (getOpenAIKey()) {
    try {
      const temperature = await getSetting('chatTemperature').catch(() => null);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getOpenAIKey()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: 1000,
          stream: true,
          stream_options: { include_usage: true },
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('OpenAI API error:', response.status, errText);
        throw new Error(`שגיאת OpenAI (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let usage = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
            }
            if (parsed.usage) usage = parsed.usage;
          } catch {}
        }
      }

      // Track token usage (non-blocking, ignore DB errors)
      const inputTokens = usage?.prompt_tokens || estimateTokens(messages.map(m => m.content).join(''));
      const outputTokens = usage?.completion_tokens || estimateTokens(fullContent);
      trackTokenUsage({ inputTokens, outputTokens, model: 'gpt-4.1', userId }).catch(() => {});

    } catch (error) {
      console.error('OpenAI stream failed:', error);
      throw error; // Propagate to caller — don't fake a response
    }
  } else {
    console.error('[ERROR] No OPENAI_API_KEY set.');
    throw new Error('מפתח OpenAI לא מוגדר בשרת');
  }

  return fullContent;
}

// Extract confidence score from AI response
function extractConfidence(content) {
  const match = content.match(/\[\[confidence:(\d+)\]\]/);
  if (match) {
    const score = parseInt(match[1], 10);
    return Math.min(10, Math.max(1, score));
  }
  return null;
}

// Extract and save memories from AI response
async function extractAndSaveMemories(userId, content) {
  const regex = /\[\[memory:([^:\]]+):([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const childName = match[1].trim();
    const memoryContent = match[2].trim();
    try {
      await addMemory(userId, {
        id: uuidv4(),
        childName,
        content: memoryContent,
        category: 'observation',
      });
    } catch (e) {
      console.error('Failed to save memory:', e);
    }
  }
  // Return content without memory, confidence, and followup tags (followups kept for client rendering)
  return content.replace(/\s*\[\[memory:[^\]]+\]\]/g, '').replace(/\s*\[\[confidence:\d+\]\]/g, '');
}

// ============================================================
// Routes
// ============================================================

// GET /conversations
router.get('/conversations', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const conversations = await getConversationsByUser(user.id);
    res.json(conversations.map(c => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1] : null,
      messageCount: c.messages.length
    })));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /conversations
router.post('/conversations', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { title } = req.body;
    const conversation = {
      id: uuidv4(),
      userId: user.id,
      title: title || 'שיחה חדשה',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date(),
      messages: [],
      ...(user.isGuest ? { expiresAt: user.expiresAt } : {}),
    };

    await createConversation(conversation);
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const conversation = await getConversationById(req.params.id, user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Reset 30-day inactivity timer
    updateConversation(req.params.id, user.id, { lastUsedAt: new Date() }).catch(() => {});

    res.json(conversation.messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /conversations/:id/messages - Send message + AI response (SSE streaming)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required' });
    if (content.length > 5000) return res.status(400).json({ error: 'ההודעה ארוכה מדי. מקסימום 5000 תווים.' });

    const conversation = await getConversationById(req.params.id, user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    await pushMessage(conversation.id, user.id, userMessage);

    const [systemPrompt, technicalPrompt] = await Promise.all([getSystemPrompt(), getTechnicalPrompt()]);
    const memories = await getMemories(user.id);
    const systemMessage = buildSystemMessage(systemPrompt, technicalPrompt, user, memories);
    const assistantId = uuidv4();
    const assistantTimestamp = new Date().toISOString();

    // SSE setup - disable buffering for real-time streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    // Disable Nagle's algorithm for immediate chunk delivery
    res.socket?.setNoDelay?.(true);

    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    // Build messages with auto-summarization for long histories
    const allMessages = [...conversation.messages, userMessage];
    const messages = await buildOpenAIMessages(systemMessage, allMessages, user.id);

    // Detect active child from conversation history
    const activeChild = detectActiveChild(allMessages, user.children);

    let fullContent = await streamOpenAI(res, messages, user.id);

    // Extract confidence score before cleaning tags
    const confidenceScore = extractConfidence(fullContent);

    // Extract and save memories from AI response
    fullContent = await extractAndSaveMemories(user.id, fullContent);

    // Extract boundary_related tag and track count
    let boundaryCount = user.boundaryQuestionCount || 0;
    const boundaryMatch = fullContent.match(/\[\[boundary_related:true\]\]/);
    // Fallback: keyword detection on user's question if AI didn't tag it
    const boundaryKeywords = /גבול|משמעת|כלל|עקביות|לא מקשיב|לא שומע|סירוב|מסרב|לא רוצה|ויכוח|צעקות|צועק|עונש|חוק|שגרה|לא שומעת? בקול|מתנגד|מתנגדת|לא מוכן|לא מפסיק|היסטרי|זורק|זורקת|דוחף|דוחפת|מרביץ|חוצפ|מילים גסות|לא הולך לישון|לישון בזמן|פלאפון|מסך|טאבלט|לא מפסיק לשחק|לא עוזב|לא עושה שיעורים|לא מסדר|לא מנקה|חסר אונים|חסרת אונים|מאבד שליטה|מאבדת שליטה|לא יודע מה לעשות|לא יודעת מה לעשות|איך גורמים|איך לגרום|למה הוא לא|למה היא לא|תמיד רוצה עוד|דורשני|מפנק|לא מסתפק|קשה לי עם/;
    const isBoundaryQuestion = boundaryMatch || (!user.program && !user.programDismissed && boundaryKeywords.test(content));
    if (isBoundaryQuestion) {
      fullContent = fullContent.replace(/\s*\[\[boundary_related:true\]\]/g, '');
      boundaryCount = await incrementBoundaryCount(user.id);
    }

    // Save low-confidence questions (score < 6)
    if (confidenceScore !== null && confidenceScore < 6) {
      saveLowConfidenceQuestion({
        id: uuidv4(),
        userId: user.id,
        userName: user.parentName || user.name || 'אורח',
        question: content,
        answer: fullContent,
        confidenceScore,
        conversationId: conversation.id,
      }).catch(e => console.error('Failed to save low-confidence question:', e));
    }

    // Save assistant message
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: fullContent,
      timestamp: assistantTimestamp,
      confidenceScore: confidenceScore || undefined,
      activeChildId: activeChild?.id || undefined,
      activeChildName: activeChild?.name || undefined,
    };

    const isFirstMessage = conversation.messages.length === 0;
    await updateConversationAfterChat(conversation.id, user.id, {
      title: isFirstMessage ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : null,
      assistantMessage,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage, boundaryCount })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Send message error:', error);
    const errMsg = error.message || 'שגיאה פנימית בשרת';
    if (!res.headersSent) {
      res.status(500).json({ error: errMsg });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`);
      res.end();
    }
  }
});

// POST /temp - Temporary chat (authenticated but NOT saved to DB)
router.post('/temp', async (req, res) => {
  try {
    const { content, history } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required' });
    if (content.length > 5000) return res.status(400).json({ error: 'ההודעה ארוכה מדי. מקסימום 5000 תווים.' });

    // Resilient to DB failures — fallback to defaults if DB is down
    const FALLBACK_PROMPT = 'את מדריכת הורים מוסמכת עם ניסיון של שנים רבות. את מדברת בעברית, בטון חם, אמפתי ומקצועי. את נותנת עצות מעשיות ומותאמות אישית לפי גיל הילד והאתגר הספציפי. את לא פסיכולוגית - את מדריכת הורים. את משתמשת בשיטות מבוססות מחקר.';
    let user = null, systemPrompt = FALLBACK_PROMPT, technicalPrompt = '', memories = [];
    try {
      [user, systemPrompt, technicalPrompt] = await Promise.all([
        getUserFromToken(req).catch(() => null),
        getSystemPrompt().catch(() => FALLBACK_PROMPT),
        getTechnicalPrompt().catch(() => DEFAULT_TECHNICAL_PROMPT),
      ]);
      if (user) memories = await getMemories(user.id).catch(() => []);
    } catch { /* DB down — proceed with defaults */ }
    const systemMessage = user ? buildSystemMessage(systemPrompt, technicalPrompt, user, memories) : systemPrompt;

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    res.socket?.setNoDelay?.(true);

    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    // Build messages from client-side history (with summarization)
    const prevMessages = (history || []).map(m => ({ role: m.role, content: m.content }));
    const allMessages = [...prevMessages, { role: 'user', content }];
    const messages = await buildOpenAIMessages(systemMessage, allMessages, user?.id);

    let fullContent = await streamOpenAI(res, messages, user?.id);

    // Extract boundary_related tag for temp chat too
    let boundaryCount = user?.boundaryQuestionCount || 0;
    const boundaryMatch = fullContent.match(/\[\[boundary_related:true\]\]/);
    const boundaryKeywords = /גבול|משמעת|כלל|עקביות|לא מקשיב|לא שומע|סירוב|מסרב|לא רוצה|ויכוח|צעקות|צועק|עונש|חוק|שגרה|לא שומעת? בקול|מתנגד|מתנגדת|לא מוכן|לא מפסיק/;
    const isBoundaryQuestion = boundaryMatch || (user && !user.program && !user.programDismissed && boundaryKeywords.test(content));
    if (isBoundaryQuestion && user) {
      fullContent = fullContent.replace(/\s*\[\[boundary_related:true\]\]/g, '');
      boundaryCount = await incrementBoundaryCount(user.id);
    } else if (boundaryMatch) {
      fullContent = fullContent.replace(/\s*\[\[boundary_related:true\]\]/g, '');
    }

    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: fullContent,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage, boundaryCount })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Temp chat error:', error);
    const errMsg = error.message || 'שגיאה פנימית בשרת';
    if (!res.headersSent) {
      res.status(500).json({ error: errMsg });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`);
      res.end();
    }
  }
});

// PUT /conversations/:id - Rename conversation
router.put('/conversations/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    await updateConversation(req.params.id, user.id, { title: title.trim() });
    res.json({ success: true });
  } catch (error) {
    console.error('Rename conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /conversations/:id
router.delete('/conversations/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const deleted = await deleteConversation(req.params.id, user.id);
    if (!deleted) return res.status(404).json({ error: 'Conversation not found' });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
