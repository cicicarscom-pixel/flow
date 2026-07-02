-- Add bot toggles to bot_settings
ALTER TABLE bot_settings ADD COLUMN IF NOT EXISTS whatsapp_bot_active BOOLEAN DEFAULT true;
ALTER TABLE bot_settings ADD COLUMN IF NOT EXISTS social_bot_active BOOLEAN DEFAULT true;

-- Create ai_communication_logs table
CREATE TABLE IF NOT EXISTS public.ai_communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'whatsapp' | 'social'
    sender_id TEXT NOT NULL,
    user_message TEXT,
    ai_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ai_communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own communication logs" ON public.ai_communication_logs FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Users can insert their own communication logs" ON public.ai_communication_logs FOR INSERT WITH CHECK (auth.uid() = merchant_id);
