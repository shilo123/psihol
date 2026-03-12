/**
 * פסיכולוגית בכיס - React Native App
 *
 * This app shares business logic with the web app via /shared:
 * - shared/api.js - API communication layer
 * - shared/authStore.js - Authentication state (Zustand)
 * - shared/chatStore.js - Chat state (Zustand)
 * - shared/constants.js - Shared constants and utilities
 *
 * To run:
 * 1. cd native
 * 2. npm install
 * 3. npx expo start
 */

import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'

import ChatScreen from './screens/ChatScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import SettingsScreen from './screens/SettingsScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f8f7ff' },
          }}
        >
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  )
}
