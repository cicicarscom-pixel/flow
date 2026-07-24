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

  const fetchPastUnpaidDocs = async () => {
    try {
      const { data: documents, error } = await supabase
        .from('finance_documents')
        .select('*')
        .in('flow_payment_status', ['unpaid', 'partial']);

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filter out current month
      const past = (documents || []).filter(doc => {
        const dDate = new Date(doc.created_at);
        return !(dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear);
      });

      setPastDocs(past);

      let totalReceivable = 0;
      let totalPayable = 0;

      past.forEach(doc => {
        const amount = Number(doc.amount_minor) / 100;
        if (doc.type === 'income') totalReceivable += amount;
        if (doc.type === 'expense') totalPayable += amount;
      });

      const initialMessage = `Geçtiğimiz aylardan devreden ${totalReceivable.toLocaleString('tr-TR')} TL tahsil edilmemiş alacağınız ve ${totalPayable.toLocaleString('tr-TR')} TL ödenmemiş gideriniz var. Bu listede ödediğiniz var mı?`;
      setMessages([{ id: Date.now(), text: initialMessage, sender: 'ai' }]);
    } catch (error) {
      console.warn("Error fetching past unpaid docs", error);
    }
  };

  useEffect(() => {
    if (mode === 'mutabakat') {
      fetchPastUnpaidDocs();
    } else {
      setMessages([
        { id: 1, text: "Merhaba! Finansal verilerinizle ilgili sorular sorabilir veya 'Bana Excel/PDF raporu ver' diyebilirsiniz.", sender: 'ai' }
      ]);
    }
  }, [mode]);



  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender }]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userText = inputText;
    addMessage(userText, 'user');
    setInputText('');
    setLoading(true);

    if (mode === 'mutabakat') {
      try {
        const { data, error } = await supabase.functions.invoke('mutabakat-chat', {
          body: {
            message: userText,
            pastDocs: pastDocs
          }
        });

        if (error) throw error;

        addMessage(data.reply, 'ai');
        
        // Refresh data if AI made changes
        if (data.updated_ids && data.updated_ids.length > 0) {
          fetchPastUnpaidDocs();
        }
      } catch (error) {
        console.error(error);
        addMessage("Bağlantı hatası oluştu, lütfen tekrar deneyin.", 'ai');
      } finally {
        setLoading(false);
      }
    } else {
      // Report Mode
      try {
        const lowerText = userText.toLowerCase();
        
        if (lowerText.includes('pdf')) {
          await generatePDFReport();
          addMessage("PDF raporunuz hazırlandı ve paylaşıma açıldı.", 'ai');
        } else if (lowerText.includes('excel')) {
          await generateExcelReport();
          addMessage("Excel raporunuz hazırlandı ve paylaşıma açıldı.", 'ai');
        } else {
          addMessage("Sizi anlıyorum ancak detaylı analiz için henüz sadece PDF ve Excel rapor dökümlerini destekliyorum. Lütfen 'PDF ver' veya 'Excel raporu oluştur' yazın.", 'ai');
        }
      } catch (error) {
        console.error(error);
        addMessage("Bir hata oluştu. Lütfen tekrar deneyin.", 'ai');
      } finally {
        setLoading(false);
      }
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
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
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
            <View key={msg.id} className={`mb-4 max-w-[80%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-[#00f0ff]/20 self-end' : 'bg-[#1c1c1e] self-start border border-white/5'}`}>
              <Text className="text-[#e5e2e3] text-sm">{msg.text}</Text>
            </View>
          ))}
          {loading && (
            <View className="self-start bg-[#1c1c1e] p-3 rounded-2xl mb-4">
              <ActivityIndicator color="#00f0ff" />
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
