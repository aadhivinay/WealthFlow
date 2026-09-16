/*
# Add Documents Table and Storage Bucket

## Overview
Creates a `documents` table to track file metadata and a Supabase Storage bucket
named `documents` for storing uploaded files (FD receipts, agreements, PDFs, images)
for the WealthFlow Document Vault feature.

## New Tables
1. `documents` — Stores metadata for each uploaded file.
   - `id` (uuid, primary key)
   - `user_id` (uuid, defaults to auth.uid(), references auth.users)
   - `module_type` (text) — which module the doc belongs to (salary, sip, insurance, etc.)
   - `file_name` (text) — original file name
   - `file_path` (text) — path in the storage bucket
   - `file_type` (text) — MIME type
   - `file_size` (bigint) — size in bytes
   - `created_at` (timestamptz)

## Storage
- Creates a private storage bucket `documents` (10 MB file limit).
- RLS policies allow authenticated users to manage only their own files
  (path prefix: `user_id/...`).

## Security
- RLS enabled on `documents` table with owner-scoped CRUD.
- Storage policies scope by `auth.uid()` folder prefix.
*/

-- 1. documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);

-- 2. Storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies: users can only access files under their own user_id folder
DROP POLICY IF EXISTS "users_upload_own_documents" ON storage.objects;
CREATE POLICY "users_upload_own_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_read_own_documents" ON storage.objects;
CREATE POLICY "users_read_own_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_delete_own_documents" ON storage.objects;
CREATE POLICY "users_delete_own_documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own_documents" ON storage.objects;
CREATE POLICY "users_update_own_documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
