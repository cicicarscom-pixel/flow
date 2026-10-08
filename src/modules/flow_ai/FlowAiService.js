import { supabase } from '../../shared';

// flow-ai-agent (verify_jwt açık). Kimlik JWT'den çözülür; istemci org/kullanıcı kimliği GÖNDERMEZ.
async function call(body) {
  const { data, error } = await supabase.functions.invoke('flow-ai-agent', { body });
  if (error) {
    let detail = null;
    try { detail = await error.context?.json?.(); } catch (_) { /* gövde okunamadı */ }
    const code = detail?.error || 'NETWORK_ERROR';
    const e = new Error(code);
    e.code = code;
    e.limit = detail?.limit;
    throw e;
  }
  return data;
}

export const FlowAiService = {
  /** @returns {{conversationId:string, reply:string, pendingActions:Array, clientActions:Array, remainingToday:number}} */
  chat: (message, conversationId, attachment, opts) => call({ action: 'chat', message, conversationId: conversationId || undefined, attachment: attachment || undefined, voice: opts?.voice === true ? true : undefined }),
  approve: (actionId, payloadHash) => call({ action: 'approve', actionId, payloadHash }),
  reject: (actionId) => call({ action: 'reject', actionId }),
  /** FA6: salt-okunur proaktif öneri kartları. @returns {{cards:Array<{id:string,kind:string,params:object,cta:object}>}} */
  suggestions: () => call({ action: 'suggestions' }),
};
