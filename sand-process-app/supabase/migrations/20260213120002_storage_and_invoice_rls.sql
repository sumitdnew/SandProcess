-- Fix "new row violates row-level security policy" when uploading to Storage.
-- Run in SQL Editor AFTER buckets `invoices` and `documents` exist.
-- Prototype: allows the anon/authenticated client to read/write objects in those buckets.
-- Tighten for production (e.g. auth.uid(), or server-side uploads only).

-- ---------- Storage: invoices bucket ----------
DROP POLICY IF EXISTS "invoices_objects_insert" ON storage.objects;
DROP POLICY IF EXISTS "invoices_objects_select" ON storage.objects;
DROP POLICY IF EXISTS "invoices_objects_update" ON storage.objects;
DROP POLICY IF EXISTS "invoices_objects_delete" ON storage.objects;

CREATE POLICY "invoices_objects_insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "invoices_objects_select"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "invoices_objects_update"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'invoices')
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "invoices_objects_delete"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'invoices');

-- ---------- Storage: documents bucket (pickup release uploads) ----------
DROP POLICY IF EXISTS "documents_objects_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_objects_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_objects_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_objects_delete" ON storage.objects;

CREATE POLICY "documents_objects_insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_objects_select"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "documents_objects_update"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_objects_delete"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'documents');
