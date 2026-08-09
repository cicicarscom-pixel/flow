import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../shared/lib/supabase';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data, fetchError } = await supabase
        .from('ai_communication_logs')
        .select('*')
        .eq('merchant_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setLogs(data || []);
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

      const { error: deleteError } = await supabase
        .from('ai_communication_logs')
        .delete()
        .eq('merchant_id', session.user.id);

      if (deleteError) throw deleteError;
      setLogs([]);
    } catch (err) {
      console.error('Error clearing communication logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs, clearLogs };
}
