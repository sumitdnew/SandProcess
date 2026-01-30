-- Inventory balance and produce-to-inventory lot tracking
-- Run in Supabase SQL Editor after main schema. Supports:
-- - Real inventory by site/product; increases when produce-to-inv QC passes.
-- - Lots (qc_tests with order_id null) store quantity + site for produce-to-inv.

-- Sites matching dispatcher/inventory: quarry, near_well (use underscore, not hyphen)
CREATE TABLE IF NOT EXISTS inventory_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id VARCHAR(50) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_balance_site_product ON inventory_balance(site_id, product_id);

ALTER TABLE inventory_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON inventory_balance FOR ALL USING (true);

-- Trigger for updated_at (run main schema first so update_updated_at_column exists)
DROP TRIGGER IF EXISTS update_inventory_balance_updated_at ON inventory_balance;
CREATE TRIGGER update_inventory_balance_updated_at
  BEFORE UPDATE ON inventory_balance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add quantity and site_id to qc_tests for produce-to-inventory lots (order_id null)
ALTER TABLE qc_tests ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2);
ALTER TABLE qc_tests ADD COLUMN IF NOT EXISTS site_id VARCHAR(50);

COMMENT ON COLUMN qc_tests.quantity IS 'Tons produced (produce-to-inv only).';
COMMENT ON COLUMN qc_tests.site_id IS 'Site: quarry | near_well (produce-to-inv only). Use near_well not near-well.';

-- Normalize legacy hyphenated site_id to underscore (run once if you had near-well)
UPDATE qc_tests SET site_id = 'near_well' WHERE site_id = 'near-well';
UPDATE inventory_balance SET site_id = 'near_well' WHERE site_id = 'near-well';
