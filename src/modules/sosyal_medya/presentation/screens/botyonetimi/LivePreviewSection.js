/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { styles } from './botStyles';
import { Ionicons } from '@expo/vector-icons';

export function LivePreviewSection({ chatInput, chatListRef, isTyping, messages, sendMessage, setChatInput, t }) {
  return (
    <View style={styles.glassCard} className="mb-4 overflow-hidden">
      <View className="p-4 border-b border-white/5 flex-row justify-between items-center bg-white/2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#22B573" />
          <Text className="text-sm font-semibold text-white">Canlı Test</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-[#22B573]" />
          <Text className="text-[9px] text-[#22B573] font-bold uppercase tracking-wider">SİMÜLASYON</Text>
        </View>
      </View>
    
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(59,130,246,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(59,130,246,0.18)' }}>
        <Ionicons name="information-circle-outline" size={16} color="#9CC2FF" style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, marginLeft: 8, color: '#9CC2FF', fontSize: 11, lineHeight: 16 }}>{t('liveTestInfo')}</Text>
      </View>
    
      {/* Chat Simulator View */}
      <View className="p-4 bg-black/20" style={{ height: 260 }}>
        <ScrollView 
          ref={chatListRef}
          nestedScrollEnabled={true}
          onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {messages.length === 0 && (
            <View>
              <View className="items-center mb-6 mt-2">
                <Text className="text-[#A79E96]/50 text-[9px] font-bold tracking-widest uppercase">
                  SİMÜLASYON BAŞLADI
                </Text>
              </View>
              
              <View className="flex-row justify-end mb-3">
                <View 
                  style={{
                    backgroundColor: 'rgba(34, 181, 115, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(34, 181, 115, 0.3)',
                    borderRadius: 16,
                    padding: 10,
                    maxWidth: '85%'
                  }}
                >
                  <Text style={{ color: '#F6F1EC', fontSize: 11 }}>
                    Merhaba, stoklarınızda mavi renk M beden kışlık mont var mı? Fiyatı nedir?
                  </Text>
                </View>
              </View>
    
              <View className="flex-row justify-start mb-3">
                <View className="w-7 h-7 rounded-full bg-[#C2478D]/20 items-center justify-center mr-2 flex-shrink-0 border border-[#C2478D]/30">
                  <Ionicons name="sparkles" size={12} color="#E8A8CD" />
                </View>
                <View 
                  style={{
                    backgroundColor: 'rgba(32, 31, 34, 0.9)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 16,
                    padding: 10,
                    maxWidth: '85%'
                  }}
                >
                  <Text style={{ color: '#F6F1EC', fontSize: 11, lineHeight: 16 }}>
                    Merhaba! 👋 Evet, mavi renk M beden kışlık montumuz stoklarımızda mevcuttur. Güncel fiyatımız 1.450 TL'dir. Hemen sipariş oluşturmak isterseniz size bir bağlantı gönderebilirim. Başka yardımcı olabileceğim bir konu var mı?
                  </Text>
                </View>
              </View>
            </View>
          )}
    
          {messages.map((item) => (
            <View key={item.id} className={`flex-row ${item.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
              {item.sender === 'bot' && (
                <View className="w-7 h-7 rounded-full bg-[#C2478D]/20 items-center justify-center mr-2 flex-shrink-0 border border-[#C2478D]/30">
                  <Ionicons name="sparkles" size={12} color="#E8A8CD" />
                </View>
              )}
              <View 
                style={{
                  backgroundColor: item.sender === 'user' ? 'rgba(34, 181, 115, 0.15)' : 'rgba(32, 31, 34, 0.9)',
                  borderWidth: 1,
                  borderColor: item.sender === 'user' ? 'rgba(34, 181, 115, 0.3)' : 'rgba(194, 71, 141, 0.3)',
                  borderRadius: 16,
                  borderTopRightRadius: item.sender === 'user' ? 2 : 14,
                  borderTopLeftRadius: item.sender === 'bot' ? 2 : 14,
                  padding: 10,
                  maxWidth: '75%',
                  shadowColor: item.sender === 'bot' ? '#C2478D' : 'transparent',
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                  elevation: item.sender === 'bot' ? 3 : 0
                }}
              >
                <Text style={{ color: item.sender === 'bot' ? '#E8A8CD' : '#F6F1EC', fontSize: 12, lineHeight: 16 }}>{item.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {isTyping && (
          <View className="flex-row justify-start mb-3 items-center">
            <View className="w-7 h-7 rounded-full bg-[#C2478D]/20 items-center justify-center mr-2 border border-[#C2478D]/30">
              <Ionicons name="sparkles" size={12} color="#E8A8CD" />
            </View>
            <ActivityIndicator size="small" color="#C2478D" style={{ marginLeft: 6 }} />
          </View>
        )}
    
        {/* Input Bar */}
        <View className="relative mt-2">
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Test mesajı gönder..."
            placeholderTextColor="#A79E96"
            onSubmitEditing={() => sendMessage(chatInput)}
            style={{
              backgroundColor: 'rgba(32, 31, 34, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderRadius: 20,
              paddingLeft: 16,
              paddingRight: 40,
              paddingVertical: 8,
              color: '#fff',
              fontSize: 12
            }}
          />
          <TouchableOpacity 
            onPress={() => sendMessage(chatInput)}
            style={{ position: 'absolute', right: 8, top: 6 }}
          >
            <Ionicons name="send" size={18} color="#22B573" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
