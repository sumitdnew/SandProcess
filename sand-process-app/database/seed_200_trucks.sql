-- Add 200 trucks and 200 drivers for multi-truck fulfillment testing
-- Run in Supabase SQL Editor. Safe to run multiple times (uses ON CONFLICT).
-- Trucks: TRK-0001 .. TRK-0200, 50–120 t. Drivers: DVR-0001 .. DVR-0200.

-- Drivers first (trucks reference drivers)
INSERT INTO drivers (name, license_number, phone, hours_worked, hours_limit, available)
SELECT
  'Driver ' || LPAD(s::text, 4, '0'),
  'DVR-' || LPAD(s::text, 4, '0'),
  '+54 9 11 ' || LPAD((1000 + s)::text, 4, '0') || '-0000',
  5.0 * ((s - 1) % 9),
  48.0,
  true
FROM generate_series(1, 200) AS s
ON CONFLICT (license_number) DO UPDATE SET
  name = EXCLUDED.name,
  available = true,
  updated_at = NOW();

-- Trucks
INSERT INTO trucks (license_plate, capacity, type, status, driver_id)
SELECT
  'TRK-' || LPAD(s::text, 4, '0'),
  50 + ((s - 1) % 15) * 5,
  CASE WHEN s % 3 = 0 THEN 'old' ELSE 'new' END,
  'available',
  NULL
FROM generate_series(1, 200) AS s
ON CONFLICT (license_plate) DO UPDATE SET
  status = 'available',
  capacity = EXCLUDED.capacity,
  type = EXCLUDED.type,
  assigned_order_id = NULL,
  driver_id = NULL,
  updated_at = NOW();

SELECT 'Trucks' AS resource, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'available') AS available FROM trucks
UNION ALL
SELECT 'Drivers', COUNT(*), COUNT(*) FILTER (WHERE available) FROM drivers;
