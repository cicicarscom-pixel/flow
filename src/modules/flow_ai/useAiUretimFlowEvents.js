import { useEffect, useRef } from 'react';
import { emitFlowEvent } from './flowAiEvents';

/**
 * AI Üretim ekranı akış olayları. Ekranın kendi mantığına dokunmaz; durum değişimlerini izler:
 *  media_selected      → medya yokken var olur
 *  platforms_selected  → seçili platform sayısı 0'dan büyük olur / artar
 *  caption_ready       → gönderi metni boşken dolar
 */
export function useAiUretimFlowEvents({ hasMedia, platformCount, hasCaption }) {
  const prev = useRef({ hasMedia, platformCount, hasCaption });
  useEffect(() => {
    const p = prev.current;
    if (hasMedia && !p.hasMedia) emitFlowEvent('media_selected', {});
    if (platformCount > p.platformCount && platformCount > 0) emitFlowEvent('platforms_selected', { count: platformCount });
    if (hasCaption && !p.hasCaption) emitFlowEvent('caption_ready', {});
    prev.current = { hasMedia, platformCount, hasCaption };
  }, [hasMedia, platformCount, hasCaption]);
}
