import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, ImageBackground, StyleSheet , KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase , ChatInputBar , GlobalAppBar } from '../shared';




export default function AiChatScreen({ route, navigation }) {
  const { transactionType } = route.params || { transactionType: 'income' };
  
  const [messages, setMessages] = useState([
    { id: 1, text: `Merhaba! Bir ${transactionType === 'income' ? 'gelir' : 'gider'} belgesi yükleyerek veya yazarak işlemi kaydedebilirsiniz.`, sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const addMessage = (text, sender, isImage = false) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender, isImage }]);
  };

  const processWithAI = async (base64Data, mimeType, textPrompt) => {
    setLoading(true);
    try {
      const payload = {
        mode: 'finance',
        prompt: textPrompt || `Please analyze this receipt for ${transactionType}.`,
      };

      if (base64Data) {
        payload.image = base64Data;
        payload.mimeType = mimeType;
      }

      const { data: result, error: invokeError } = await supabase.functions.invoke('gemini-chat', {
        body: payload
      });

      if (invokeError) throw invokeError;
      if (result.error) throw new Error(result.error);

      // The edge function returns the parsed JSON inside debug_parsedResult
      let data = result.debug_parsedResult;
      if (!data || !data.amount) {
         // fallback if it was returned as string
         data = JSON.parse(result.debug_generatedText || '{}');
      }

      if (!data.amount) throw new Error("Could not extract amount.");

      // Save to Supabase
      const { error } = await supabase.from('transactions').insert([
        {
          amount: data.amount,
          date: data.date,
          title: data.title,
          type: data.type || transactionType
        }
      ]);

      if (error) throw error;

      addMessage(`İşlem takvime ve kasaya kaydedildi.\n\nTutar: ${data.amount} ₺\nTarih: ${data.date}\nBaşlık: ${data.title}`, 'ai');

    } catch (error) {
      console.error(error);
      addMessage("İşlem kaydedilirken bir hata oluştu veya belge anlaşılamadı.", 'ai');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (useCamera = false) => {
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    };
    
    let result = useCamera 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0].base64) {
      addMessage(result.assets[0].uri, 'user', true);
      processWithAI(result.assets[0].base64, 'image/jpeg', null);
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets[0].uri) {
      addMessage(`PDF Yüklendi: ${result.assets[0].name}`, 'user');
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
      processWithAI(base64, 'application/pdf', null);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    addMessage(inputText, 'user');
    processWithAI(null, null, inputText);
    setInputText('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.Version < 30 ? 'padding' : undefined)}
      >
        <ImageBackground 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
        </ImageBackground>
        {/* Header */}
        <GlobalAppBar level={3} module="finans" title="AI Veri Girişi" showProfile={false} />

        {/* Chat Area */}
        <ScrollView className="flex-1 px-4 pt-4">
          {messages.map((msg) => (
            <View key={msg.id} className={`mb-4 max-w-[80%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-[#00f0ff]/20 self-end' : 'bg-[#1c1c1e] self-start border border-white/5'}`}>
              {msg.isImage ? (
                <Image source={{ uri: msg.text }} style={{ width: 200, height: 200, borderRadius: 10 }} />
              ) : (
                <Text className="text-[#e5e2e3] text-sm">{msg.text}</Text>
              )}
            </View>
          ))}
          {loading && (
            <View className="self-start bg-[#1c1c1e] p-3 rounded-2xl mb-4">
              <ActivityIndicator color="#00f0ff" />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <ChatInputBar 
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSendText}
          placeholder="İşlemi yazın..."
          onAttachImage={() => pickImage(true)}
          onAttachGallery={() => pickImage(false)}
          onAttachDocument={pickDocument}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
