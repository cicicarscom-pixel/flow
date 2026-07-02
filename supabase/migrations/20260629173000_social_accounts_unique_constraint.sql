-- Migration: social_accounts tablosuna UNIQUE constraint ekle
-- Hata: 42P10 "no unique or exclusion constraint" — upsert(onConflict: 'zernio_account_id') başarısız oluyordu
-- Düzeltme: Önce duplicate kayıtları temizle, sonra constraint ekle

-- 1. Duplicate zernio_account_id kayıtlarını temizle (en son eklenenler korunur)
DELETE FROM public.social_accounts
WHERE id NOT IN (
  SELECT DISTINCT ON (zernio_account_id) id
  FROM public.social_accounts
  WHERE zernio_account_id IS NOT NULL
  ORDER BY zernio_account_id, id DESC
);

-- 2. UNIQUE constraint ekle
ALTER TABLE public.social_accounts
  ADD CONSTRAINT social_accounts_zernio_account_id_key
  UNIQUE (zernio_account_id);

-- Not: Bu migration'dan sonra zernio-client'taki upsert artık doğru çalışır.
