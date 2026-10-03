// Rehber modu: adım adım "birlikte yapalım". Her adım bir öğeyi vurgular ve ilgili olay gelince bir sonrakine geçer.
// Öğe kimlikleri (target) ekranlardaki <FlowHighlight id=...> ile ve sunucudaki FLOW_HIGHLIGHT_TARGETS ile aynıdır.
export const FLOW_GUIDES = {
  ai_uretim_paylasim: {
    screen: 'ai_uretim',
    steps: [
      { target: 'media_picker', event: 'media_selected', textKey: 'flowAi.guide.media' },
      { target: 'platform_selector', event: 'platforms_selected', textKey: 'flowAi.guide.platform' },
      { target: 'caption_input', event: 'caption_ready', textKey: 'flowAi.guide.caption' },
      { target: 'share_button', event: null, textKey: 'flowAi.guide.share' },
    ],
  },
};
