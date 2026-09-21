import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import ProfilScreen from '../../screens/ProfilScreen';
import BildirimlerScreen from '../../screens/BildirimlerScreen';
import AiChatScreen from '../../screens/AiChatScreen';
import AiAssistantScreen from '../../screens/AiAssistantScreen';
import PostsScreen from '../../screens/PostsScreen';
import PostCommentsScreen from '../../screens/PostCommentsScreen';
import VerifyEmailScreen from '../../screens/VerifyEmailScreen';
import OnboardingScreen from '../../screens/OnboardingScreen';

import { OdemeTakvimiScreen, IsletmemScreen } from '../../modules/muhasebe';
import { 
  AiUretimScreen, 
  InboxScreen, 
  AnalyticsScreen, 
  ChatScreen 
} from '../../modules/sosyal_medya';

import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../../shared';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    async function checkAuthGuard() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
         setLoading(false);
         return;
      }
      
      if (!session.user.email_confirmed_at) {
        if (!initialRoute) setInitialRoute('VerifyEmail');
        else navigation.reset({ index: 0, routes: [{ name: 'VerifyEmail' }] });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('user_type, onboarding_completed').eq('id', session.user.id).single();
      
      if (profile && !profile.user_type) {
         // Mobile generic user_type fallback assignment for flow app
         await supabase.from('profiles').update({ user_type: 'business' }).eq('id', session.user.id);
         await supabase.from('organizations').insert({ owner_id: session.user.id, name: null });
      }

      if (profile && profile.onboarding_completed === false) {
        if (!initialRoute) setInitialRoute('Onboarding');
        else navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      } else {
        if (!initialRoute) setInitialRoute('MainTabs');
        else navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
      
      setLoading(false);
    }

    checkAuthGuard();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Re-run guard on session update only if navigator is mounted
      if (initialRoute && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        checkAuthGuard();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigation, initialRoute]);

  if (loading || !initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Profil" component={ProfilScreen} />
      <Stack.Screen name="Bildirimler" component={BildirimlerScreen} />
      <Stack.Screen name="OdemeTakvimi" component={OdemeTakvimiScreen} />
      <Stack.Screen name="Isletmem" component={IsletmemScreen} />
      <Stack.Screen name="AiChat" component={AiChatScreen} />
      <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
      <Stack.Screen name="AiUretim" component={AiUretimScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Gönderiler" component={PostsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="PostCommentsScreen" component={PostCommentsScreen} />
    </Stack.Navigator>
  );
}
