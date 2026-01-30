-- Prototype seed: ensure trucks and drivers are available for dispatcher assignment testing
-- Run this in Supabase SQL Editor when you need "trucks available" for the prototype.
-- Safe to run multiple times.

-- 1. Insert extra trucks if missing (including one ≥75 tons for large orders)
INSERT INTO trucks (id, license_plate, capacity, type, status, driver_id) VALUES
('990e8400-e29b-41d4-a716-446655440011', 'HLG-080', 80, 'new', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440012', 'HLG-100', 100, 'new', 'available', NULL)
ON CONFLICT (license_plate) DO UPDATE SET
  status = 'available',
  capacity = EXCLUDED.capacity,
  assigned_order_id = NULL,
  driver_id = NULL,
  updated_at = NOW();

-- 2. Reset all trucks to available (so we have trucks to assign)
UPDATE trucks
SET status = 'available', assigned_order_id = NULL, driver_id = NULL, updated_at = NOW()
WHERE status IN ('assigned', 'in_transit', 'loading', 'delivering', 'returning', 'broken_down', 'stuck');

-- Keep maintenance trucks as-is (don't use for dispatch)
-- UPDATE trucks SET status = 'maintenance' WHERE license_plate = 'YZA-567';

-- 3. Ensure all drivers are available for prototype
UPDATE drivers SET available = true, updated_at = NOW();

-- 4. (Optional) Mark one QC test as passed with certificate so an order can be dispatched.
--    Uncomment and run if you get "Order must have a QC certificate before dispatch."
/*
UPDATE qc_tests
SET status = 'passed', certificate_id = 'CERT-2026-0001', updated_at = NOW()
WHERE order_id = 'aa0e8400-e29b-41d4-a716-446655440001' AND lot_number = 'LOT-2026-001';
*/

SELECT 'Trucks' AS resource, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'available') AS available FROM trucks
UNION ALL
SELECT 'Drivers', COUNT(*), COUNT(*) FILTER (WHERE available) FROM drivers;
