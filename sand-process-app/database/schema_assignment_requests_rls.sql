-- RLS for assignment_requests: allow all so dispatcher can create, OM can read/update.
-- Run after schema_assignment_requests.sql. Safe to re-run.

ALTER TABLE assignment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on assignment_requests" ON assignment_requests;
CREATE POLICY "Allow all operations on assignment_requests"
  ON assignment_requests FOR ALL
  USING (true)
  WITH CHECK (true);
