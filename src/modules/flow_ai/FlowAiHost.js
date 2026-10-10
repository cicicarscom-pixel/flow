import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Text, TouchableOpacity, View,
  AppState,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import FlowAiSuggestions from './FlowAiSuggestions';
import GuideBanner from './ui/GuideBanner';
import MessageList from './ui/MessageList';
import PendingActions from './ui/PendingActions';
import SharePendingCard from './ui/SharePendingCard';
import PlatformPickCard from './ui/PlatformPickCard';
import AttachmentChip from './ui/AttachmentChip';
import Composer from './ui/Composer';
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
const VOICE_DEBUG = false;
const PUBLISH_ERRORS = {
  PUBLISH_FAILED: 'flowAi.publish.failed',
  DRAFT_CHANGED: 'flowAi.publish.changed',
  PAYLOAD_CHANGED: 'flowAi.publish.changed',
  DRAFT_ALREADY_USED: 'flowAi.publish.used',
  SCHEDULE_IN_PAST: 'flowAi.publish.past',
};

export default function FlowAiHost({ navigationRef }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const voice = useFlowVoice();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const exitVoiceChatRef = useRef(null);
  const bgTimerRef = useRef(null);
  const latest = useRef({});
  const voiceChatRef = useRef(false);
  const pickingRef = useRef(false); // video seçici açıkken uygulama arka plana düşer; sesli sohbet kapanmasın
  const voiceSessionRef = useRef(0);
  const silenceCount = useRef(0);
  const confirmArmedRef = useRef(null);
  const [voiceChat, setVoiceChat] = useState(false);
  const [voicePhase, setVoicePhase] = useState('IDLE');

  const handleVoiceFinalRef = useRef(null);
  const handleVoiceErrorRef = useRef(null);
  const handleSilenceRef = useRef(null);
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
  const atBottomRef = useRef(true);
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

  const transition = useCallback((to) => {
    setVoicePhase(prev => {
      if (to === 'IDLE') return to;
      if (prev === 'IDLE' && to === 'LISTENING') return to;
      if (prev === 'LISTENING' && (to === 'PROCESSING' || to === 'LISTENING' || to === 'SPEAKING')) return to; // Added LISTENING->SPEAKING
      if (prev === 'PROCESSING' && (to === 'SPEAKING' || to === 'LISTENING')) return to;
      if (prev === 'SPEAKING' && to === 'LISTENING') return to;
      return prev;
    });
  }, []);

  const exitVoiceChat = useCallback((reason) => {
    if (bgTimerRef.current) { clearTimeout(bgTimerRef.current); bgTimerRef.current = null; }
    if (VOICE_DEBUG && voiceChatRef.current) {
      push('assistant', '[ses] kapandı: ' + (reason || 'bilinmiyor'));
    }
    voiceChatRef.current = false;
    voiceSessionRef.current += 1;
    setVoiceChat(false);
    transition('IDLE');
    voiceRef.current.stop();
    voiceRef.current.stopSpeaking();
    setInput('');
  }, [transition, push]);

  const speakThen = useCallback((text, next) => {
    transition('SPEAKING');
    const sid = voiceSessionRef.current;
    voiceRef.current.speak(text, () => {
      if (sid !== voiceSessionRef.current || !voiceChatRef.current) return;
      if (next) next();
    });
  }, [transition]);

  const push = useCallback((role, text) => {
    if (role === 'user') atBottomRef.current = true;
    setMessages((m) => [...m, { id: String(++seq.current), role, text }]);
  }, []);

  useEffect(() => {
    if (!open) exitVoiceChatRef.current?.('panel-kapandi');
  }, [open]);

  useEffect(() => {
    return () => exitVoiceChatRef.current?.('unmount');
  }, []);

  useEffect(() => {
    const unSub = subscribeFlowEvents((name, payload) => {
      if (name === 'share-result') {
        if (payload.ok) {
          const msg = shareJobPending?.scheduledLocal ? t('flowAi.share.scheduled') : t('flowAi.share.done');
          push('assistant', msg);
          if (voiceChatRef.current) speakThen(msg, startListening);
          setShareJobPending(null);
          setAttachmentMeta(null);
          setShareConfirmState('IDLE');
          flowAiShareHandoff.clear();
        } else {
          const isDup = /already (scheduled|posted)|exact content/i.test(payload.message || '');
          const msg = isDup ? t('flowAi.share.duplicate') : t('flowAi.share.failed', { message: payload.message || '' });
          push('error', msg);
          if (voiceChatRef.current) speakThen(msg, startListening);
          setShareJobPending(null);
          setShareConfirmState('IDLE');
        }
      }
    });
    return unSub;
  }, [push, shareJobPending, t]);

  const handleAttach = async () => {
    // Sesli sohbet açıkken de eklenebilir: seçici süresince dinleme/okuma durur, dönünce dinleme sürer.
    const inVoice = voiceChatRef.current;
    if (inVoice) {
      pickingRef.current = true;
      voiceSessionRef.current += 1; // bekleyen okuma/dinleme geri çağrıları geçersiz
      voiceRef.current.stop();
      voiceRef.current.stopSpeaking();
    }
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
    } catch {
      push('error', t('flowAi.share.unreadable'));
    } finally {
      pickingRef.current = false;
      if (bgTimerRef.current) { clearTimeout(bgTimerRef.current); bgTimerRef.current = null; }
      if (inVoice && voiceChatRef.current) startListening();
    }
  };

  const startListening = useCallback(() => {
    if (!voiceChatRef.current) return;
    const sid = voiceSessionRef.current;
    setTimeout(() => {
      if (sid !== voiceSessionRef.current || !voiceChatRef.current) return;
      transition('LISTENING');
      voiceRef.current.start({
        onPartial: setInput,
        onFinal: (txt) => handleVoiceFinalRef.current?.(txt),
        onError: (err) => handleVoiceErrorRef.current?.(err),
        onSilence: () => handleSilenceRef.current?.(),
        onTrace: VOICE_DEBUG ? (m) => push('assistant', '[ses] ' + m) : undefined
      });
    }, 400);
  }, [transition]);

    useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (VOICE_DEBUG) push('assistant', '[ses] appstate: ' + st);
      if (st === 'background') {
        if (voiceChatRef.current && !bgTimerRef.current && !pickingRef.current) {
          bgTimerRef.current = setTimeout(() => {
            bgTimerRef.current = null;
            exitVoiceChatRef.current?.('arkaplan-4sn');
          }, 4000);
        }
      } else if (st === 'active') {
        if (bgTimerRef.current) { clearTimeout(bgTimerRef.current); bgTimerRef.current = null; }
      }
    });
    return () => { sub.remove(); if (bgTimerRef.current) { clearTimeout(bgTimerRef.current); bgTimerRef.current = null; } };
  }, [push]);

  const handleSilence = useCallback(() => {
    const sid = voiceSessionRef.current;
    if (sid !== voiceSessionRef.current || !voiceChatRef.current) return;
    silenceCount.current += 1;
    if (silenceCount.current === 1) {
      startListening();
    } else {
      speakThen(t('flowAi.voice.chat.closing'), () => exitVoiceChatRef.current?.('sessizlik-x2'));
    }
  }, [speakThen, startListening, exitVoiceChat, t]);

  const enterVoiceChat = useCallback(() => {
    voiceChatRef.current = true;
    voiceSessionRef.current += 1;
    silenceCount.current = 0;
    setVoiceChat(true);
    startListening();
  }, [startListening]);

  const handleVoiceError = useCallback((err) => {
    console.warn('[FlowAI voice]', err);
    const suffix = ` (${err.code}${err.message ? ': ' + err.message : ''})`;
    if (err.code === 'permission' || err.code === 'not-allowed') {
      push('error', t('flowAi.voice.permissionDenied') + suffix);
    } else if (err.code === 'service-not-allowed' || err.code === 'start-failed') {
      push('error', t('flowAi.voice.serviceMissing') + suffix);
    } else if (err.code === 'language-not-supported') {
      push('error', t('flowAi.voice.languageMissing') + suffix);
    } else if (err.code === 'network') {
      push('error', t('flowAi.voice.network') + suffix);
    } else {
      push('error', t('flowAi.voice.unsupported') + suffix);
    }
    exitVoiceChatRef.current?.('hata:' + err.code);
  }, [push, t]);

  const send = useCallback(async (override, opts) => {
    if (!opts?.voice) exitVoiceChatRef.current?.('yazildi');
    
    voiceRef.current.stopSpeaking();
    setPlatformPick(null);
    const text = (typeof override === 'string' ? override : input).trim();
    if (!text || busy) return;
    setInput('');
    push('user', text);
    setBusy(true);
    if (opts?.voice) transition('PROCESSING');
    
    const sid = voiceSessionRef.current;
    
    try {
      const res = await FlowAiService.chat(text, conversationId.current, attachmentMeta, opts);
      if (opts?.voice && sid !== voiceSessionRef.current) return;
      
      conversationId.current = res.conversationId;
      push('assistant', res.reply);
      
      setPending(res.pendingActions || []);
      
      let shouldSpeakReply = opts?.voice;
      
      const actions = res.clientActions || [];
      actions.forEach((a) => {
        if (a?.type === 'share_video') {
          const { caption, platforms, skipped, scheduledLocal, timezone } = a;
          const job = { caption, platforms, skipped: skipped || [], scheduledLocal: scheduledLocal || null, timezone };
          setShareJobPending(job);
          if (opts?.voice) {
            shouldSpeakReply = false;
            confirmArmedRef.current = 'share';
            speakThen(t('flowAi.voice.chat.shareSummary', { platforms: job.platforms.join(', '), when: job.scheduledLocal || t('flowAi.voice.chat.now'), caption: job.caption }), startListening);
          }
        } else if (a?.type === 'pick_platforms') {
          const oarr = (Array.isArray(a.options) ? a.options : []).slice(0, 10).filter((o) => o && typeof o.platform === 'string' && typeof o.eligible === 'boolean');
          if (oarr.length > 0) {
            setPlatformPick(oarr.map((o) => ({ platform: o.platform, handle: typeof o.handle === 'string' ? o.handle : '', eligible: o.eligible, reason: typeof o.reason === 'string' ? o.reason : undefined })));
            setPickSel(Object.fromEntries(oarr.filter((o) => o.eligible).map((o) => [o.platform, true])));
          }
        }
        dispatchClientAction(a, navigationRef);
      });

      if (actions.some((a) => a?.type === 'open_post_draft') && !(res.pendingActions || []).length && !actions.some(a => a?.type === 'share_video')) {
        setOpen(false);
      }

      if (opts?.voice && shouldSpeakReply) {
        if (res.pendingActions && res.pendingActions.length === 1) {
          confirmArmedRef.current = res.pendingActions[0].id;
        }
        speakThen(res.reply, startListening);
      }
    } catch (e) {
      if (opts?.voice && sid !== voiceSessionRef.current) return;
      push('error', e.code === 'DAILY_LIMIT' ? t('flowAi.dailyLimit', { limit: e.limit ?? '' }) : t('flowAi.error'));
      if (opts?.voice) speakThen(t('flowAi.error'), startListening);
    } finally {
      setBusy(false);
    }
  }, [input, busy, navigationRef, push, t, attachmentMeta, shareJobPending, transition, startListening, speakThen, exitVoiceChat]);

  const decide = useCallback(async (action, approve) => {
    setBusy(true);
    try {
      const res = approve ? await FlowAiService.approve(action.id, action.payloadHash) : await FlowAiService.reject(action.id);
      setPending((p) => p.filter((x) => x.id !== action.id));
      if (approve && res.status === 'EXECUTED' && action.toolName === 'publish_post') {
        const msg = t(res.result?.data?.scheduled ? 'flowAi.publish.scheduled' : 'flowAi.publish.published');
        push('assistant', msg);
        if (voiceChatRef.current) speakThen(msg, startListening);
      } else if (approve && res.status !== 'EXECUTED') {
        const code = res.result?.status || res.status;
        const key = PUBLISH_ERRORS[code];
        const msg = t(key || 'flowAi.notApplied');
        push('error', msg);
        if (voiceChatRef.current) speakThen(msg, startListening);
      } else {
        const ok = res.status === 'EXECUTED' || res.status === 'REJECTED';
        push(ok ? 'assistant' : 'error', t(ok ? (approve ? 'flowAi.approved' : 'flowAi.rejected') : 'flowAi.notApplied'));
      }
    } catch {
      push('error', t('flowAi.error'));
    } finally {
      setBusy(false);
    }
  }, [push, t]);

  const handleVoiceFinal = async (text) => {
    const sid = voiceSessionRef.current;
    if (sid !== voiceSessionRef.current || !voiceChatRef.current) return;
    const norm = text.toLowerCase().replace(/[.!?,]/g, '').trim();
    
    const { pending, shareJobPending, busy, send, decide, attachmentMeta } = latest.current;

    const words = norm.split(/\s+/).filter(Boolean);
    const END_WORDS = ['bitir', 'kapat', 'çıkış', 'görüşürüz', 'dur'];
    const isEnd = words.length > 0 && words.length <= 4 && words.some((w) => END_WORDS.includes(w));
    if (isEnd) {
      speakThen(t('flowAi.voice.chat.closedByUser'), () => exitVoiceChatRef.current?.('bitirme-sozu'));
      return;
    }

    const YES = ['evet', 'onayla', 'onaylıyorum', 'tamam', 'olur', 'paylaş', 'yes', 'ja'];
    const NO = ['hayır', 'vazgeç', 'iptal', 'istemiyorum', 'no', 'nein'];
    
    if (shareJobPending && YES.includes(norm) && confirmArmedRef.current === 'share') { 
      if (!busy) {
        confirmArmedRef.current = null;
        const r = await flowAiShareHandoff.confirm(); 
        setShareConfirmState(r); 
      }
      return; 
    }
    if (shareJobPending && NO.includes(norm) && confirmArmedRef.current === 'share') { 
      if (!busy) {
        confirmArmedRef.current = null;
        setShareJobPending(null);
        setAttachmentMeta(null);
        setShareConfirmState('IDLE');
        flowAiShareHandoff.clear();
        speakThen(t('flowAi.rejected'), startListening);
      }
      return; 
    }
    if (pending.length === 1 && YES.includes(norm) && confirmArmedRef.current === pending[0].id) { 
      if (!busy) {
        confirmArmedRef.current = null;
        decide(pending[0], true); 
      }
      return; 
    }
    if (pending.length === 1 && NO.includes(norm) && confirmArmedRef.current === pending[0].id) { 
      if (!busy) {
        confirmArmedRef.current = null;
        decide(pending[0], false); 
      }
      return; 
    }
    
    confirmArmedRef.current = null;
    silenceCount.current = 0;
    setInput('');
    send(text, { voice: true });
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

  latest.current = { pending, shareJobPending, busy, send, decide, attachmentMeta, input, voicePhase };
  exitVoiceChatRef.current = exitVoiceChat;
  handleVoiceFinalRef.current = handleVoiceFinal;
  handleVoiceErrorRef.current = handleVoiceError;
  handleSilenceRef.current = handleSilence;

  if (guide) {
    return <GuideBanner guide={guide} insets={insets} t={t} onAdvance={advanceGuide} onFinish={finishGuide} />;
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

        <MessageList messages={messages} busy={busy} send={send} listRef={listRef} atBottomRef={atBottomRef} t={t} />

        {messages.length === 0 && pending.length === 0 && (
          <FlowAiSuggestions cards={cards} onPrompt={cardPrompt} onNavigate={cardNavigate} onDismiss={dismissCard} />
        )}

        <PendingActions pending={pending} busy={busy} decide={decide} t={t} />

        {shareJobPending && (
          <SharePendingCard
            shareJobPending={shareJobPending}
            shareConfirmState={shareConfirmState}
            busy={busy}
            onConfirm={async () => {
              const res = await flowAiShareHandoff.confirm();
              setShareConfirmState(res);
            }}
            onCancel={() => {
              setShareJobPending(null);
              flowAiShareHandoff.clear();
              setAttachmentMeta(null);
              setShareConfirmState('IDLE');
            }}
            t={t}
          />
        )}

        {platformPick && (
          <PlatformPickCard
            platformPick={platformPick}
            pickSel={pickSel}
            onToggle={(platform) => setPickSel(s => ({ ...s, [platform]: !s[platform] }))}
            onContinue={() => {
              const names = Object.keys(pickSel).filter((k) => pickSel[k]);
              setPlatformPick(null);
              send(`${t('flowAi.share.pickedPrefix')}: ${names.join(', ')}`);
            }}
            onCancel={() => setPlatformPick(null)}
            t={t}
          />
        )}

        {attachmentMeta && (
          <AttachmentChip attachmentMeta={attachmentMeta} onRemove={() => { setAttachmentMeta(null); flowAiShareHandoff.clear(); }} />
        )}

        <Composer
          voiceChat={voiceChat}
          voicePhase={voicePhase}
          input={input}
          setInput={setInput}
          busy={busy}
          send={send}
          handleAttach={handleAttach}
          enterVoiceChat={enterVoiceChat}
          onEndVoice={() => exitVoiceChatRef.current?.('bitir-dugmesi')}
          t={t}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
