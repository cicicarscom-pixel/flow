import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../shared';
import { supabase } from '../shared';
import { CustomButton } from '../shared';
import { CustomInput } from '../shared';

export default function AiHesapScreen() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Cost tracking stats
  const [totalCost, setTotalCost] = useState('0.0000');
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  const fetchApiSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('user_api_settings')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single();
      
      if (data && data.gemini_api_key) {
        setApiKey(data.gemini_api_key);
        setIsSaved(true);
      }

      // Fetch Usage Logs for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('api_usage_logs')
        .select('estimated_cost_try, generated_image_count')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (logs) {
        let cost = 0;
        let images = 0;
        logs.forEach(log => {
          cost += Number(log.estimated_cost_try || 0);
          images += Number(log.generated_image_count || 0);
        });
        setTotalCost(cost.toFixed(4));
        setTotalRequests(logs.length);
        setTotalImages(images);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchApiSettings();
    }, 0);
  }, []);

  const saveApiSettings = async () => {
    if (!apiKey) {
      Alert.alert('Hata', 'Lütfen geçerli bir API anahtarı girin.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('user_api_settings')
        .upsert({ user_id: user.id, gemini_api_key: apiKey }, { onConflict: 'user_id' });

      if (error) {
        Alert.alert('Kayıt Hatası', error.message);
      } else {
        Alert.alert('Başarılı', 'API anahtarınız güvenle kaydedildi!');
        setIsSaved(true);
      }
    }
    setSaving(false);
  };

  const deleteApiSettings = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('user_api_settings')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Hata', error.message);
      } else {
        setApiKey('');
        setIsSaved(false);
        Alert.alert('Silindi', 'API anahtarınız sistemden silindi.');
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color="#00f0ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      <Header />
      
      <ScrollView className="px-4 pt-2" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-white mb-1">AI Hesap (BYOK)</Text>
        <Text className="text-sm text-gray-400 mb-6">Kendi API anahtarınızı (BYOK) getirerek yapay zeka özelliklerini sınırsız kullanın.</Text>

        {/* API Key Input Section */}
        <View className="rounded-[24px] p-6 mb-6 border border-[#00f0ff]/30 relative overflow-hidden bg-[#1c1c1e]/80">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Text className="text-[10px] font-bold text-[#00f0ff] tracking-widest uppercase mr-2">Gemini API Anahtarı</Text>
              <Ionicons name="key-outline" size={16} color="#00f0ff" />
            </View>
            {isSaved && (
              <TouchableOpacity onPress={deleteApiSettings} className="bg-[#ff3b30]/10 px-2 py-1 rounded border border-[#ff3b30]/30">
                <Text className="text-[10px] font-bold text-[#ff3b30]">Anahtarı Sil</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text className="text-xs text-gray-400 mb-4">
            {"Google AI Studio'dan aldığınız Gemini API anahtarınızı buraya girin. Bu anahtar sadece sizin işlemleriniz için kullanılır."}
          </Text>

          <CustomInput
            value={apiKey}
            onChangeText={(text) => {
              setApiKey(text);
              if (isSaved) setIsSaved(false); // If they start typing, allow save again
            }}
            placeholder="AIzaSy..."
            secureTextEntry={true}
            containerClassName="mb-4"
          />

          <CustomButton
            title={isSaved ? 'Kaydedildi' : 'Anahtarı Kaydet'}
            onPress={saveApiSettings}
            disabled={saving || isSaved}
            isLoading={saving}
            className="w-full shadow-[0_0_10px_rgba(0,240,255,0.4)]"
            textClassName="text-black"
          />
        </View>

        {/* Aylık Maliyet */}
        <View 
          className="rounded-[24px] p-6 mb-4 border border-white/5 relative overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Aylık Maliyet (Google Cloud)</Text>
            <Ionicons name="cash-outline" size={18} color="#849495" />
          </View>
          
          <Text 
            className="text-5xl font-bold text-white mb-3"
            style={{ 
              textShadowColor: 'rgba(0, 240, 255, 0.6)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 15 
            }}
          >
            {totalCost} TL
          </Text>
          
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={14} color="#849495" />
            <Text className="text-gray-400 text-xs ml-1 font-medium">Güncel kurdan hesaplanan tahmini API tüketimi</Text>
          </View>
        </View>

        {/* Two Mini Cards */}
        <View className="flex-row justify-between mb-4">
          <View 
            className="flex-1 rounded-[24px] p-5 mr-2 border border-white/5"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mb-4">
              <Ionicons name="hardware-chip-outline" size={16} color="#e5e2e3" />
            </View>
            <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Aylık API İsteği</Text>
            <Text className="text-2xl font-bold text-white mb-2">{totalRequests}</Text>
            
            <View className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden mt-1">
              <View className="h-full bg-white rounded-full" style={{ width: '100%' }} />
            </View>
          </View>

          <View 
            className="flex-1 rounded-[24px] p-5 ml-2 border border-white/5"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            <View className="w-8 h-8 rounded-full bg-secondary/10 items-center justify-center mb-4">
              <Ionicons name="image-outline" size={16} color="#bc13fe" />
            </View>
            <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Görsel Üretimi</Text>
            <Text className="text-2xl font-bold text-white mb-1">{totalImages}</Text>
            <Text className="text-xs text-gray-500 italic">Imagen 4.0</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
