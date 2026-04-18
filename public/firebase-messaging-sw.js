// Firebase Cloud Messaging Service Worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBReIVLC4LIf1Zg92PGUkfGnU9ZZFMw5qI',
  authDomain: 'horut-b18c8.firebaseapp.com',
  projectId: 'horut-b18c8',
  storageBucket: 'horut-b18c8.firebasestorage.app',
  messagingSenderId: '1084146926843',
  appId: '1:1084146926843:web:bd468ea825d1597c095c5e',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'הורות בכיס'
  const options = {
    body: payload.notification?.body || 'יש לך משימה חדשה בתוכנית!',
    icon: '/logo.png',
    badge: '/logo.png',
    dir: 'rtl',
    lang: 'he',
    tag: 'program-reminder',
    data: payload.data,
  }

  self.registration.showNotification(title, options)
})

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
