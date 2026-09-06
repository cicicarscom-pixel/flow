import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, ImageBackground, StyleSheet , KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase , ChatInputBar , GlobalAppBar } from '../shared';

export default function AiChatScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { transactionType } = route.params || { transactionType: 'income' };

  const [messages, setMessages] = useState([
    { id: 1, text: t('aiChatScreen.welcomeMessage', { type: transactionType === 'income' ? t('aiChatScreen.incomeWord') : t('aiChatScreen.expenseWord') }), sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState(null);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setProfileId(session.user.id);
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setOrgId(orgMember?.organization_id || session.user.id);
      }
    };
    fetchUser();
  }, []);

  const addMessage = (text, sender, isImage = false) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender, isImage }]);
  };

  const processWithAI = async (uri, base64Data, mimeType, textPrompt) => {
    setLoading(true);
    try {
      let publicUrl = null;

      // 1. Insert draft row into finance_documents
      const { data: draftDoc, error: insertError } = await supabase.from('finance_documents').insert([
        {
          organization_id: orgId || 'unknown',
          type: transactionType,
          image_url: null,
          ledger_official_status: 'taslak',
          flow_payment_status: 'unpaid', // temporary until edge function updates it
          title: textPrompt ? t('aiChatScreen.textEntryTitle', { prompt: textPrompt.substring(0, 20) }) : t('aiChatScreen.aiAnalysisPending'),
          amount_minor: 0
        }
      ]).select().maybeSingle();

      if (insertError) throw insertError;

      // 3. Call ledger-isleyici-api
      const payload = {
        document_id: draftDoc.id,
        prompt: textPrompt,
        mimeType: mimeType || 'image/jpeg',
        profile_id: profileId,
        organization_id: orgId
      };

      if (base64Data) {
        payload.imageBase64 = base64Data;
      }

      const { data: result, error: invokeError } = await supabase.functions.invoke('ledger-isleyici-api', {
        body: payload
      });

      if (invokeError) throw invokeError;
      if (result && result.error) throw new Error(result.error);

      // Edge function'dan gelen dinamik mesaji ekrana bas
      addMessage(result.message || t('aiChatScreen.documentAnalyzed'), 'ai');

    } catch (error) {
      console.error("Belge isleme hatasi:", error);
      addMessage(t('aiChatScreen.processError', { error: error.message || t('aiChatScreen.unknownError') }), 'ai');
    } finally {
      setLoading(false);
    }
  };

  const processTextWithAI = async (textPrompt) => {
    setLoading(true);
    try {
      // Metin mesajlari icin ledger-isleyici-api'yi dogrudan cagir
      const { data: result, error: invokeError } = await supabase.functions.invoke('ledger-isleyici-api', {
        body: { 
          prompt: textPrompt,
          profile_id: profileId,
          organization_id: orgId
        }
      });

      if (invokeError) throw invokeError;
      if (result && result.error) throw new Error(result.error);

      addMessage(result.message || t('aiChatScreen.transactionSaved'), 'ai');

    } catch (error) {
      console.error("Sohbet hatasi:", error);
      addMessage(t('aiChatScreen.chatError'), 'ai');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (useCamera = false) => {
    const options = {
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
    };
    
    let result = useCamera 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0].base64) {
      addMessage(result.assets[0].uri, 'user', true);
      processWithAI(result.assets[0].uri, result.assets[0].base64, 'image/jpeg', null);
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets[0].uri) {
      addMessage(t('aiChatScreen.pdfUploaded', { name: result.assets[0].name }), 'user');
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
      processWithAI(result.assets[0].uri, base64, 'application/pdf', null);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    addMessage(inputText, 'user');
    processTextWithAI(inputText);
    setInputText('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#17151A]" edges={['top', 'left', 'right']}>
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
        <GlobalAppBar level={3} module="finans" title={t('aiChatScreen.headerTitle')} showProfile={false} />

        {/* Chat Area */}
        <ScrollView className="flex-1 px-4 pt-4">
          {messages.map((msg) => (
            <View key={msg.id} className={`mb-4 max-w-[80%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-[#22B573]/20 self-end' : 'bg-[#2A2631] self-start border border-white/5'}`}>
              {msg.isImage ? (
                <Image source={{ uri: msg.text }} style={{ width: 200, height: 200, borderRadius: 12 }} />
              ) : (
                <Text className="text-[#F6F1EC] text-sm">{msg.text}</Text>
              )}
            </View>
          ))}
          {loading && (
            <View className="self-start bg-[#2A2631] p-3 rounded-2xl mb-4">
              <ActivityIndicator color="#22B573" />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <ChatInputBar 
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSendText}
          placeholder={t('aiChatScreen.inputPlaceholder')}
          onAttachImage={() => pickImage(true)}
          onAttachGallery={() => pickImage(false)}
          onAttachDocument={pickDocument}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
