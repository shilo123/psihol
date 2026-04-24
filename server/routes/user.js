import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromToken, updateUser, findUserById, getDb, startProgram, calculateProgramDay, dismissProgram, saveFcmToken } from '../db.js';
import boundariesProgram from '../../shared/programs/boundaries.json' with { type: 'json' };

// Resolve gendered fields in program day data based on parent gender
function resolveDayContent(rawDay, gender) {
  const g = gender === 'dad' ? 'dad' : 'mom';
  return {
    day: rawDay.day,
    title: rawDay[`title_${g}`] || rawDay.title_mom,
    instructions: rawDay[`instructions_${g}`] || rawDay.instructions_mom,
    practice_sentences_for_self: rawDay[`practice_sentences_for_self_${g}`] || rawDay.practice_sentences_for_self_mom || null,
    sentences_to_child: rawDay.sentences_to_child || null,
    common_mistake: rawDay[`common_mistake_${g}`] || rawDay.common_mistake || null,
  };
}

const router = Router();

// GET /profile
router.get('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /profile
router.put('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { parentName, parentAge, parentStyle, challenges } = req.body;
    const updates = {};
    if (parentName !== undefined) updates.parentName = parentName;
    if (parentAge !== undefined) updates.parentAge = parentAge;
    if (parentStyle !== undefined) updates.parentStyle = parentStyle;
    if (challenges !== undefined) updates.challenges = challenges;

    const updatedUser = await updateUser(user.id, updates);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /children
router.get('/children', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(user.children || []);
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /children
router.post('/children', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, birthDate, age, gender, personality } = req.body;
    if (!name) return res.status(400).json({ error: 'Child name is required' });

    // If age is provided instead of birthDate, calculate birthDate from age
    let resolvedBirthDate = birthDate || '';
    if (!resolvedBirthDate && age !== undefined && age !== '') {
      const now = new Date();
      const birthYear = now.getFullYear() - parseInt(age, 10);
      resolvedBirthDate = new Date(birthYear, now.getMonth(), now.getDate()).toISOString();
    }

    const child = {
      id: uuidv4(),
      name,
      birthDate: resolvedBirthDate,
      gender: gender || '',
      personality: personality || ''
    };

    const children = [...(user.children || []), child];
    await updateUser(user.id, { children });

    res.status(201).json(child);
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /children/:id
router.put('/children/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, birthDate, age, gender, personality } = req.body;
    const children = [...(user.children || [])];
    const childIndex = children.findIndex(c => c.id === req.params.id);

    if (childIndex === -1) return res.status(404).json({ error: 'Child not found' });

    if (name !== undefined) children[childIndex].name = name;
    if (birthDate !== undefined) {
      children[childIndex].birthDate = birthDate;
    } else if (age !== undefined && age !== '') {
      // Convert age to birthDate
      const now = new Date();
      const birthYear = now.getFullYear() - parseInt(age, 10);
      children[childIndex].birthDate = new Date(birthYear, now.getMonth(), now.getDate()).toISOString();
    }
    if (gender !== undefined) children[childIndex].gender = gender;
    if (personality !== undefined) children[childIndex].personality = personality;

    await updateUser(user.id, { children });
    res.json(children[childIndex]);
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Program endpoints ----

// GET /program/status
router.get('/program/status', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!user.program) return res.json({ active: false, dismissed: !!user.programDismissed, boundaryQuestionCount: user.boundaryQuestionCount || 0 });

    // Calculate day automatically from start date
    const { day: currentDay, completed } = calculateProgramDay(user.program.startedAt);

    if (completed) {
      // Program finished (past day 5) — mark as done
      const db = await getDb();
      await db.collection('users').updateOne({ id: user.id }, { $unset: { program: '' } });
      return res.json({ active: false, completed: true, dismissed: false, boundaryQuestionCount: user.boundaryQuestionCount || 0 });
    }

    const rawDay = boundariesProgram.days.find(d => d.day === currentDay) || null;
    const dayContent = rawDay ? resolveDayContent(rawDay, user.parentGender) : null;

    // All days up to the current one — so the parent can revisit past days
    const availableDays = [];
    for (let d = 1; d <= currentDay; d++) {
      const raw = boundariesProgram.days.find(x => x.day === d);
      if (raw) availableDays.push(resolveDayContent(raw, user.parentGender));
    }

    res.json({
      active: true,
      dismissed: false,
      programId: user.program.programId,
      currentDay,
      totalDays: boundariesProgram.days.length,
      startedAt: user.program.startedAt,
      dayContent,
      availableDays,
      programTitle: boundariesProgram.title,
      boundaryQuestionCount: user.boundaryQuestionCount || 0,
      notificationsEnabled: !!user.program.notificationsEnabled,
    });
  } catch (error) {
    console.error('Get program status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /program/start
router.post('/program/start', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    await startProgram(user.id, 'boundaries');
    const dayContent = resolveDayContent(boundariesProgram.days[0], user.parentGender);
    res.json({
      success: true,
      currentDay: 1,
      totalDays: boundariesProgram.days.length,
      dayContent,
      availableDays: [dayContent],
      programTitle: boundariesProgram.title,
    });
  } catch (error) {
    console.error('Start program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /program/dismiss
router.post('/program/dismiss', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    await dismissProgram(user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Dismiss program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /program/quit — leave program entirely
router.post('/program/quit', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const db = await getDb();
    await db.collection('users').updateOne({ id: user.id }, { $unset: { program: '' } });
    res.json({ success: true });
  } catch (error) {
    console.error('Quit program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /program/toggle-notifications
router.post('/program/toggle-notifications', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!user.program) return res.status(400).json({ error: 'No active program' });
    const newValue = !user.program.notificationsEnabled;
    const db = await getDb();
    await db.collection('users').updateOne({ id: user.id }, { $set: { 'program.notificationsEnabled': newValue } });
    res.json({ success: true, notificationsEnabled: newValue });
  } catch (error) {
    console.error('Toggle notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /fcm-token
router.post('/fcm-token', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    await saveFcmToken(user.id, token);
    res.json({ success: true });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /account - Self-delete account and all data
router.delete('/account', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const db = await getDb();
    await db.collection('users').deleteOne({ id: user.id });
    await db.collection('conversations').deleteMany({ userId: user.id });
    await db.collection('memories').deleteMany({ userId: user.id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
