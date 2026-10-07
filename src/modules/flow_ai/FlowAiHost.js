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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { flowAiShareHandoff } from './flowAiShareHandoff';
import { useFlowVoice } from './useFlowVoice';

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
  const voice = useFlowVoice();
  const [voiceReplies, setVoiceReplies] = useState(false);
  const lastWasVoice = useRef(false);
  const [open, setOpen] = useState(false);
  const [attachmentMeta, setAttachmentMeta] = useState(null);
  const [shareJobPending, setShareJobPending] = useState(null);
  const [shareConfirmState, setShareConfirmState] = useState('IDLE');
  const [platformPick, setPlatformPick] = useState(null);
  const [pickSel, setPickSel] = useState({});
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

  useEffect(() => {
    if (!open) voice.stopSpeaking();
  }, [open]);

  useEffect(() => {
    const unSub = subscribeFlowEvents((name, payload) => {
      if (name === 'share-result') {
        if (payload.ok) {
          const msg = shareJobPending?.scheduledLocal ? t('flowAi.share.scheduled') : t('flowAi.share.done');
          push('assistant', msg);
          if (voiceReplies || lastWasVoice.current) voice.speak(msg);
          setShareJobPending(null);
          setAttachmentMeta(null);
          setShareConfirmState('IDLE');
          flowAiShareHandoff.clear();
        } else {
          const msg = t('flowAi.share.failed', { message: payload.message || '' });
          push('error', msg);
          if (voiceReplies || lastWasVoice.current) voice.speak(msg);
          setShareJobPending(null);
          setShareConfirmState('IDLE');
        }
      }
    });
    return unSub;
  }, [push, shareJobPending, t, voiceReplies]);

  const handleAttach = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: false, quality: 1 });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        if (!Number.isFinite(asset.duration) || asset.duration <= 0) {
          push('error', t('flowAi.share.unreadable'));
          return;
        }
        
        let sizeBytes = asset.fileSize;
        if (sizeBytes === undefined) {
          const info = await FileSystem.getInfoAsync(asset.uri);
          if (info.exists) sizeBytes = info.size;
        }
        if (!sizeBytes || sizeBytes <= 0) {
          push('error', t('flowAi.share.unreadable'));
          return;
        }
        
        const meta = {
          kind: 'video',
          mimeType: asset.mimeType || 'video/mp4',
          durationSec: asset.duration / 1000,
          width: asset.width,
          height: asset.height,
          sizeBytes: sizeBytes,
          fileName: (asset.fileName || asset.uri.split('/').pop() || 'video.mp4').substring(0, 120),
          uri: asset.uri
        };
        setAttachmentMeta(meta);
        flowAiShareHandoff.attach(meta);
      }
    } catch (e) {
      push('error', t('flowAi.share.unreadable'));
    }
  };

  const send = useCallback(async (override) => {
    voice.stopSpeaking();
    setPlatformPick(null);
    const text = (typeof override === 'string' ? override : input).trim();
    if (!text || busy) return;
    setInput('');
    push('user', text);
    setBusy(true);
    try {
      const res = await FlowAiService.chat(text, conversationId.current, attachmentMeta);
      conversationId.current = res.conversationId;
      push('assistant', res.reply);
      if (voiceReplies || lastWasVoice.current) voice.speak(res.reply);
      setPending(res.pendingActions || []);
      
      const actions = res.clientActions || [];
      actions.forEach((a) => {
        if (a?.type === 'share_video') {
          // It's dispatched via actions, we also intercept it here to set pending state
          const { caption, platforms, skipped, scheduledLocal, timezone } = a;
          const job = { caption, platforms, skipped: skipped || [], scheduledLocal: scheduledLocal || null, timezone };
          setShareJobPending(job);
        } else if (a?.type === 'pick_platforms') {
          const opts = (Array.isArray(a.options) ? a.options : []).slice(0, 10).filter((o) => o && typeof o.platform === 'string' && typeof o.eligible === 'boolean');
          if (opts.length > 0) {
            setPlatformPick(opts.map((o) => ({ platform: o.platform, handle: typeof o.handle === 'string' ? o.handle : '', eligible: o.eligible, reason: typeof o.reason === 'string' ? o.reason : undefined })));
            setPickSel(Object.fromEntries(opts.filter((o) => o.eligible).map((o) => [o.platform, true])));
          }
        }
        dispatchClientAction(a, navigationRef);
      });

      if (actions.some((a) => a?.type === 'open_post_draft') && !(res.pendingActions || []).length && !actions.some(a => a?.type === 'share_video')) {
        setOpen(false);
      }
    } catch (e) {
      push('error', e.code === 'DAILY_LIMIT' ? t('flowAi.dailyLimit', { limit: e.limit ?? '' }) : t('flowAi.error'));
    } finally {
      setBusy(false);
    }
  }, [input, busy, navigationRef, push, t, attachmentMeta, shareJobPending, voiceReplies]);

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

  const handleVoiceFinal = async (text) => {
    const norm = text.toLowerCase().replace(/[.!?,]/g, '').trim();
    const YES = ['evet', 'onayla', 'onaylıyorum', 'tamam', 'olur', 'paylaş', 'yes', 'ja'];
    const NO = ['hayır', 'vazgeç', 'iptal', 'istemiyorum', 'no', 'nein'];
    
    if (shareJobPending && YES.includes(norm)) { 
      if (!busy) {
        const r = await flowAiShareHandoff.confirm(); 
        setShareConfirmState(r); 
      }
      return; 
    }
    if (shareJobPending && NO.includes(norm)) { 
      if (!busy) {
        setShareJobPending(null);
        setAttachmentMeta(null);
        setShareConfirmState('IDLE');
        flowAiShareHandoff.clear();
      }
      return; 
    }
    if (pending.length === 1 && YES.includes(norm)) { if (!busy) decide(pending[0], true); return; }
    if (pending.length === 1 && NO.includes(norm)) { if (!busy) decide(pending[0], false); return; }
    
    setInput('');
    send(text);
  };

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
          <TouchableOpacity onPress={() => setVoiceReplies(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 6, marginRight: 8 }} accessibilityLabel={voiceReplies ? t('flowAi.voice.repliesOn') : t('flowAi.voice.repliesOff')}>
            <Ionicons name={voiceReplies ? "volume-high" : "volume-mute"} size={20} color={voiceReplies ? "#3FB950" : "#8B949E"} />
          </TouchableOpacity>
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

        {shareJobPending && (
          <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,218,243,0.15)' }}>
            <Text style={{ color: '#00DAF3', fontWeight: '600', fontSize: 12 }}>{t('flowAi.share.title')}</Text>
            <Text style={{ color: '#9FB0C3', marginTop: 4, fontSize: 12 }}>
              {shareJobPending.platforms.join(', ')} · {shareJobPending.scheduledLocal ? shareJobPending.scheduledLocal : t('flowAi.publish.now')}
            </Text>
            <Text style={{ color: '#D7DEE7', marginTop: 6 }} numberOfLines={8}>{shareJobPending.caption}</Text>
            
            {shareConfirmState === 'STARTED' ? (
              <Text style={{ color: '#3FB950', marginTop: 12, textAlign: 'center', fontWeight: '500' }}>{t('flowAi.share.starting')}</Text>
            ) : shareConfirmState === 'NOT_READY' ? (
              <Text style={{ color: '#E3B341', marginTop: 12, textAlign: 'center', fontWeight: '500' }}>{t('flowAi.share.wait')}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity disabled={busy || shareConfirmState === 'STARTED'} onPress={async () => {
                const res = await flowAiShareHandoff.confirm();
                setShareConfirmState(res);
              }} style={{ flex: 1, backgroundColor: '#238636', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginRight: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.share.confirm')}</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={busy || shareConfirmState === 'STARTED'} onPress={() => {
                setShareJobPending(null);
                flowAiShareHandoff.clear();
                setAttachmentMeta(null);
                setShareConfirmState('IDLE');
              }} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.share.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {platformPick && (
          <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,218,243,0.15)' }}>
            <Text style={{ color: '#00DAF3', fontWeight: '600', fontSize: 12, marginBottom: 8 }}>{t('flowAi.share.pickTitle')}</Text>
            
            <View style={{ gap: 6, marginBottom: 12 }}>
              {platformPick.map((o, i) => (
                <TouchableOpacity
                  key={i}
                  disabled={!o.eligible}
                  onPress={() => setPickSel(s => ({ ...s, [o.platform]: !s[o.platform] }))}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: pickSel[o.platform] ? 'rgba(0,218,243,0.1)' : 'rgba(255,255,255,0.03)',
                    opacity: o.eligible ? 1 : 0.5
                  }}
                >
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: o.eligible ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                      {o.platform.charAt(0).toUpperCase() + o.platform.slice(1)} {o.handle ? <Text style={{ opacity: 0.6, fontWeight: '400' }}>@{o.handle}</Text> : null}
                    </Text>
                    {!o.eligible && o.reason && (
                      <Text style={{ fontSize: 11, color: '#FF7A59', marginTop: 2 }}>{o.reason}</Text>
                    )}
                  </View>
                  {pickSel[o.platform] && <Text style={{ color: '#00DAF3', fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                disabled={!Object.values(pickSel).some(Boolean)}
                onPress={() => {
                  const names = Object.keys(pickSel).filter((k) => pickSel[k]);
                  setPlatformPick(null);
                  send(`${t('flowAi.share.pickedPrefix')}: ${names.join(', ')}`);
                }}
                style={{ flex: 1, backgroundColor: '#00DAF3', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginRight: 6, opacity: Object.values(pickSel).some(Boolean) ? 1 : 0.5 }}
              >
                <Text style={{ color: '#000', fontWeight: '700' }}>{t('flowAi.share.pickContinue')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPlatformPick(null)}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.share.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {attachmentMeta && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 6, marginHorizontal: 12, marginBottom: 8, alignSelf: 'flex-start' }}>
            <Ionicons name="videocam" size={14} color="#8B949E" />
            <Text style={{ color: '#D7DEE7', fontSize: 12, marginLeft: 4 }}>{attachmentMeta.fileName} ({Math.round(attachmentMeta.durationSec)}s)</Text>
            <TouchableOpacity onPress={() => { setAttachmentMeta(null); flowAiShareHandoff.clear(); }} style={{ marginLeft: 6, padding: 2 }}>
              <Ionicons name="close-circle" size={14} color="#F85149" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
          <TouchableOpacity onPress={handleAttach} disabled={busy} style={{ marginRight: 8, padding: 4 }}>
            <Ionicons name="add-circle-outline" size={24} color="#8B949E" />
          </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                if (voice.supported === false) {
                  push('error', t('flowAi.voice.serviceMissing'));
                  return;
                }
                if (voice.listening) {
                  voice.stop();
                } else {
                  lastWasVoice.current = true;
                  voice.start({ 
                    onPartial: setInput, 
                    onFinal: handleVoiceFinal, 
                    onError: (err) => {
                      console.warn('[FlowAI voice]', err);
                      if (err.code === 'permission' || err.code === 'not-allowed') {
                        push('error', t('flowAi.voice.permissionDenied'));
                      } else if (err.code === 'service-not-allowed' || err.code === 'start-failed') {
                        push('error', t('flowAi.voice.serviceMissing'));
                      } else if (err.code === 'language-not-supported') {
                        push('error', t('flowAi.voice.languageMissing'));
                      } else if (err.code === 'network') {
                        push('error', t('flowAi.voice.network'));
                      } else {
                        push('error', t('flowAi.voice.unsupported') + ` (${err.code})`);
                      }
                    } 
                  });
                }
              }} 
              disabled={busy} 
              style={{ marginRight: 8, padding: 4 }}
            >
              <Ionicons name={voice.listening ? "mic-circle" : "mic"} size={24} color={voice.listening ? "#F85149" : "#8B949E"} />
            </TouchableOpacity>
          
          {voice.listening ? (
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' }}>
              <Text style={{ color: '#8B949E' }}>{input || t('flowAi.voice.listening')}</Text>
            </View>
          ) : (
            <TextInput
              testID="flow_ai_input"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => { lastWasVoice.current = false; send(); }}
              editable={!busy}
              placeholder={t('flowAi.placeholder')}
              placeholderTextColor="#65707D"
              maxLength={4000}
              style={{ flex: 1, color: '#fff', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
            />
          )}
          
          <TouchableOpacity testID="flow_ai_send" onPress={() => { lastWasVoice.current = false; send(); }} disabled={busy || !input.trim()} style={{ marginLeft: 8, opacity: busy || !input.trim() ? 0.5 : 1 }}>
            <LinearGradient colors={['#3B82F6', '#9D5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="send" size={17} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
