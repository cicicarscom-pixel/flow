import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, ImageBackground, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, ChatInputBar, GlobalAppBar } from '../../../../shared';

export default function MutabakatChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [unpaidDocuments, setUnpaidDocuments] = useState([]);

  useEffect(() => {
    const fetchPastUnpaid = async () => {
      try {
        const { data: documents, error } = await supabase
          .from('finance_documents')
          .select('*')
          .in('payment_status', ['unpaid', 'partial']);

        if (error) throw error;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter out current month, keep only past unpaid/partial
        const pastUnpaid = (documents || []).filter(doc => {
          const dDate = new Date(doc.created_at);
          return !(dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear);
        });

        setUnpaidDocuments(pastUnpaid);

        let totalReceivable = 0;
        let totalPayable = 0;

        pastUnpaid.forEach(doc => {
          const amount = Number(doc.amount_minor) / 100;
          if (doc.type === 'income') totalReceivable += amount;
          if (doc.type === 'expense') totalPayable += amount;
        });

        const initialText = `Merhaba! Geçtiğimiz aylardan devreden tahsil edilmemiş ${totalReceivable.toLocaleString('tr-TR')} ₺ alacağınız ve ödenmemiş ${totalPayable.toLocaleString('tr-TR')} ₺ gideriniz bulunuyor. Bu listede ödediğiniz veya tahsil ettiğiniz bir işlem var mı?`;
        
        setMessages([{ id: 1, text: initialText, sender: 'ai' }]);

      } catch (err) {
        console.warn("Error fetching past unpaid documents", err);
        setMessages([{ id: 1, text: "Geçmiş dönem kayıtlarınızı çekerken bir sorun oluştu.", sender: 'ai' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastUnpaid();
  }, []);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender }]);
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = inputText;
    addMessage(userMessage, 'user');
    setInputText('');
    setLoading(true);

    try {
      const payload = {
        message: userMessage,
        unpaidDocuments: unpaidDocuments,
        history: messages.map(m => ({
          role: m.sender === 'ai' ? 'model' : 'user',
          content: m.text
        }))
      };

      const { data: result, error: invokeError } = await supabase.functions.invoke('mutabakat-chat', {
        body: payload
      });

      if (invokeError) throw invokeError;
      if (result.error) throw new Error(result.error);

      addMessage(result.text, 'ai');

      // If documents were updated, we might want to refresh the unpaid list
      // For simplicity, we just leave it or refetch, or let Realtime handle it if we had a subscription.
      if (result.updatedCount > 0) {
        // Optimistically remove them from local state so the next prompt doesn't include them
        setUnpaidDocuments(prev => prev.filter(doc => !result.paid_document_ids.includes(doc.id)));
      }

    } catch (error) {
      console.error(error);
      addMessage("Sistemlerimizde anlık bir yoğunluk yaşanıyor, lütfen tekrar deneyin.", 'ai');
    } finally {
      setLoading(false);
    }
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
        <GlobalAppBar level={3} module="finans" title="Ay Sonu Mutabakatı" onBack={() => navigation.goBack()} />

        {/* Chat Area */}
        <ScrollView className="flex-1 px-4 pt-4">
          {messages.map((msg) => (
            <View key={msg.id} className={`mb-4 max-w-[80%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-[#ff4a4a]/20 self-end' : 'bg-[#1c1c1e] self-start border border-white/5'}`}>
              <Text className="text-[#e5e2e3] text-sm leading-5">{msg.text}</Text>
            </View>
          ))}
          {loading && (
            <View className="self-start bg-[#1c1c1e] p-3 rounded-2xl mb-4">
              <ActivityIndicator color="#ff4a4a" />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <ChatInputBar 
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSendText}
          placeholder="Ödediğiniz faturaları yazın..."
          onAttachImage={() => {}}
          onAttachGallery={() => {}}
          onAttachDocument={() => {}}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
