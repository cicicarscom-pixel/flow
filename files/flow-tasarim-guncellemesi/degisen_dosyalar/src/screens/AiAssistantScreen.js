import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, ImageBackground, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import { supabase, ChatInputBar, GlobalAppBar } from '../shared';

export default function AiAssistantScreen({ navigation, route }) {
  const mode = route.params?.mode || 'report';
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pastDocs, setPastDocs] = useState([]);

  const initializeAssistant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessages([{ id: 1, text: "Lütfen önce giriş yapın.", sender: 'ai' }]);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('ledger-isleyici-api', {
        body: {
          prompt: "Merhaba, bana şu anki finansal durumumu kısaca özetleyip bugünkü işlemler için proaktif bir şekilde sorar mısın? (Cevabın standart bir mesaj değil, muhasebecim olarak bana hitaben özel bir karşılama olsun)",
          profile_id: user.id
        }
      });
      
      if (error) throw error;
      
      if (data && data.message) {
        setMessages([{ id: 1, text: data.message, sender: 'ai' }]);
      } else {
        setMessages([{ id: 1, text: "Merhaba! İşleyici AI asistanınız hazır. Size nasıl yardımcı olabilirim?", sender: 'ai' }]);
      }
    } catch (e) {
      console.warn("Init Error:", e);
      setMessages([{ id: 1, text: "Merhaba! İşleyici AI asistanınız hazır. Size nasıl yardımcı olabilirim?", sender: 'ai' }]);
    }
  };

  useEffect(() => {
    initializeAssistant();
  }, []);



  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender }]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userText = inputText;
    addMessage(userText, 'user');
    setInputText('');
    setLoading(true);

    try {
      const lowerText = userText.toLowerCase();
      // Keep PDF and Excel support locally
      if (lowerText.includes('pdf')) {
        await generatePDFReport();
        addMessage("PDF raporunuz hazırlandı ve paylaşıma açıldı.", 'ai');
        setLoading(false);
        return;
      } else if (lowerText.includes('excel')) {
        await generateExcelReport();
        addMessage("Excel raporunuz hazırlandı ve paylaşıma açıldı.", 'ai');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase.functions.invoke('ledger-isleyici-api', {
        body: {
          prompt: userText,
          profile_id: user.id
        }
      });

      if (error) throw error;

      if (data && data.message) {
        addMessage(data.message, 'ai');
      }

      // Check if a manual entry was processed
      if (data && data.manual_entry) {
        setTimeout(() => {
          addMessage("✅ İşlem başarıyla kaydedildi.", 'system');
        }, 800);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      addMessage("Bağlantı hatası oluştu, lütfen tekrar deneyin.", 'ai');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const generatePDFReport = async () => {
    const transactions = await fetchTransactions();
    let rows = transactions.map(t => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.date}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.title}</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: ${t.type === 'income' ? 'green' : 'red'};">${t.type === 'income' ? '+' : ''}${t.amount} ₺</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f4f4f4; padding: 10px; text-align: left; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Finansal İşlem Raporu</h1>
          <table>
            <thead>
              <tr><th>Tarih</th><th>Başlık</th><th>Tutar</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  const generateExcelReport = async () => {
    const transactions = await fetchTransactions();
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
      Tarih: t.date,
      Başlık: t.title,
      Tutar: t.amount,
      Tür: t.type === 'income' ? 'Gelir' : 'Gider',
      Açıklama: t.description || ''
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Islemler");

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    // eslint-disable-next-line import/namespace
    const uri = FileSystem.cacheDirectory + 'finansal_rapor.xlsx';
    
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0B0F]" edges={['top', 'left', 'right']}>
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      <GlobalAppBar level={2} module="finans" title={mode === 'mutabakat' ? "AI Mutabakat" : "Smart Financial Assistant"} showProfile={false} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.Version < 30 ? 'padding' : undefined)}
      >
        <ScrollView className="flex-1 px-4 pt-4">
          {messages.map((msg) => (
            <View key={msg.id} className={`mb-4 max-w-[80%] rounded-2xl p-3 ${
              msg.sender === 'user' ? 'bg-[#22D3EE]/20 self-end' :
              msg.sender === 'system' ? 'bg-green-500/20 self-center border border-green-500/50' :
              'bg-[#1A1D26] self-start border border-white/5'
            }`}>
              <Text className={`${msg.sender === 'system' ? 'text-green-400 font-bold text-center' : 'text-[#F3F4F6]'} text-sm`}>{msg.text}</Text>
            </View>
          ))}
          {loading && (
            <View className="self-start bg-[#1A1D26] p-3 rounded-2xl mb-4">
              <ActivityIndicator color="#22D3EE" />
            </View>
          )}
        </ScrollView>
        <ChatInputBar 
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSend}
          placeholder={mode === 'mutabakat' ? "Mesajınızı yazın..." : "Rapor isteyin (Örn: Excel raporu)"}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
