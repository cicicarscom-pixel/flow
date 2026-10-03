// Flow AI eylem dağıtıcısı. Sunucu (flow-ai-agent) yalnız izin listesindeki anahtarları gönderir; burada İKİNCİ kez,
// istemcinin kendi izin listesiyle doğrulanır. Bilinmeyen eylem/ekran/hedef sessizce yok sayılır.

// screen anahtarı → react-navigation hedefi (core/navigation: AppNavigator kök yığın, TabNavigator sekmeler)
const SCREEN_TARGETS = {
  anasayfa: ['MainTabs', { screen: 'Anasayfa' }],
  randevu: ['MainTabs', { screen: 'Ai Asistan', params: { screen: 'RandevuMain' } }],
  musteriler: ['MainTabs', { screen: 'Ai Asistan', params: { screen: 'Musteriler' } }],
  hizmet_ayarlari: ['MainTabs', { screen: 'Ai Asistan', params: { screen: 'HizmetAyarlari' } }],
  bot_yonetimi: ['MainTabs', { screen: 'Ai Asistan', params: { screen: 'BotYonetimiMain' } }],
  sosyal_medya: ['MainTabs', { screen: 'Sosyal Medya' }],
  analiz: ['MainTabs', { screen: 'Analiz' }],
  ai_muhasebe: ['MainTabs', { screen: 'Ai Muhasebe', params: { screen: 'AiMuhasebeMain' } }],
  muhasebecim: ['MainTabs', { screen: 'Ai Muhasebe', params: { screen: 'Muhasebecim' } }],
  ai_uretim: ['AiUretim'],
  odeme_takvimi: ['OdemeTakvimi'],
  isletmem: ['Isletmem'],
  bildirimler: ['Bildirimler'],
  profil: ['Profil'],
  mesajlar: ['Inbox', { screen: 'Mesajlar' }],
  yorumlar: ['Inbox', { screen: 'Yorumlar' }],
};

// Vurgulanabilir öğeler (testID'ler FA2-2'de eklenir). Sunucudaki FLOW_HIGHLIGHT_TARGETS ile aynı olmalı.
const HIGHLIGHT_TARGETS = {
  ai_uretim: ['media_picker', 'platform_selector', 'caption_input', 'share_button'],
};

const highlightListeners = new Set();

/** FA2-2: ekranlar vurgu olaylarına buradan abone olur. Abone yoksa vurgu sessizce düşer. */
export function subscribeHighlight(listener) {
  highlightListeners.add(listener);
  return () => highlightListeners.delete(listener);
}

/** @returns {boolean} eylem uygulandıysa true */
export function dispatchClientAction(action, navigationRef) {
  if (!action || typeof action !== 'object') return false;

  if (action.type === 'navigate') {
    const target = Object.prototype.hasOwnProperty.call(SCREEN_TARGETS, action.screen) ? SCREEN_TARGETS[action.screen] : null;
    if (!target || !navigationRef?.isReady?.()) return false;
    try {
      navigationRef.navigate(...target);
      return true;
    } catch (e) {
      console.warn('[FlowAI] navigate hatası:', e?.message);
      return false;
    }
  }

  if (action.type === 'highlight') {
    const allowed = Object.prototype.hasOwnProperty.call(HIGHLIGHT_TARGETS, action.screen) ? HIGHLIGHT_TARGETS[action.screen] : null;
    if (!allowed || !allowed.includes(action.targetId)) return false;
    highlightListeners.forEach((fn) => {
      try { fn({ screen: action.screen, targetId: action.targetId }); } catch (e) { console.warn('[FlowAI] highlight dinleyici hatası:', e?.message); }
    });
    return highlightListeners.size > 0;
  }

  return false;
}

export const __testing = { SCREEN_TARGETS, HIGHLIGHT_TARGETS };
