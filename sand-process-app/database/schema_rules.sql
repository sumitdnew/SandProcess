-- Recommendation rules (no-code config, used by dispatcher recommendations)
-- Run in Supabase SQL Editor after main schema

CREATE TABLE IF NOT EXISTS recommendation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_rules_active ON recommendation_rules(active);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_priority ON recommendation_rules(priority);

-- condition: { "field": "order_size"|"urgency"|"customer"|"region"|"product", "op": "gt"|"gte"|"lt"|"lte"|"eq"|"in", "value": ... }
-- action: { "type": "prefer_warehouse"|"prefer_quarry"|"allow_redirect"|"max_delay_min"|"use_safety_stock_if_urgent"|"optimization", "value": ... }
