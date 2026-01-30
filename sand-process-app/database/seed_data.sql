-- Sand Process Management System - Seed Data
-- Run this in your Supabase SQL Editor after running schema.sql
-- This will populate all tables with sample data for testing

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE invoices, qc_tests, deliveries, order_items, orders, trucks, drivers, msas, products, customers CASCADE;

-- Insert Customers
INSERT INTO customers (id, name, code, contact_person, email, phone, address, active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'YPF', 'YPF-001', 'Roberto Silva', 'roberto.silva@ypf.com', '+54 11 1234-5678', 'Vaca Muerta, Neuquén, Argentina', true),
('550e8400-e29b-41d4-a716-446655440002', 'Vista Energy', 'VISTA-001', 'Patricia López', 'patricia.lopez@vistaenergy.com', '+54 11 2345-6789', 'Vaca Muerta, Neuquén, Argentina', true),
('550e8400-e29b-41d4-a716-446655440003', 'Shell Argentina', 'SHELL-001', 'Fernando García', 'fernando.garcia@shell.com', '+54 11 3456-7890', 'Vaca Muerta, Neuquén, Argentina', true)
ON CONFLICT (code) DO NOTHING;

-- Insert Products
INSERT INTO products (id, name, mesh_size, description) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Frac Sand 30/50', '30/50', 'High quality frac sand, mesh size 30/50'),
('660e8400-e29b-41d4-a716-446655440002', 'Frac Sand 40/70', '40/70', 'High quality frac sand, mesh size 40/70')
ON CONFLICT DO NOTHING;

-- Insert MSAs (Master Service Agreements)
INSERT INTO msas (id, customer_id, start_date, end_date, pricing, payment_terms, volume_commitment, active) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2026-01-01', '2026-12-31', 
 '{"660e8400-e29b-41d4-a716-446655440001": 95, "660e8400-e29b-41d4-a716-446655440002": 100}'::jsonb, 
 'Net 30', 500, true),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2026-01-01', '2026-12-31', 
 '{"660e8400-e29b-41d4-a716-446655440001": 90, "660e8400-e29b-41d4-a716-446655440002": 95}'::jsonb, 
 'Net 30', 300, true)
ON CONFLICT DO NOTHING;

-- Insert Drivers
INSERT INTO drivers (id, name, license_number, phone, hours_worked, hours_limit, available) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Pedro Sánchez', 'DL-12345', '+54 9 11 1111-1111', 35.0, 48.0, true),
('880e8400-e29b-41d4-a716-446655440002', 'José Martínez', 'DL-23456', '+54 9 11 2222-2222', 42.0, 48.0, true),
('880e8400-e29b-41d4-a716-446655440003', 'Miguel Torres', 'DL-34567', '+54 9 11 3333-3333', 48.0, 48.0, false),
('880e8400-e29b-41d4-a716-446655440004', 'Ricardo López', 'DL-45678', '+54 9 11 4444-4444', 30.0, 48.0, true),
('880e8400-e29b-41d4-a716-446655440005', 'Carlos Fernández', 'DL-56789', '+54 9 11 5555-5555', 25.0, 48.0, true)
ON CONFLICT (license_number) DO NOTHING;

-- Insert Trucks (include at least one ≥75 tons for 75-ton orders)
INSERT INTO trucks (id, license_plate, capacity, type, status, driver_id) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'ABC-123', 25, 'old', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440002', 'DEF-456', 26, 'old', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440003', 'GHI-789', 50, 'new', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440004', 'JKL-012', 55, 'new', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440005', 'MNO-345', 52, 'new', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440006', 'PQR-678', 50, 'new', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440007', 'STU-901', 25, 'old', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440008', 'VWX-234', 54, 'new', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440009', 'YZA-567', 51, 'new', 'maintenance', NULL),
('990e8400-e29b-41d4-a716-446655440010', 'BCD-890', 26, 'old', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440011', 'HLG-080', 80, 'new', 'available', NULL),
('990e8400-e29b-41d4-a716-446655440012', 'HLG-100', 100, 'new', 'available', NULL)
ON CONFLICT (license_plate) DO NOTHING;

-- Insert Sample Orders (optional - for testing)
INSERT INTO orders (id, order_number, customer_id, msa_id, delivery_date, delivery_location, delivery_address, status, total_amount, notes) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'ORD-2026-0001', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 
 '2026-01-20', 'Pozo YPF-45', 'Vaca Muerta, Neuquén, Argentina', 'pending', 4750.00, 'First order for testing'),
('aa0e8400-e29b-41d4-a716-446655440002', 'ORD-2026-0002', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 
 '2026-01-21', 'Pozo YPF-52', 'Vaca Muerta, Neuquén, Argentina', 'confirmed', 7125.00, NULL),
('aa0e8400-e29b-41d4-a716-446655440003', 'ORD-2026-0003', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 
 '2026-01-22', 'Pozo Vista-12', 'Vaca Muerta, Neuquén, Argentina', 'pending', 2850.00, NULL)
ON CONFLICT (order_number) DO NOTHING;

-- Insert Order Items for the sample orders
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 50.0, 95.00),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 75.0, 95.00),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 30.0, 95.00)
ON CONFLICT DO NOTHING;

-- Insert Sample QC Tests (optional)
INSERT INTO qc_tests (id, lot_number, order_id, product_id, status) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'LOT-2026-001', 'aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'pending'),
('bb0e8400-e29b-41d4-a716-446655440002', 'LOT-2026-002', 'aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'pending'),
('bb0e8400-e29b-41d4-a716-446655440003', 'LOT-2026-003', NULL, '660e8400-e29b-41d4-a716-446655440002', 'pending')
ON CONFLICT (lot_number) DO NOTHING;

-- Verify data was inserted
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'MSAs', COUNT(*) FROM msas
UNION ALL
SELECT 'Drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'Trucks', COUNT(*) FROM trucks
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'QC Tests', COUNT(*) FROM qc_tests;


