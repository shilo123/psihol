// Server-side push notification sending via FCM HTTP v1 API
// Requires FIREBASE_SERVICE_ACCOUNT env var (JSON string of service account key)

import { getUsersWithActivePrograms, calculateProgramDay } from './db.js';

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saJson) {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT not set — push disabled');
    return null;
  }

  const sa = JSON.parse(saJson);

  // Build JWT for Google OAuth2
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  // Sign with crypto
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, 'base64url');

  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    console.error('[FCM] Failed to get access token:', await res.text());
    return null;
  }

  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

export async function sendPushNotification(fcmToken, title, body) {
  const token = await getAccessToken();
  if (!token) return false;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const sa = JSON.parse(saJson);
  const projectId = sa.project_id;

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        webpush: {
          notification: {
            icon: '/logo.png',
            dir: 'rtl',
            lang: 'he',
            tag: 'program-reminder',
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[FCM] Send failed:', err);
    return false;
  }

  return true;
}

const DAY_TITLES = {
  1: 'תבחרי גבול אחד',
  2: 'תחליטו ביחד',
  3: 'הטרמה',
  4: 'אכיפה ברוגע',
  5: 'סיבה ותוצאה',
};

export async function sendDailyProgramReminders() {
  let users;
  try {
    users = await getUsersWithActivePrograms();
  } catch (e) {
    console.error('[FCM] Failed to get users:', e);
    return { sent: 0, failed: 0 };
  }

  let sent = 0, failed = 0;

  for (const user of users) {
    const { day, completed } = calculateProgramDay(user.program?.startedAt);
    if (completed) continue; // Program finished, skip
    const dayTitle = DAY_TITLES[day] || `יום ${day}`;
    const parentName = user.parentName || '';
    const title = `${parentName ? parentName + ', ' : ''}יום ${day} בתוכנית הצבת גבולות`;
    const body = `הנושא של היום: ${dayTitle}. בואי נמשיך!`;

    try {
      const ok = await sendPushNotification(user.program.fcmToken, title, body);
      if (ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { sent, failed, total: users.length };
}
