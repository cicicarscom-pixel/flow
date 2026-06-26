/* eslint-disable react-hooks/refs */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, TouchableOpacity, StyleSheet, Animated as RNAnimated, Easing, Text, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { BotYonetimiScreen, SosyalMedyaScreen } from '../../modules/sosyal_medya';
import { AiMuhasebeScreen } from '../../modules/muhasebe';
import RandevuScreen from '../../modules/randevu/presentation/screens/RandevuScreen';
import HizmetAyarlariScreen from '../../modules/randevu/presentation/screens/HizmetAyarlariScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BotYonetimiStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BotYonetimiMain" component={BotYonetimiScreen} />
      <Stack.Screen name="RandevuMain" component={RandevuScreen} />
      <Stack.Screen name="HizmetAyarlari" component={HizmetAyarlariScreen} />
    </Stack.Navigator>
  );
}

function AiMuhasebeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AiMuhasebeMain" component={AiMuhasebeScreen} />
    </Stack.Navigator>
  );
}

function SosyalMedyaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SosyalMedyaMain" component={SosyalMedyaScreen} />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Bot Yönetimi"
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Bot Yönetimi') {
            iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          } else if (route.name === 'AI Muhasebe') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Sosyal Medya') {
            iconName = focused ? 'share-social' : 'share-social-outline';
            // Özel tasarım buton için rengi beyaza sabitliyoruz
            return <Ionicons name={iconName} size={28} color="#161B26" style={{ marginTop: 4 }} />;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom + 10, 20), // Sanal tuşların (nav bar) her zaman üstünde kalması için
          left: 20,
          right: 20,
          backgroundColor: 'rgba(22, 27, 38, 0.85)',
          borderRadius: 40,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          elevation: 10,
          shadowColor: '#00F2FE',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          minHeight: 64, // Sabit 64 yerine esnek yükseklik
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10, // Font büyüklüğü sistemde aşırı artırılsa bile bozulmayı en aza indirir
          marginTop: 2,
        },
        tabBarActiveTintColor: '#00F2FE',
        tabBarInactiveTintColor: '#849495',
      })}
    >
      <Tab.Screen name="Bot Yönetimi" component={BotYonetimiStack} />
      <Tab.Screen 
        name="Sosyal Medya" 
        component={SosyalMedyaStack} 
        options={{
          tabBarIcon: () => <Ionicons name="share-social" size={24} color="#FFFFFF" />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
          tabBarLabel: () => null // Ortadaki butonda isim yazmasına gerek yok
        }}
      />
      <Tab.Screen name="AI Muhasebe" component={AiMuhasebeStack} />
    </Tab.Navigator>
  );
}

const CustomTabBarButton = ({ children, onPress, style }) => {
  const spinValue = React.useRef(new RNAnimated.Value(0)).current;
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    RNAnimated.loop(
      RNAnimated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (isKeyboardVisible) return null;

  return (
    <TouchableOpacity
      style={[style, {
        top: -16, // Yukarı taşmayı biraz azalttık
        justifyContent: 'center',
        alignItems: 'center',
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#161B26', // Diğer sekmelerle aynı arka plan
        elevation: 10,
        shadowColor: '#00F2FE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        padding: 2.5, // Gradient kenar kalınlığı
        overflow: 'hidden',
        marginBottom: 4, // Yazı ile arasına boşluk
      }}>
        {/* Dönen Linear Gradient */}
        <RNAnimated.View style={{ 
          position: 'absolute',
          top: '-100%', bottom: '-100%', left: '-100%', right: '-100%',
          transform: [{ rotate: spin }],
        }}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#00f0ff', '#ffffff']}
            locations={[0, 0.4, 0.9, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </RNAnimated.View>
        
        {/* İç Maske */}
        <View style={{
          flex: 1,
          borderRadius: 28,
          backgroundColor: '#161B26', // Diğer sekmelerle aynı arka plan
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {children}
        </View>
      </View>
      <RNAnimated.Text style={{
        fontSize: 10,
        color: '#00F2FE',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 240, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
      }}>
        Sosyal Medya
      </RNAnimated.Text>
    </TouchableOpacity>
  );
}
