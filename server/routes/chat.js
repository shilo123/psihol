import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getUserFromToken,
  getSystemPrompt,
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
} from '../db.js';

const router = Router();

// Read at runtime, not import time (dotenv loads after imports)
function getOpenAIKey() { return process.env.OPENAI_API_KEY || null; }
const MAX_MESSAGES_BEFORE_SUMMARY = 20;

// ============================================================
// Helpers
// ============================================================

function buildSystemMessage(systemPrompt, user, memories = []) {
  let contextParts = [systemPrompt];

  if (user.parentName) contextParts.push(`\nשם ההורה: ${user.parentName}`);
  if (user.parentAge) contextParts.push(`גיל ההורה: ${user.parentAge}`);
  if (user.parentStyle) contextParts.push(`סגנון הורות: ${user.parentStyle}`);

  if (user.children && user.children.length > 0) {
    contextParts.push('\nילדים:');
    user.children.forEach((child, i) => {
      const parts = [`${i + 1}. ${child.name}`];
      if (child.birthDate) parts.push(`(גיל: ${calculateAge(child.birthDate)})`);
      if (child.gender) parts.push(child.gender === 'boy' ? '- בן' : '- בת');
      if (child.personality) parts.push(`- אופי: ${child.personality}`);
      contextParts.push(parts.join(' '));
    });
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
  contextParts.push('חובה: הגבילי כל תשובה ל-60 מילים לכל היותר. זו הגבלה קשיחה. תני טיפ אחד או שניים בלבד, לא יותר. אל תמספרי רשימות ארוכות. אל תחזרי על דברים. אל תוסיפי הקדמות או סיכומים. תכנסי ישר לעניין. קצר = טוב.');

  // Follow-up suggestions instruction
  contextParts.push('\n*** שאלות המשך ***');
  contextParts.push('בסוף כל תשובה (לפני תגי confidence ו-memory), הוסיפי בדיוק 2 שאלות המשך רלוונטיות שההורה עשוי לרצות לשאול.');
  contextParts.push('השתמשי בפורמט הבא (כל שאלה בשורה נפרדת):');
  contextParts.push('[[followup:טקסט השאלה]]');
  contextParts.push('לדוגמה:');
  contextParts.push('[[followup:איך אני מתמודד/ת עם זה בלילה?]]');
  contextParts.push('[[followup:האם זה נורמלי לגיל הזה?]]');
  contextParts.push('השאלות צריכות להיות קצרות, רלוונטיות לנושא, ולעזור להורה להעמיק בנושא.');

  // Memory extraction instruction
  // Confidence score instruction
  contextParts.push('\n*** ציון ביטחון ***');
  contextParts.push('בסוף כל תשובה, הוסיפי תג מיוחד שמציין עד כמה את בטוחה בתשובה שלך בסולם 1-10:');
  contextParts.push('[[confidence:מספר]]');
  contextParts.push('לדוגמה: [[confidence:8]] אם את בטוחה מאוד, או [[confidence:4]] אם את פחות בטוחה.');
  contextParts.push('10 = בטוחה לגמרי, 1 = לא בטוחה בכלל. תני ציון כנה.');

  contextParts.push('\n*** שמירת זיכרונות ***');
  contextParts.push('כשההורה מספר פרט חשוב על ילד (למשל: בעיה ספציפית, הישג, שינוי, התנהגות חוזרת), הוסיפי בסוף התשובה שלך תג מיוחד בפורמט:');
  contextParts.push('[[memory:שם_הילד:תוכן_הזיכרון]]');
  contextParts.push('לדוגמה: [[memory:יותם:עדיין עושה קקי במכנסיים]] או [[memory:נועה:התחילה לישון לבד]]');
  contextParts.push('שמרי רק פרטים משמעותיים שיהיה חשוב לזכור בשיחות הבאות. אל תשמרי דברים טריוויאליים.');

  // Multi-child selection instructions
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

function generateMockResponse() {
  const responses = [
    `אני שומעת אותך, וקודם כל רוצה להגיד לך שזה לגמרי טבעי להרגיש ככה 💛

1. **נשימה עמוקה** - לפני שמגיבים, קחו נשימה עמוקה אחת 🧘
2. **הכרה ברגש** - במקום "אל תבכה", נסו "אני רואה שאתה עצוב" 🫂
3. **הצעת בחירות** - תנו לילד שתי אפשרויות מקובלות עליכם 🎯

רוצה שנעמיק? 😊`,

    `את/ה לא לבד בזה 🌟

1. **ההתנהגות היא תקשורת** - ילדים מנסים לתקשר משהו 🤔
2. **חיבור לפני תיקון** - קודם מתחברים לרגש, אחר כך מטפלים 💕
3. **גבולות עם אהבה** - גבול ברור + אמפתיה = ילד שמרגיש בטוח 🛡️

אשמח לשמוע עוד! 😊`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

async function streamMockResponse(res, text) {
  let i = 0;
  while (i < text.length) {
    const chunkSize = Math.min(2 + Math.floor(Math.random() * 3), text.length - i);
    const chunk = text.slice(i, i + chunkSize);
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    i += chunkSize;
    await new Promise(r => setTimeout(r, 15 + Math.random() * 25));
  }
}

// Summarize old messages when history is too long
async function summarizeHistory(messages) {
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
      }).catch(() => {});
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Summary generation failed:', error);
    return null;
  }
}

// Build the messages array for OpenAI, with optional summarization
async function buildOpenAIMessages(systemMessage, allMessages) {
  if (allMessages.length <= MAX_MESSAGES_BEFORE_SUMMARY) {
    return [
      { role: 'system', content: systemMessage },
      ...allMessages.map(m => ({ role: m.role, content: m.content }))
    ];
  }

  // Try to summarize old messages
  const summary = await summarizeHistory(allMessages);
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
async function streamOpenAI(res, messages) {
  let fullContent = '';

  if (getOpenAIKey()) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getOpenAIKey()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages,
          temperature: parseFloat(await getSetting('chatTemperature')) || 0.7,
          max_tokens: 400,
          stream: true,
          stream_options: { include_usage: true },
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status);
        fullContent = generateMockResponse();
        await streamMockResponse(res, fullContent);
      } else {
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
              // Capture usage from final chunk
              if (parsed.usage) usage = parsed.usage;
            } catch {}
          }
        }

        // Track token usage
        const inputTokens = usage?.prompt_tokens || estimateTokens(messages.map(m => m.content).join(''));
        const outputTokens = usage?.completion_tokens || estimateTokens(fullContent);
        trackTokenUsage({ inputTokens, outputTokens, model: 'gpt-4.1' }).catch(e => console.error('Token tracking error:', e));
      }
    } catch (error) {
      console.error('OpenAI stream failed:', error);
      fullContent = generateMockResponse();
      await streamMockResponse(res, fullContent);
    }
  } else {
    console.log('[MOCK MODE] No OPENAI_API_KEY set.', 'env check:', !!process.env.OPENAI_API_KEY);
    fullContent = generateMockResponse();
    await streamMockResponse(res, fullContent);
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

    const conversation = await getConversationById(req.params.id, user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    await pushMessage(conversation.id, user.id, userMessage);

    const systemPrompt = await getSystemPrompt();
    const memories = await getMemories(user.id);
    const systemMessage = buildSystemMessage(systemPrompt, user, memories);
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

    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    // Build messages with auto-summarization for long histories
    const allMessages = [...conversation.messages, userMessage];
    const messages = await buildOpenAIMessages(systemMessage, allMessages);

    let fullContent = await streamOpenAI(res, messages);

    // Extract confidence score before cleaning tags
    const confidenceScore = extractConfidence(fullContent);

    // Extract and save memories from AI response
    fullContent = await extractAndSaveMemories(user.id, fullContent);

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
    };

    const isFirstMessage = conversation.messages.length === 0;
    await updateConversationAfterChat(conversation.id, user.id, {
      title: isFirstMessage ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : null,
      assistantMessage,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Send message error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Internal server error' })}\n\n`);
      res.end();
    }
  }
});

// POST /temp - Temporary chat (authenticated but NOT saved to DB)
router.post('/temp', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    const { content, history } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required' });

    const systemPrompt = await getSystemPrompt();
    const memories = user ? await getMemories(user.id) : [];
    const systemMessage = user ? buildSystemMessage(systemPrompt, user, memories) : systemPrompt;

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

    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    // Build messages from client-side history (with summarization)
    const prevMessages = (history || []).map(m => ({ role: m.role, content: m.content }));
    const allMessages = [...prevMessages, { role: 'user', content }];
    const messages = await buildOpenAIMessages(systemMessage, allMessages);

    const fullContent = await streamOpenAI(res, messages);

    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: fullContent,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Temp chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Internal server error' })}\n\n`);
      res.end();
    }
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
