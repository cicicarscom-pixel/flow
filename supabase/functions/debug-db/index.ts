import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: social_accounts } = await supabase.from('social_accounts').select('*');
    const { data: conversations } = await supabase.from('conversations').select(`
      *,
      messages ( content, created_at )
    `);
    const { data: logs } = await supabase.from('ai_communication_logs').select('*').order('created_at', { ascending: false }).limit(5);
    const { data: bot_settings } = await supabase.from('bot_settings').select('*');
    const { data: social_accounts } = await supabase.from('social_accounts').select('*');

    return new Response(JSON.stringify({ conversations, logs, bot_settings, social_accounts }), {  
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});
