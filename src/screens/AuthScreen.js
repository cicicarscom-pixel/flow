import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../shared';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomButton } from '../shared';
import { CustomInput } from '../shared';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert('Giriş Hatası', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!phone) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı girin.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          phone: phone,
        },
      },
    });
    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
    } else {
      Alert.alert('Başarılı', 'Kayıt başarılı! Lütfen giriş yapın.');
      setIsLogin(true);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'bottom']}>
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      {/* Background Decorative Element */}
      <View className="absolute top-0 left-0 right-0 h-[40%] opacity-20">
        <LinearGradient
          colors={['#00f0ff', 'transparent']}
          style={{ flex: 1 }}
        />
      </View>

      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full border border-[#00f0ff]/30 items-center justify-center bg-[#00f0ff]/10 mb-4">
             <MaterialIcons name="auto-awesome" size={40} color="#00f0ff" />
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">AI Esnaf</Text>
          <Text className="text-[#8e8e93] text-base mt-2">Esnafın Dijital Asistanı</Text>
        </View>

        <View className="bg-[#1c1c1e]/80 rounded-3xl p-6 border border-white/5 shadow-2xl">
          <Text className="text-white text-xl font-bold mb-6">
            {isLogin ? 'Hoş Geldiniz' : 'Yeni Hesap Oluştur'}
          </Text>

          <CustomInput
            label="E-Posta"
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="email@adresiniz.com"
            autoCapitalize="none"
            keyboardType="email-address"
            containerClassName="mb-4"
          />

          {!isLogin && (
            <CustomInput
              label="Telefon Numarası"
              onChangeText={(text) => setPhone(text)}
              value={phone}
              placeholder="+90 555 555 5555"
              keyboardType="phone-pad"
              containerClassName="mb-4"
            />
          )}

          <CustomInput
            label="Şifre"
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="******"
            autoCapitalize="none"
            containerClassName="mb-8"
          />

          <CustomButton
            title={isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
            isLoading={loading}
            className="w-full shadow-[0_0_15px_rgba(0,240,255,0.4)] mb-4"
            textClassName="text-black"
          />

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center mt-2">
            <Text className="text-[#8e8e93] text-sm">
              {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
              <Text className="text-[#00f0ff] font-bold">
                {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
