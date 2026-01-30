-- Two-level approval for redirects: Jefatura (level 1) -> Gerencia (level 2)
-- Run after schema_redirect_requests.sql. Safe to run if columns already exist.

-- Drop existing check constraint (name may vary by PostgreSQL version)
ALTER TABLE redirect_requests DROP CONSTRAINT IF EXISTS redirect_requests_status_check;

-- Expand status enum
ALTER TABLE redirect_requests
  ADD CONSTRAINT redirect_requests_status_check
  CHECK (status IN ('pending_jefatura', 'pending_gerencia', 'pending_approval', 'approved', 'rejected'));

-- Add level-1 (Jefatura) approval fields
ALTER TABLE redirect_requests ADD COLUMN IF NOT EXISTS approved_by_jefatura VARCHAR(255);
ALTER TABLE redirect_requests ADD COLUMN IF NOT EXISTS approved_at_jefatura TIMESTAMP WITH TIME ZONE;

-- Add level-2 (Gerencia) approval fields
ALTER TABLE redirect_requests ADD COLUMN IF NOT EXISTS approved_by_gerencia VARCHAR(255);
ALTER TABLE redirect_requests ADD COLUMN IF NOT EXISTS approved_at_gerencia TIMESTAMP WITH TIME ZONE;

-- Migrate legacy pending_approval -> pending_jefatura
UPDATE redirect_requests SET status = 'pending_jefatura' WHERE status = 'pending_approval';

-- New redirects use pending_jefatura (handled in app)
