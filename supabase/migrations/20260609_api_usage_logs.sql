-- Çift Çekirdek Uyumlu AI Kullanım Günlüğü Tablosu
CREATE TABLE public.api_usage_logs (
 id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
 feature TEXT NOT NULL, -- 'finance', 'whatsapp', 'social_image'
 model_name TEXT NOT NULL, -- 'gemini-2.5-flash' veya 'imagen-4.0-generate-001'
 prompt_tokens INT DEFAULT 0,
 completion_tokens INT DEFAULT 0,
 generated_image_count INT DEFAULT 0, -- Yeni: Üretilen görsel adedi
 estimated_cost_try NUMERIC(10, 4) NOT NULL, -- TL bazlı net maliyet
 created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_usage_user_monthly ON public.api_usage_logs(user_id, created_at);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Esnaflar sadece kendi harcamalarını görebilir" 
ON public.api_usage_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Esnaflar kendi harcamalarını kaydedebilir" 
ON public.api_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
