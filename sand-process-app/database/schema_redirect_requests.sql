-- Redirect requests (dispatcher submits, ops approves; truck moved from order A to urgent order B)
-- Run in Supabase SQL Editor after main schema

CREATE TABLE IF NOT EXISTS redirect_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_order_number VARCHAR(50),
  to_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  to_order_number VARCHAR(50),
  truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  truck_label VARCHAR(255),
  reason TEXT,
  impact_on_original_order TEXT,
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

CREATE INDEX IF NOT EXISTS idx_redirect_requests_status ON redirect_requests(status);
CREATE INDEX IF NOT EXISTS idx_redirect_requests_requested_at ON redirect_requests(requested_at DESC);
