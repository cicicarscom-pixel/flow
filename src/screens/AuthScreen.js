import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../shared/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { CustomButton, CustomInput } from '../shared';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Clear any stuck sessions on mount just in case (optional, based on recent issues)
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error && error.message.includes('Refresh Token Not Found')) {
        await supabase.auth.signOut();
      }
    };
    checkSession();
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      // Expo Go'da otomatik olarak exp://..., canlıda workigomflow://... üretir
      const redirectTo = makeRedirectUri();
      // Supabase'in bu URL'i kabul etmesi için dashboard'da whiteliste eklenmesi gerekir!
      console.log('Redirect URI (Supabase panele eklenmeli):', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('OAuth URL oluşturulamadı.');
      
      console.log('Supabase OAuth URL:', data.url);

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (res.type === 'success') {
        const { url } = res;
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) throw new Error(errorCode);
        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
        }
      }
    } catch (error) {
      Alert.alert('Google Giriş Hatası', error.message);
    } finally {
      setLoading(false);
    }
  }

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
    <View style={[styles.container, { backgroundColor: '#0b0e11' }]}>
      {/* Premium Dark Background */}
      <View style={StyleSheet.absoluteFillObject} className="bg-[#0b0e11]" />
      
      {/* Background Decorative Gradients */}
      <View className="absolute top-0 left-0 right-0 h-[60%] opacity-20">
        <LinearGradient
          colors={['#00daf3', 'transparent']}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
      <View className="absolute bottom-0 left-0 right-0 h-[40%] opacity-10">
        <LinearGradient
          colors={['transparent', '#ecb2ff']}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          
          {/* LOGO & BRANDING */}
          <View className="items-center mb-6">
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../image/logo2.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* GLASSMORPHISM CARD */}
        <View style={styles.glassCard} className="rounded-3xl p-6 shadow-2xl">
          
          <Text className="text-white text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
          </Text>

          {/* GOOGLE LOGIN BUTTON */}
          <TouchableOpacity 
            onPress={handleGoogleLogin} 
            disabled={loading}
            style={styles.googleBtn}
            className="flex-row items-center justify-center py-3.5 rounded-xl mb-6"
          >
            <FontAwesome5 name="google" size={18} color="#fff" style={{ marginRight: 12 }} />
            <Text className="text-white font-bold text-base">Google ile Devam Et</Text>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-white/10" />
            <Text className="text-[#bac9cc] text-xs px-4">veya e-posta ile</Text>
            <View className="flex-1 h-[1px] bg-white/10" />
          </View>

          {/* EMAIL & PASSWORD INPUTS */}
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
            className="w-full shadow-[0_0_15px_rgba(0,218,243,0.3)] mb-4"
            style={{ backgroundColor: '#00daf3' }}
            textClassName="text-black font-extrabold"
          />

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center mt-2">
            <Text className="text-[#bac9cc] text-sm">
              {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
              <Text className="text-[#00daf3] font-bold">
                {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
              </Text>
            </Text>
          </TouchableOpacity>
          
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: '100%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '80%',
    height: '100%',
  },
  glassCard: {
    backgroundColor: 'rgba(39, 42, 46, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  googleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  container: {
    flex: 1,
  }
});
