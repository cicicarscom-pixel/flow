ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media_storage_source text DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS force_delete_at timestamptz,
  ADD COLUMN IF NOT EXISTS storage_deleted_at timestamptz;

-- Set up pg_cron job for automated media cleanup
create extension if not exists pg_cron;

-- Remove old job if exists to avoid conflicts
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'flow-cleanup-post-media-job') THEN 
    PERFORM cron.unschedule('flow-cleanup-post-media-job'); 
  END IF; 
END $$;

-- Schedule the cleanup job to run every 30 minutes
SELECT cron.schedule(
  'flow-cleanup-post-media-job',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url:='https://qybzidylewzsnmlofjul.supabase.co/functions/v1/flow-cleanup-post-media',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body:='{}'::jsonb
    )
  $$
);
