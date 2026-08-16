/* eslint-disable react-hooks/refs */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, TouchableOpacity, Animated as RNAnimated, Easing, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { BotYonetimiScreen, SosyalMedyaScreen, AnalyticsScreen } from '../../modules/sosyal_medya';
import { AiMuhasebeScreen, MuhasebecimScreen } from '../../modules/muhasebe';
import { RandevuScreen, HizmetAyarlariScreen } from '../../modules/randevu';
import DashboardScreen from '../../screens/DashboardScreen';

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
      <Stack.Screen name="Muhasebecim" component={MuhasebecimScreen} />
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

function AnalyticsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Anasayfa"
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Ai Asistan') {
            iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          } else if (route.name === 'Ai Muhasebe') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Sosyal Medya') {
            iconName = focused ? 'share-social' : 'share-social-outline';
          } else if (route.name === 'Analiz') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Anasayfa') {
            iconName = focused ? 'home' : 'home-outline';
            // Özel tasarım buton için rengi beyaza sabitliyoruz
            return <Ionicons name={iconName} size={28} color="#161B26" style={{ marginTop: 4 }} />;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom + 10, 20), // Sanal tuşların (nav bar) her zaman üstünde kalması için
          left: 10,
          right: 10,
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
          fontSize: 9, // Font büyüklüğü sistemde aşırı artırılsa bile bozulmayı en aza indirir
          marginTop: 2,
        },
        tabBarActiveTintColor: '#00F2FE',
        tabBarInactiveTintColor: '#849495',
      })}
    >
      <Tab.Screen name="Ai Asistan" component={BotYonetimiStack} />
      <Tab.Screen name="Ai Muhasebe" component={AiMuhasebeStack} />
      <Tab.Screen 
        name="Anasayfa" 
        component={DashboardStack} 
        options={{
          tabBarIcon: () => <Ionicons name="home" size={24} color="#FFFFFF" />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
          tabBarLabel: () => null // Ortadaki butonda isim yazmasına gerek yok
        }}
      />
      <Tab.Screen name="Sosyal Medya" component={SosyalMedyaStack} />
      <Tab.Screen name="Analiz" component={AnalyticsStack} />
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
        duration: 8000,
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
            colors={['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00', '#ff0000']}
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
        Anasayfa
      </RNAnimated.Text>
    </TouchableOpacity>
  );
}
