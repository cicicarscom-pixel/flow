import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import FlowAiSuggestions from './FlowAiSuggestions';
import TypingDots from './TypingDots';
import { LinearGradient } from 'expo-linear-gradient';
import FlowAiOrb from './FlowAiOrb';
import { FlowAiService } from './FlowAiService';
import { dispatchClientAction } from './flowAiActions';
import { subscribeFlowEvents, subscribeGuideStart } from './flowAiEvents';
import { FLOW_GUIDES } from './flowAiGuides';

// Uygulama kökünde (NavigationContainer içinde) durur: ekran değişince panel ve konuşma KAPANMAZ.
// Panel, Modal değil kaplamadır; üstündeki alan dokunmayı alttaki ekrana geçirir.
// publish_post onay sonrası hata kodları → çeviri anahtarı
const PUBLISH_ERRORS = {
  PUBLISH_FAILED: 'flowAi.publish.failed',
  DRAFT_CHANGED: 'flowAi.publish.changed',
  PAYLOAD_CHANGED: 'flowAi.publish.changed',
  DRAFT_ALREADY_USED: 'flowAi.publish.used',
  SCHEDULE_IN_PAST: 'flowAi.publish.past',
};

function formatWhen(preview) {
  try {
    return new Date(preview.scheduledFor).toLocaleString(undefined, { timeZone: preview.timezone, dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return String(preview.scheduledFor || '');
  }
}

export default function FlowAiHost({ navigationRef }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]); // {id, role:'user'|'assistant'|'error', text}
  const [pending, setPending] = useState([]);   // onay bekleyen eylemler
  const [cards, setCards] = useState([]);         // FA6: proaktif öneri kartları
  const cardsAt = useRef(0);
  const conversationId = useRef(null);
  const listRef = useRef(null);
  const seq = useRef(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => pan.flattenOffset(),
    })
  ).current;
  const [guide, setGuide] = useState(null); // {key, step} — rehber modu

  const push = useCallback((role, text) => {
    setMessages((m) => [...m, { id: String(++seq.current), role, text }]);
  }, []);

  const send = useCallback(async (override) => {
    const text = (typeof override === 'string' ? override : input).trim();
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
      // Taslak açıldıysa panel kapanır; kullanıcı doldurulan ekranı görür ve Paylaş'a kendisi basar.
      // Onay kartı bekliyorsa panel AÇIK kalır (kullanıcı kartı görmeli).
      if ((res.clientActions || []).some((a) => a?.type === 'open_post_draft') && !(res.pendingActions || []).length) setOpen(false);
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
      if (approve && res.status === 'EXECUTED' && action.toolName === 'publish_post') {
        push('assistant', t(res.result?.data?.scheduled ? 'flowAi.publish.scheduled' : 'flowAi.publish.published'));
      } else if (approve && res.status !== 'EXECUTED') {
        const code = res.result?.status || res.status;
        const key = PUBLISH_ERRORS[code];
        push('error', t(key || 'flowAi.notApplied'));
      } else {
        const ok = res.status === 'EXECUTED' || res.status === 'REJECTED';
        push(ok ? 'assistant' : 'error', t(ok ? (approve ? 'flowAi.approved' : 'flowAi.rejected') : 'flowAi.notApplied'));
      }
    } catch (e) {
      push('error', t('flowAi.error'));
    } finally {
      setBusy(false);
    }
  }, [push, t]);

  // FA6: panel açılınca (en fazla dakikada bir) öneri kartlarını yükle. Hata sessizdir: kart yoksa panel normal çalışır.
  useEffect(() => {
    if (!open || Date.now() - cardsAt.current < 60000) return;
    cardsAt.current = Date.now();
    let alive = true;
    FlowAiService.suggestions()
      .then((r) => { if (alive) setCards(Array.isArray(r?.cards) ? r.cards : []); })
      .catch(() => { cardsAt.current = 0; });
    return () => { alive = false; };
  }, [open]);

  const dismissCard = useCallback((id) => setCards((c) => c.filter((x) => x.id !== id)), []);
  const cardPrompt = useCallback((text, id) => { dismissCard(id); send(text); }, [dismissCard, send]);
  const cardNavigate = useCallback((screen, id) => {
    dismissCard(id);
    dispatchClientAction({ type: 'navigate', screen }, navigationRef);
    setOpen(false);
  }, [dismissCard, navigationRef]);

  // --- Rehber modu: adım adım "birlikte yapalım" ---
  const finishGuide = useCallback((completed) => {
    setGuide(null);
    push('assistant', t(completed ? 'flowAi.guide.done' : 'flowAi.guide.cancelled'));
    setOpen(true);
  }, [push, t]);

  const advanceGuide = useCallback(() => {
    setGuide((g) => {
      if (!g) return g;
      const steps = FLOW_GUIDES[g.key].steps;
      return g.step + 1 < steps.length ? { ...g, step: g.step + 1 } : g;
    });
  }, []);

  useEffect(() => subscribeGuideStart((key) => {
    if (!FLOW_GUIDES[key]) return;
    setOpen(false);
    setGuide({ key, step: 0 });
  }), []);

  useEffect(() => subscribeFlowEvents((name) => {
    setGuide((g) => {
      if (!g) return g;
      const steps = FLOW_GUIDES[g.key].steps;
      const cur = steps[g.step];
      return cur?.event === name && g.step + 1 < steps.length ? { ...g, step: g.step + 1 } : g;
    });
  }), []);

  useEffect(() => {
    if (!guide) return undefined;
    const def = FLOW_GUIDES[guide.key];
    const timer = setTimeout(() => dispatchClientAction({ type: 'highlight', screen: def.screen, targetId: def.steps[guide.step].target }, navigationRef), 350);
    return () => clearTimeout(timer);
  }, [guide, navigationRef]);

  if (guide) {
    const def = FLOW_GUIDES[guide.key];
    const isLast = guide.step === def.steps.length - 1;
    return (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <View testID="flow_ai_guide" style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, backgroundColor: '#12151C', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(0,162,255,0.55)', shadowColor: '#00a2ff', shadowOpacity: 0.45, shadowRadius: 12, elevation: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="sparkles" size={16} color="#00DAF3" />
            <Text style={{ color: '#00DAF3', fontWeight: '700', marginLeft: 6, flex: 1 }}>{t('flowAi.guide.title', { step: guide.step + 1, total: def.steps.length })}</Text>
          </View>
          <Text style={{ color: '#fff' }}>{t(def.steps[guide.step].textKey)}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            {!isLast && (
              <TouchableOpacity onPress={advanceGuide} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', marginRight: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('flowAi.guide.skip')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => finishGuide(isLast)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#3B82F6' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t(isLast ? 'flowAi.guide.finish' : 'flowAi.guide.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!open) {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          { position: 'absolute', right: 16, bottom: 96 + insets.bottom / 2 },
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
        ]}
      >
        <FlowAiOrb
          label={t('flowAi.orbLabel')}
          accessibilityLabel={t('flowAi.open')}
          onPress={() => setOpen(true)}
        />
      </Animated.View>
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
          maxHeight: '55%', minHeight: 280, backgroundColor: 'rgba(18,21,28,0.97)', borderTopLeftRadius: 18, borderTopRightRadius: 18,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingBottom: insets.bottom,
          shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 24, elevation: 16,
        }}
      >
        {/* Başlık: Ledger AI ile aynı düzen (degrade avatar + çevrimiçi) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
          <LinearGradient colors={['#3B82F6', '#9D5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </LinearGradient>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('flowAi.title')}</Text>
            <Text style={{ color: '#3FB950', fontSize: 12 }}>{t('flowAi.online')}</Text>
          </View>
          <TouchableOpacity onPress={() => setOpen(false)} accessibilityLabel={t('flowAi.close')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 6 }}>
            <Ionicons name="close" size={20} color="#8B949E" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
          ListEmptyComponent={
            <View>
              <Text style={{ color: '#8B949E', textAlign: 'center', marginVertical: 14 }}>{t('flowAi.empty')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['chipAppointments', 'chipPost', 'chipAccounts'].map((k) => (
                  <TouchableOpacity key={k} onPress={() => send(t(`flowAi.${k}`))} style={{ margin: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <Text style={{ color: '#8B949E', fontSize: 12 }}>{t(`flowAi.${k}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={busy && messages.length > 0 ? (
            <View testID="flow_ai_typing" style={{ alignSelf: 'flex-start', marginVertical: 4, borderRadius: 18, borderTopLeftRadius: 6, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <TypingDots color="#9D5CFF" size={7} />
            </View>
          ) : null}
          renderItem={({ item }) => {
            const mine = item.role === 'user';
            const bubble = { maxWidth: '85%', marginVertical: 4, borderRadius: 18, overflow: 'hidden' };
            if (mine) {
              return (
                <View style={[bubble, { alignSelf: 'flex-end', borderTopRightRadius: 6 }]}>
                  <LinearGradient colors={['#3B82F6', '#9D5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 11 }}>
                    <Text style={{ color: '#fff', fontSize: 14 }}>{item.text}</Text>
                  </LinearGradient>
                </View>
              );
            }
            return (
              <View style={[bubble, { alignSelf: 'flex-start', borderTopLeftRadius: 6, padding: 11, borderWidth: 1, borderColor: item.role === 'error' ? 'rgba(248,81,73,0.35)' : 'rgba(255,255,255,0.05)', backgroundColor: item.role === 'error' ? 'rgba(248,81,73,0.10)' : 'rgba(255,255,255,0.04)' }]}>
                <Text style={{ color: '#D7DEE7', fontSize: 14 }}>{item.text}</Text>
              </View>
            );
          }}
        />

        {messages.length === 0 && pending.length === 0 && (
          <FlowAiSuggestions cards={cards} onPrompt={cardPrompt} onNavigate={cardNavigate} onDismiss={dismissCard} />
        )}

        {pending.map((p) => {
          const isPublish = p.toolName === 'publish_post' && p.preview?.text;
          return (
            <View key={p.id} style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,218,243,0.15)' }}>
              <Text style={{ color: '#00DAF3', fontWeight: '600', fontSize: 12 }}>{t(isPublish ? 'flowAi.publish.title' : 'flowAi.pendingTitle')}</Text>
              {isPublish ? (
                <>
                  <Text style={{ color: '#9FB0C3', marginTop: 4, fontSize: 12 }}>
                    {(p.preview.platforms || []).join(', ')} · {p.preview.mode === 'schedule' ? t('flowAi.publish.at', { when: formatWhen(p.preview) }) : t('flowAi.publish.now')}
                  </Text>
                  <Text style={{ color: '#D7DEE7', marginTop: 6 }} numberOfLines={8}>{p.preview.text}</Text>
                </>
              ) : (
                <Text style={{ color: '#D7DEE7', marginTop: 2 }} numberOfLines={3}>{p.preview?.description || p.toolName}</Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity disabled={busy} onPress={() => decide(p, true)} style={{ flex: 1, backgroundColor: '#238636', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginRight: 6 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t(isPublish ? (p.preview.mode === 'schedule' ? 'flowAi.publish.approveSchedule' : 'flowAi.publish.approveNow') : 'flowAi.approve')}</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={busy} onPress={() => decide(p, false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t(isPublish ? 'flowAi.publish.cancel' : 'flowAi.reject')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
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
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
