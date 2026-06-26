-- Add google_drive_folder_id column to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT;
