-- RLS for redirect_requests: allow all operations so dispatchers, jefatura, and operations managers can create/read/update.
-- Run after schema_redirect_requests.sql (and schema_redirect_requests_2level.sql). Safe to re-run.

ALTER TABLE redirect_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on redirect_requests" ON redirect_requests;
CREATE POLICY "Allow all operations on redirect_requests"
  ON redirect_requests FOR ALL
  USING (true)
  WITH CHECK (true);
