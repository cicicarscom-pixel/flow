import './src/core/container';
import './src/core/i18n';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/core';
import AuthScreen from './src/screens/AuthScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import { supabase } from './src/shared';
import React, { useState, useEffect } from 'react';

import { registerRootComponent } from 'expo';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

export default function App() {
  const [session, setSession] = useState(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ActionSheetProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          {session && session.user ? (
            <AppNavigator />
          ) : pendingVerificationEmail ? (
            <VerifyEmailScreen emailFromProps={pendingVerificationEmail} />
          ) : (
            <AuthScreen onSignUpSuccess={(email) => setPendingVerificationEmail(email)} />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </ActionSheetProvider>
  );
}

registerRootComponent(App);
