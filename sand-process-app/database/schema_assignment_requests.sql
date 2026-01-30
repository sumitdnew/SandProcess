-- Assignment requests (dispatcher submits, ops approves)
-- Run in Supabase SQL Editor after main schema

CREATE TABLE IF NOT EXISTS assignment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(255) NOT NULL,
  source_label VARCHAR(255),
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  truck_label VARCHAR(255),
  reason TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  requested_by VARCHAR(255) NOT NULL,
  requested_by_name VARCHAR(255),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_requests_status ON assignment_requests(status);
CREATE INDEX IF NOT EXISTS idx_assignment_requests_order_id ON assignment_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_assignment_requests_requested_at ON assignment_requests(requested_at DESC);
