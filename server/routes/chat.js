import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON, getUserFromToken } from '../helpers.js';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// ============================================================
// OpenAI Integration - Ready for API key
// ============================================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;

async function getSystemPrompt() {
  try {
    const data = await fs.readFile(join(__dirname, '..', 'data', 'system-prompt.json'), 'utf-8');
    return JSON.parse(data).prompt;
  } catch {
    return 'את מדריכת הורים מוסמכת. את מדברת בעברית, בטון חם ואמפתי.';
  }
}

function buildSystemMessage(systemPrompt, user) {
  // Build a personalized system message with user/child context
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

// Call OpenAI API (or return mock response)
async function getAIResponse(conversationMessages, systemMessage) {
  // Build messages array in OpenAI format
  const messages = [
    { role: 'system', content: systemMessage },
    ...conversationMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))
  ];

  // If we have an API key, call OpenAI
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        return generateMockResponse();
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI request failed:', error);
      return generateMockResponse();
    }
  }

  // No API key - return mock response
  console.log('[MOCK MODE] No OPENAI_API_KEY set. Using mock response.');
  console.log('[MOCK MODE] Would send to OpenAI:', JSON.stringify(messages, null, 2).substring(0, 500) + '...');
  return generateMockResponse();
}

function generateMockResponse() {
  const responses = [
    `אני שומעת אותך, וקודם כל רוצה להגיד לך שזה לגמרי טבעי להרגיש ככה. עצם זה שאת/ה מחפש/ת עזרה מראה כמה אכפת לך 💛

הנה כמה טיפים מעשיים שיכולים לעזור:

1. **נשימה עמוקה** - לפני שמגיבים, קחו נשימה עמוקה אחת. זה נשמע פשוט אבל זה משנה את כל הדינמיקה 🧘
2. **הכרה ברגש** - במקום "אל תבכה", נסו "אני רואה שאתה עצוב, זה בסדר להיות עצוב" 🫂
3. **הצעת בחירות** - תנו לילד שתי אפשרויות מקובלות עליכם. זה נותן תחושת שליטה ומפחית התנגדות 🎯
4. **שגרה ברורה** - ילדים מרגישים בטוחים כשיש מסגרת צפויה 📋
5. **זמן איכות** - אפילו 15 דקות ביום של תשומת לב מלאה עושות פלאים ליחסים ✨

💡 *טיפ בונוס:* נסו "זמן מיוחד" - 15 דקות ביום שבהן הילד/ה בוחר/ת את הפעילות ואתם פשוט נוכחים.

רוצה שנעמיק באחד מהנושאים האלה? אני כאן בשבילך 😊`,

    `את/ה לא לבד בזה, והרבה הורים מתמודדים עם אתגרים דומים. בואו ננסה לפרק את זה ביחד 🌟

מה שחשוב להבין:

1. **ההתנהגות היא תקשורת** - ילדים מתנהגים "רע" כי הם מנסים לתקשר משהו 🤔
2. **חיבור לפני תיקון** - קודם מתחברים לרגש, אחר כך מטפלים בהתנהגות 💕
3. **גבולות עם אהבה** - גבול ברור + אמפתיה = ילד שמרגיש בטוח 🛡️
4. **תגובה במקום ריאקציה** - כשאנחנו מגיבים מתוך רוגע, הילד לומד ויסות רגשי 🧠
5. **חגיגת ההצלחות** - שימו לב ל-5 דברים טובים על כל דבר אחד שצריך שיפור 🎉

📌 *משימה קטנה להיום:* נסו לתפוס את הילד/ה עושה משהו טוב ותגידו בדיוק מה ראיתם!

אשמח לשמוע איך הולך! ספרו לי עוד ואתאים את העצות 😊`,

    `תודה ששיתפת אותי, אני מעריכה את הפתיחות שלך 🙏

בואו נסתכל על זה מזווית מקצועית:

1. **נורמליזציה** - מה שאת/ה מתאר/ת הוא שלב התפתחותי נורמלי. ילדים בגיל הזה בודקים גבולות - וזה בריא! 🌱
2. **עקביות היא המפתח** - כשאומרים "לא", חשוב להישאר עם ה"לא" גם כשקשה 🔑
3. **הורדת ציפיות** - לפעמים אנחנו מצפים מילדים להתנהג כמו מבוגרים קטנים 🧩
4. **דיבור ברמת העיניים** - פיזית, רדו לגובה הילד. זה משנה את כל האינטראקציה 👀
5. **טיפול עצמי** - הורה רגוע = ילד רגוע יותר. דאגו גם לעצמכם ❤️

🔔 *נקודה למחשבה:* מחקרים מראים ש-80% מההורות זה פשוט "להיות שם". לא צריך להיות מושלמים, צריך להיות "מספיק טובים".

מה הנושא שהכי מאתגר אותך כרגע? בואו נצלול לעומק 💪`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}


// ============================================================
// Routes
// ============================================================

// GET /conversations - List user's conversations
router.get('/conversations', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const chats = await readJSON('chats.json');
    const userConversations = chats
      .filter(c => c.userId === user.id)
      .map(c => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1] : null,
        messageCount: c.messages.length
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(userConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /conversations - Create new conversation
router.post('/conversations', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title } = req.body;

    const conversation = {
      id: uuidv4(),
      userId: user.id,
      title: title || 'שיחה חדשה',
      createdAt: new Date().toISOString(),
      messages: []
    };

    const chats = await readJSON('chats.json');
    chats.push(conversation);
    await writeJSON('chats.json', chats);

    // Also add conversation reference to user
    const users = await readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      if (!users[userIndex].conversations) users[userIndex].conversations = [];
      users[userIndex].conversations.push(conversation.id);
      await writeJSON('users.json', users);
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /conversations/:id/messages - Get messages for conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const chats = await readJSON('chats.json');
    const conversation = chats.find(c => c.id === req.params.id && c.userId === user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation.messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /conversations/:id/messages - Send message and get AI response (streaming via SSE)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const chats = await readJSON('chats.json');
    const chatIndex = chats.findIndex(c => c.id === req.params.id && c.userId === user.id);

    if (chatIndex === -1) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create user message
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Add user message to conversation
    chats[chatIndex].messages.push(userMessage);

    // Build system message with user profile context
    const systemPrompt = await getSystemPrompt();
    const systemMessage = buildSystemMessage(systemPrompt, user);

    const assistantId = uuidv4();
    const assistantTimestamp = new Date().toISOString();

    // --- SSE streaming setup ---
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send the userMessage first so frontend has the real ID
    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    // Build messages array in OpenAI format
    const messages = [
      { role: 'system', content: systemMessage },
      ...chats[chatIndex].messages.map(m => ({ role: m.role, content: m.content }))
    ];

    let fullContent = '';

    if (OPENAI_API_KEY) {
      // --- Real OpenAI streaming ---
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
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
          // Parse SSE from OpenAI
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete line

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
      // --- Mock streaming (no API key) ---
      console.log('[MOCK MODE] No OPENAI_API_KEY set. Streaming mock response.');
      fullContent = generateMockResponse();
      await streamMockResponse(res, fullContent);
    }

    // Save assistant message
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: fullContent,
      timestamp: assistantTimestamp,
    };
    chats[chatIndex].messages.push(assistantMessage);

    // Update conversation title if first message
    if (chats[chatIndex].messages.length === 2) {
      chats[chatIndex].title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    await writeJSON('chats.json', chats);

    // Send done event with final assistant message
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

// Helper: stream a mock response char-by-char with small delays
async function streamMockResponse(res, text) {
  // Stream in small chunks (2-4 chars) to simulate realistic typing
  let i = 0;
  while (i < text.length) {
    const chunkSize = Math.min(2 + Math.floor(Math.random() * 3), text.length - i);
    const chunk = text.slice(i, i + chunkSize);
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    i += chunkSize;
    await new Promise(r => setTimeout(r, 15 + Math.random() * 25));
  }
}

// POST /guest - Guest chat (no auth, no saving, streaming SSE)
router.post('/guest', async (req, res) => {
  try {
    const { content, history } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const systemPrompt = await getSystemPrompt();
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // SSE setup
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    // Build messages from history
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
            model: 'gpt-4o-mini',
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

// DELETE /conversations/:id - Delete a conversation
router.delete('/conversations/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const chats = await readJSON('chats.json');
    const filtered = chats.filter(c => !(c.id === req.params.id && c.userId === user.id));

    if (filtered.length === chats.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await writeJSON('chats.json', filtered);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
