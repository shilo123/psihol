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

async function getMessaging() {
  if (messagingInstance) return messagingInstance
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js')
  const { getMessaging: getMsg, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js')
  const app = initializeApp(FIREBASE_CONFIG)
  messagingInstance = { messaging: getMsg(app), getToken, onMessage }
  return messagingInstance
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const fcm = await getMessaging()
  if (!fcm) return null

  try {
    const token = await fcm.getToken(fcm.messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    })
    return token
  } catch (err) {
    console.error('[FCM] Failed to get token:', err)
    return null
  }
}

export function onForegroundMessage(callback) {
  getMessaging().then(fcm => {
    if (!fcm) return
    fcm.onMessage(fcm.messaging, (payload) => {
      callback(payload)
    })
  })
}
