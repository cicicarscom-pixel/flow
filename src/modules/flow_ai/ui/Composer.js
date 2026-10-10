import React from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Mesaj yazma / sesli sohbet çubuğu (FlowAiHost'tan birebir taşındı).
export default function Composer({
  voiceChat, voicePhase, input, setInput, busy, send, handleAttach, enterVoiceChat, onEndVoice, t,
}) {
  return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
        {voiceChat ? (
        <>
        <TouchableOpacity testID="flow_ai_attach_voice" onPress={handleAttach} disabled={busy} style={{ marginRight: 8, padding: 4, opacity: busy ? 0.5 : 1 }}>
          <Ionicons name="add-circle-outline" size={24} color="#8B949E" />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8 }}>
          <Animated.View style={{ opacity: voicePhase === 'LISTENING' ? 1 : 0.5, marginRight: 8 }}>
            <Ionicons name="mic" size={16} color={voicePhase === 'LISTENING' ? "#F85149" : "#8B949E"} />
          </Animated.View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ color: '#8B949E', fontSize: 13, marginBottom: 2 }}>
              {voicePhase === 'LISTENING' ? t('flowAi.voice.chat.listening') : 
               voicePhase === 'PROCESSING' ? t('flowAi.voice.chat.thinking') :
               voicePhase === 'SPEAKING' ? t('flowAi.voice.chat.speaking') : ''}
            </Text>
            {voicePhase === 'LISTENING' && input ? <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={1}>{input}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => onEndVoice()} style={{ backgroundColor: 'rgba(248,81,73,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: '#F85149', fontWeight: '600', fontSize: 12 }}>{t('flowAi.voice.chat.end')}</Text>
          </TouchableOpacity>
        </View>
        </>
      ) : (
        <>
          <TouchableOpacity onPress={handleAttach} disabled={busy} style={{ marginRight: 8, padding: 4 }}>
            <Ionicons name="add-circle-outline" size={24} color="#8B949E" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={enterVoiceChat} 
            disabled={busy} 
            style={{ marginRight: 8, padding: 4 }}
          >
            <Ionicons name="mic" size={24} color="#8B949E" />
          </TouchableOpacity>

          <TextInput
            testID="flow_ai_input"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            editable={!busy}
            placeholder={t('flowAi.placeholder')}
            placeholderTextColor="#65707D"
            maxLength={4000}
            style={{ flex: 1, color: '#fff', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
          />

          <TouchableOpacity testID="flow_ai_send" onPress={() => send()} disabled={busy || !input.trim()} style={{ marginLeft: 8, opacity: busy || !input.trim() ? 0.5 : 1 }}>
            <LinearGradient colors={['#3B82F6', '#9D5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="send" size={17} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
      </View>
  );
}
