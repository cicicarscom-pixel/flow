import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../core/theme/designSystem';
import { FlowAiService } from './FlowAiService';
import { dispatchClientAction } from './flowAiActions';

// Uygulama kökünde (NavigationContainer içinde) durur: ekran değişince panel ve konuşma KAPANMAZ.
// Panel, Modal değil kaplamadır; üstündeki alan dokunmayı alttaki ekrana geçirir.
export default function FlowAiHost({ navigationRef }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]); // {id, role:'user'|'assistant'|'error', text}
  const [pending, setPending] = useState([]);   // onay bekleyen eylemler
  const conversationId = useRef(null);
  const listRef = useRef(null);
  const seq = useRef(0);

  const push = useCallback((role, text) => {
    setMessages((m) => [...m, { id: String(++seq.current), role, text }]);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    push('user', text);
    setBusy(true);
    try {
      const res = await FlowAiService.chat(text, conversationId.current);
      conversationId.current = res.conversationId;
      push('assistant', res.reply);
      setPending(res.pendingActions || []);
      (res.clientActions || []).forEach((a) => dispatchClientAction(a, navigationRef));
    } catch (e) {
      push('error', e.code === 'DAILY_LIMIT' ? t('flowAi.dailyLimit', { limit: e.limit ?? '' }) : t('flowAi.error'));
    } finally {
      setBusy(false);
    }
  }, [input, busy, navigationRef, push, t]);

  const decide = useCallback(async (action, approve) => {
    setBusy(true);
    try {
      const res = approve ? await FlowAiService.approve(action.id, action.payloadHash) : await FlowAiService.reject(action.id);
      setPending((p) => p.filter((x) => x.id !== action.id));
      const ok = res.status === 'EXECUTED' || res.status === 'REJECTED';
      push(ok ? 'assistant' : 'error', t(ok ? (approve ? 'flowAi.approved' : 'flowAi.rejected') : 'flowAi.notApplied'));
    } catch (e) {
      push('error', t('flowAi.error'));
    } finally {
      setBusy(false);
    }
  }, [push, t]);

  if (!open) {
    return (
      <TouchableOpacity
        testID="flow_ai_fab"
        accessibilityLabel={t('flowAi.open')}
        onPress={() => setOpen(true)}
        style={{
          position: 'absolute', right: 16, bottom: 96 + insets.bottom / 2, width: 52, height: 52, borderRadius: 26,
          backgroundColor: Colors.surfaceElevated ?? '#2A2631', alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#FF7A59', elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6,
        }}
      >
        <Ionicons name="sparkles" size={24} color="#FF7A59" />
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      pointerEvents="box-none"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end' }}
    >
      <View
        testID="flow_ai_panel"
        style={{
          maxHeight: '55%', minHeight: 260, backgroundColor: Colors.surface ?? '#201D24', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          borderWidth: 1, borderColor: '#34303C', paddingBottom: insets.bottom,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
          <Ionicons name="sparkles" size={18} color="#FF7A59" />
          <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8, flex: 1 }}>{t('flowAi.title')}</Text>
          <TouchableOpacity onPress={() => setOpen(false)} accessibilityLabel={t('flowAi.close')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
          ListEmptyComponent={<Text style={{ color: '#9A94A5', textAlign: 'center', marginTop: 24 }}>{t('flowAi.empty')}</Text>}
          renderItem={({ item }) => (
            <View style={{ alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', marginVertical: 3, padding: 10, borderRadius: 14,
              backgroundColor: item.role === 'user' ? '#FF7A59' : item.role === 'error' ? '#4A2128' : '#2A2631' }}>
              <Text style={{ color: '#fff' }}>{item.text}</Text>
            </View>
          )}
        />

        {pending.map((p) => (
          <View key={p.id} style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 12, backgroundColor: '#34303C' }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{t('flowAi.pendingTitle')}</Text>
            <Text style={{ color: '#CFCAD8', marginTop: 2 }} numberOfLines={3}>{p.preview?.description || p.toolName}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity disabled={busy} onPress={() => decide(p, true)} style={{ flex: 1, backgroundColor: '#22B573', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginRight: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.approve')}</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={busy} onPress={() => decide(p, false)} style={{ flex: 1, backgroundColor: '#4A4553', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.reject')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 }}>
          <TextInput
            testID="flow_ai_input"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            editable={!busy}
            placeholder={t('flowAi.placeholder')}
            placeholderTextColor="#7C7686"
            maxLength={4000}
            style={{ flex: 1, color: '#fff', backgroundColor: '#2A2631', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 }}
          />
          <TouchableOpacity testID="flow_ai_send" onPress={send} disabled={busy || !input.trim()} style={{ marginLeft: 8, width: 42, height: 42, borderRadius: 21, backgroundColor: '#FF7A59', alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.5 : 1 }}>
            {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
