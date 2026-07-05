-- 1. Tabloyu Oluştur
CREATE TABLE IF NOT EXISTS public.analytics_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id text NOT NULL,
    platform text NOT NULL,
    metric_type text NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Upsert (Insert or Update) işlemleri için benzersiz kısıtlama
    UNIQUE(account_id, platform, metric_type)
);

-- 2. Hızlı okuma (Read) işlemleri için Index oluştur
CREATE INDEX IF NOT EXISTS idx_analytics_cache_lookup ON public.analytics_cache(account_id, platform, metric_type);

-- 3. Edge Function üzerinden (service_role) erişileceği için RLS (Row Level Security) ayarları
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
