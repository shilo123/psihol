// Firebase Cloud Messaging - client-side
// Config values are public (safe to expose in client code)

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBReIVLC4LIf1Zg92PGUkfGnU9ZZFMw5qI',
  authDomain: 'horut-b18c8.firebaseapp.com',
  projectId: 'horut-b18c8',
  storageBucket: 'horut-b18c8.firebasestorage.app',
  messagingSenderId: '1084146926843',
  appId: '1:1084146926843:web:bd468ea825d1597c095c5e',
  measurementId: 'G-5MZ8QECRPK',
}

const VAPID_KEY = 'BPJYbhLDvYWZhPWYmUSF4t3jr_ewFI84btu4jJu4knVzpXZ_y7762fSzJ8XgMGBE8x-xTzd0ZpbOomwTG1k3u4E'

let messagingInstance = null
let swRegistrationPromise = null

function isSupported() {
  return typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window
}

// Register SW once. Returns an ACTIVE registration (waits for the controller).
async function getServiceWorkerRegistration() {
  if (swRegistrationPromise) return swRegistrationPromise
  swRegistrationPromise = (async () => {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    // Wait until the SW is active (installed + activated), otherwise getToken may fail silently
    if (reg.installing || reg.waiting) {
      await new Promise((resolve) => {
        const worker = reg.installing || reg.waiting
        if (!worker) return resolve()
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve()
        })
      })
    }
    await navigator.serviceWorker.ready
    return reg
  })()
  return swRegistrationPromise
}

async function getMessaging() {
  if (messagingInstance) return messagingInstance
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js')
  const { getMessaging: getMsg, getToken, onMessage, deleteToken } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js')
  const app = initializeApp(FIREBASE_CONFIG)
  messagingInstance = { messaging: getMsg(app), getToken, onMessage, deleteToken }
  return messagingInstance
}

export async function requestNotificationPermission() {
  if (!isSupported()) {
    console.warn('[FCM] Push notifications are not supported in this browser')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('[FCM] Notification permission denied:', permission)
    return null
  }

  try {
    const serviceWorkerRegistration = await getServiceWorkerRegistration()
    const fcm = await getMessaging()
    const token = await fcm.getToken(fcm.messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    })
    if (!token) {
      console.error('[FCM] getToken returned empty — check VAPID key & Firebase config')
      return null
    }
    console.log('[FCM] Token acquired:', token.slice(0, 20) + '…')
    return token
  } catch (err) {
    console.error('[FCM] Failed to get token:', err)
    return null
  }
}

// Force refresh a stale/dead token — delete and regenerate
export async function refreshNotificationToken() {
  if (!isSupported()) return null
  try {
    const fcm = await getMessaging()
    await fcm.deleteToken(fcm.messaging)
  } catch (e) {
    console.warn('[FCM] Could not delete old token:', e)
  }
  return requestNotificationPermission()
}

export function onForegroundMessage(callback) {
  getMessaging().then(fcm => {
    if (!fcm) return
    fcm.onMessage(fcm.messaging, (payload) => {
      callback(payload)
    })
  })
}
