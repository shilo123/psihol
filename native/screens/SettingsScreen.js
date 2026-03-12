/**
 * Settings Screen - React Native
 *
 * Shares logic with web via /shared stores.
 * TODO: Implement native settings UI
 */

import React from 'react'
import { View, Text, StyleSheet, I18nManager } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

I18nManager.forceRTL(true)

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>הגדרות</Text>
      <Text style={styles.subtitle}>ניהול פרופיל, ילדים, ומנוי</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#100c1c',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b6684',
    marginTop: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})
