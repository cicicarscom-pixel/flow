// Ekranlar ile Flow AI rehber modu arasındaki hafif olay yolu. Dinleyici yoksa olaylar sessizce düşer.
const eventListeners = new Set();
const guideListeners = new Set();

export function emitFlowEvent(name, payload) {
  eventListeners.forEach((fn) => {
    try { fn(name, payload); } catch (e) { console.warn('[FlowAI] olay dinleyici hatası:', e?.message); }
  });
}
export function subscribeFlowEvents(listener) {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

export function requestGuideStart(guideKey) {
  guideListeners.forEach((fn) => fn(guideKey));
  return guideListeners.size > 0;
}
export function subscribeGuideStart(listener) {
  guideListeners.add(listener);
  return () => guideListeners.delete(listener);
}
