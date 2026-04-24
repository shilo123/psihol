// Server-side push notification sending via FCM HTTP v1 API
// Requires FIREBASE_SERVICE_ACCOUNT env var (JSON string of service account key)

import { getUsersWithActivePrograms, calculateProgramDay, clearFcmToken } from './db.js';

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
  if (!token) return { ok: false, reason: 'no-access-token' };

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
            requireInteraction: false,
          },
          fcm_options: {
            link: '/',
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[FCM] Send failed:', errText);
    let errorCode = null;
    try {
      const parsed = JSON.parse(errText);
      errorCode = parsed?.error?.details?.[0]?.errorCode || parsed?.error?.status;
    } catch {}
    const unregistered = errorCode === 'UNREGISTERED' || errorCode === 'NOT_FOUND' || errorCode === 'INVALID_ARGUMENT';
    return { ok: false, reason: errorCode || 'send-failed', unregistered, httpStatus: res.status };
  }

  return { ok: true };
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
      const result = await sendPushNotification(user.program.fcmToken, title, body);
      if (result.ok) {
        sent++;
      } else {
        failed++;
        if (result.unregistered) {
          // Token is dead — clear it so the user is asked to re-subscribe next time
          await clearFcmToken(user.id).catch(() => {});
        }
      }
    } catch {
      failed++;
    }
  }

  return { sent, failed, total: users.length };
}
