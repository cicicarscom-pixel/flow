-- Add WhatsApp configuration and quota columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_message_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_monthly_quota INTEGER DEFAULT 1000;
