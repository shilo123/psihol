/**
 * Chat Screen - React Native
 *
 * Uses shared stores from /shared directory:
 * import { useAuthStore } from '../../shared/authStore'
 * import { useChatStore } from '../../shared/chatStore'
 *
 * TODO: Implement native UI matching the web design
 * - RTL layout with I18nManager.forceRTL(true)
 * - Purple primary color scheme (#7a5afc)
 * - Chat bubbles, typing indicator, input bar
 * - Navigation to Onboarding/Settings
 */

import React from 'react'
import { View, Text, StyleSheet, I18nManager } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Force RTL for Hebrew
I18nManager.forceRTL(true)

const COLORS = {
  primary: '#7a5afc',
  primaryLight: '#ebe7fe',
  background: '#f8f7ff',
  chatBg: '#f4f2f9',
  textMain: '#100c1c',
  textSub: '#5846a0',
  textMuted: '#6b6684',
  border: '#e9e6f4',
  white: '#ffffff',
}

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>פסיכולוגית בכיס</Text>
      </View>
      <View style={styles.chatArea}>
        <Text style={styles.placeholder}>
          מסך הצ'אט - יש לממש את ה-UI הנייטיב כאן
        </Text>
        <Text style={styles.subtext}>
          הלוגיקה העסקית משותפת עם אפליקציית הווב
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  chatArea: {
    flex: 1,
    backgroundColor: COLORS.chatBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholder: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})
