import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import ProfilScreen from '../../screens/ProfilScreen';
import BildirimlerScreen from '../../screens/BildirimlerScreen';
import AiChatScreen from '../../screens/AiChatScreen';
import AiAssistantScreen from '../../screens/AiAssistantScreen';
import DigitalAssistantScreen from '../../screens/DigitalAssistantScreen';
import PostsScreen from '../../screens/PostsScreen';
import PostCommentsScreen from '../../screens/PostCommentsScreen';

import { OdemeTakvimiScreen, IsletmemScreen } from '../../modules/muhasebe';
import { 
  AiUretimScreen, 
  InboxScreen, 
  AnalyticsScreen, 
  ChatScreen 
} from '../../modules/sosyal_medya';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Profil" component={ProfilScreen} />
      <Stack.Screen name="Bildirimler" component={BildirimlerScreen} />
      <Stack.Screen name="OdemeTakvimi" component={OdemeTakvimiScreen} />
      <Stack.Screen name="Isletmem" component={IsletmemScreen} />
      <Stack.Screen name="AiChat" component={AiChatScreen} />
      <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
      <Stack.Screen name="DigitalAssistant" component={DigitalAssistantScreen} />
      <Stack.Screen name="AiUretim" component={AiUretimScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Gönderiler" component={PostsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="PostCommentsScreen" component={PostCommentsScreen} />
    </Stack.Navigator>
  );
}
