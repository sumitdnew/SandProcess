-- Optional scanned docs (DNI, license, etc.) for pickup gate release — paths in Storage bucket `documents`
ALTER TABLE public.pickup_releases
  ADD COLUMN IF NOT EXISTS document_storage_paths jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.pickup_releases.document_storage_paths IS
  'JSON: { "dni"?: string, "driverLicense"?: string, "other"?: string[] } — paths in bucket documents';
