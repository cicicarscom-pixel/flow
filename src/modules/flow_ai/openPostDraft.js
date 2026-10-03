import { supabase } from '../../shared';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Flow AI'ın hazırladığı gönderi taslağını (flow_ai_post_drafts) AI Üretim ekranında açar.
 * Okuma kullanıcının JWT'siyle yapılır (RLS: yalnız kendi taslağı). Taslak YAYINLANMAZ; paylaşımı kullanıcı kendisi yapar.
 */
export async function openPostDraft(draftId, navigationRef) {
  if (typeof draftId !== 'string' || !UUID_RE.test(draftId) || !navigationRef?.isReady?.()) return false;
  try {
    const { data, error } = await supabase
      .from('flow_ai_post_drafts')
      .select('caption, platforms, status, expires_at')
      .eq('id', draftId)
      .maybeSingle();
    if (error || !data || data.status !== 'draft' || new Date(data.expires_at) <= new Date()) return false;
    navigationRef.navigate('AiUretim', { selectedText: data.caption, draftPlatforms: data.platforms || [], draftId });
    return true;
  } catch (e) {
    console.warn('[FlowAI] taslak açılamadı:', e?.message);
    return false;
  }
}
