import './src/core/container';
import './src/core/i18n';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { AppNavigator } from './src/core';
import { FlowAiHost } from './src/modules/flow_ai';
import { ForceUpdateGate } from './src/modules/app_update';
import AuthScreen from './src/screens/AuthScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import { supabase } from './src/shared';
import React, { useState, useEffect } from 'react';

import { registerRootComponent } from 'expo';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

export default function App() {
  const [session, setSession] = useState(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);
  const navigationRef = useNavigationContainerRef();
  const [routeName, setRouteName] = useState(null);

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
        <ForceUpdateGate>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => setRouteName(navigationRef.getCurrentRoute()?.name ?? null)}
          onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name ?? null)}
        >
          <StatusBar style="light" />
          {session && session.user ? (
            <>
              <AppNavigator />
              {routeName !== 'Onboarding' && routeName !== 'VerifyEmail' && <FlowAiHost navigationRef={navigationRef} />}
            </>
          ) : pendingVerificationEmail ? (
            <VerifyEmailScreen emailFromProps={pendingVerificationEmail} onClear={() => setPendingVerificationEmail(null)} />
          ) : (
            <AuthScreen onSignUpSuccess={(email) => setPendingVerificationEmail(email)} />
          )}
        </NavigationContainer>
        </ForceUpdateGate>
      </SafeAreaProvider>
    </ActionSheetProvider>
  );
}

registerRootComponent(App);
