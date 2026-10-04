import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../shared/lib/supabase';
import { getCurrentOrgId } from '../../../../lib/org';

export interface CommunicationLog {
  id: string;
  merchant_id: string;
  platform: 'whatsapp' | 'social';
  sender_id: string;
  sender_name?: string;
  user_message: string;
  ai_response: string;
  created_at: string;
}

export function useCommunicationLogs() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [platformStats, setPlatformStats] = useState<{ platform: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      const merchantId = session.user.id;
      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', merchantId).maybeSingle();
      const orgId = orgMember?.organization_id || merchantId;
      
      const { data, error: fetchError } = await supabase
        .from('ai_communication_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (fetchError) throw fetchError;
      setLogs(data || []);
      
      // Platform bazlı toplam sayaç
      const statsMap: Record<string, number> = {};
      (data || []).forEach(l => {
        const p = (l.platform || 'whatsapp').toLowerCase();
        statsMap[p] = (statsMap[p] || 0) + 1;
      });
      const { data: commentPlatforms } = await supabase.from('comments').select('platform').eq('profile_id', orgId);
      (commentPlatforms || []).forEach(c => {
        const p = (c.platform || 'diğer').toLowerCase();
        statsMap[p] = (statsMap[p] || 0) + 1;
      });
      const { data: messagePlatforms } = await supabase.from('messages').select('conversation_id, conversations(platform)').eq('profile_id', orgId);
      (messagePlatforms || []).forEach(m => {
        const p = (m.conversations?.platform || 'diğer').toLowerCase();
        statsMap[p] = (statsMap[p] || 0) + 1;
      });
      
      setPlatformStats(Object.entries(statsMap).map(([platform, count]) => ({ platform, count })).sort((a, b) => b.count - a.count));
    } catch (err: any) {
      setError(err);
      console.error('Error fetching communication logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLogs = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const orgId = await getCurrentOrgId(supabase);
      if (!orgId) return;
      const { error: deleteError } = await supabase.from('ai_communication_logs').delete().eq('org_id', orgId);
      if (deleteError) throw deleteError;
      setLogs([]);
      setPlatformStats([]);
    } catch (err) {
      console.error('Error clearing communication logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, platformStats, loading, error, refetch: fetchLogs, clearLogs };
}
