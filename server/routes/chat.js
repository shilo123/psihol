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
  findUserById,
} from '../db.js';

const router = Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;

function buildSystemMessage(systemPrompt, user) {
  let contextParts = [systemPrompt];

  if (user.parentName) {
    contextParts.push(`\nשם ההורה: ${user.parentName}`);
  }
  if (user.parentAge) {
    contextParts.push(`גיל ההורה: ${user.parentAge}`);
  }
  if (user.parentStyle) {
    contextParts.push(`סגנון הורות: ${user.parentStyle}`);
  }

  if (user.children && user.children.length > 0) {
    contextParts.push('\nילדים:');
    user.children.forEach((child, i) => {
      const parts = [`${i + 1}. ${child.name}`];
      if (child.birthDate) {
        const age = calculateAge(child.birthDate);
        parts.push(`(גיל: ${age})`);
      }
      if (child.gender) {
        parts.push(child.gender === 'boy' ? '- בן' : '- בת');
      }
      if (child.personality) {
        parts.push(`- אופי: ${child.personality}`);
      }
      contextParts.push(parts.join(' '));
    });
  }

  if (user.challenges && user.challenges.length > 0) {
    const challengeLabels = {
      tantrums: 'התפרצויות זעם',
      defiance: 'סירוב לשמוע',
      sleep: 'קושי בשינה',
      siblings: 'ריבים בין אחים',
      separation: 'חרדת נטישה',
      eating: 'בעיות אכילה',
      screens: 'התמכרות למסכים',
      social: 'קשיים חברתיים',
    };
    const labels = user.challenges.map(c => challengeLabels[c] || c);
    contextParts.push(`\nאתגרים מרכזיים: ${labels.join(', ')}`);
  }

  contextParts.push('\nהתאימי את התשובות שלך לפרופיל הספציפי של הילד/ים. השתמשי בשמות שלהם. התייחסי לגיל ולאתגרים.');

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
    `אני שומעת אותך, וקודם כל רוצה להגיד לך שזה לגמרי טבעי להרגיש ככה. עצם זה שאת/ה מחפש/ת עזרה מראה כמה אכפת לך 💛

הנה כמה טיפים מעשיים שיכולים לעזור:

1. **נשימה עמוקה** - לפני שמגיבים, קחו נשימה עמוקה אחת 🧘
2. **הכרה ברגש** - במקום "אל תבכה", נסו "אני רואה שאתה עצוב" 🫂
3. **הצעת בחירות** - תנו לילד שתי אפשרויות מקובלות עליכם 🎯

רוצה שנעמיק באחד מהנושאים האלה? 😊`,

    `את/ה לא לבד בזה, והרבה הורים מתמודדים עם אתגרים דומים 🌟

1. **ההתנהגות היא תקשורת** - ילדים מתנהגים "רע" כי הם מנסים לתקשר משהו 🤔
2. **חיבור לפני תיקון** - קודם מתחברים לרגש, אחר כך מטפלים בהתנהגות 💕
3. **גבולות עם אהבה** - גבול ברור + אמפתיה = ילד שמרגיש בטוח 🛡️

אשמח לשמוע איך הולך! 😊`,
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
      messages: []
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

    // Create user message
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Save user message to DB immediately
    await pushMessage(conversation.id, user.id, userMessage);

    // Build system message with user profile context
    const systemPrompt = await getSystemPrompt();
    const systemMessage = buildSystemMessage(systemPrompt, user);

    const assistantId = uuidv4();
    const assistantTimestamp = new Date().toISOString();

    // SSE streaming setup
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    // Build messages for OpenAI
    const allMessages = [...conversation.messages, userMessage];
    const messages = [
      { role: 'system', content: systemMessage },
      ...allMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    let fullContent = '';

    if (OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1',
            messages,
            temperature: 0.7,
            max_tokens: 1500,
            stream: true,
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
              } catch {}
            }
          }
        }
      } catch (error) {
        console.error('OpenAI stream failed:', error);
        fullContent = generateMockResponse();
        await streamMockResponse(res, fullContent);
      }
    } else {
      console.log('[MOCK MODE] No OPENAI_API_KEY set.');
      fullContent = generateMockResponse();
      await streamMockResponse(res, fullContent);
    }

    // Save assistant message to DB
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: fullContent,
      timestamp: assistantTimestamp,
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

// POST /guest - Guest chat (no auth, no saving, streaming SSE)
router.post('/guest', async (req, res) => {
  try {
    const { content, history } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required' });

    const systemPrompt = await getSystemPrompt();
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    const prevMessages = (history || []).map(m => ({ role: m.role, content: m.content }));
    const messages = [
      { role: 'system', content: systemPrompt },
      ...prevMessages,
      { role: 'user', content }
    ];

    let fullContent = '';
    const assistantId = uuidv4();

    if (OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1',
            messages,
            temperature: 0.7,
            max_tokens: 1500,
            stream: true,
          }),
        });

        if (!response.ok) {
          fullContent = generateMockResponse();
          await streamMockResponse(res, fullContent);
        } else {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
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
              } catch {}
            }
          }
        }
      } catch {
        fullContent = generateMockResponse();
        await streamMockResponse(res, fullContent);
      }
    } else {
      fullContent = generateMockResponse();
      await streamMockResponse(res, fullContent);
    }

    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: fullContent,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Guest chat error:', error);
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
