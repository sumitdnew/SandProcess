-- Seed Data for Inventory and Settings
-- Run this in your Supabase SQL Editor after running schema_inventory_and_settings.sql and seed_data.sql

-- Insert Inventory Data
-- Using product IDs from seed_data.sql
INSERT INTO inventory (product_id, location, quantity) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Cantera Principal', 1250.0), -- Frac Sand 30/50
('660e8400-e29b-41d4-a716-446655440002', 'Cantera Principal', 1100.0), -- Frac Sand 40/70
('660e8400-e29b-41d4-a716-446655440001', 'Buffer Zone A', 800.0),
('660e8400-e29b-41d4-a716-446655440002', 'Buffer Zone A', 750.0)
ON CONFLICT (product_id, location) DO NOTHING;

-- Insert Settings/Configuration
INSERT INTO settings (key, value, description) VALUES
('production_capacity', '{"value": 75, "unit": "percent"}'::jsonb, 'Current production capacity percentage'),
('default_purity_min', '{"value": 95, "unit": "percent"}'::jsonb, 'Default minimum purity requirement for QC tests'),
('default_roundness_min', '{"value": 0.8, "unit": "ratio"}'::jsonb, 'Default minimum roundness requirement for QC tests'),
('default_moisture_max', '{"value": 1.0, "unit": "percent"}'::jsonb, 'Default maximum moisture content for QC tests'),
('company_name', '{"value": "Sand Process Management Co."}'::jsonb, 'Company name for documents'),
('company_address', '{"value": "Vaca Muerta Industrial Park, Neuquén, Argentina"}'::jsonb, 'Company address'),
('company_phone', '{"value": "+54 299 XXX-XXXX"}'::jsonb, 'Company phone number'),
('company_email_orders', '{"value": "orders@sandprocess.com.ar"}'::jsonb, 'Company email for orders'),
('company_email_quality', '{"value": "quality@sandprocess.com.ar"}'::jsonb, 'Company email for quality'),
('company_tax_id', '{"value": "CUIT: 30-XXXXXXXX-X"}'::jsonb, 'Company tax ID (CUIT)'),
('company_website', '{"value": "www.sandprocess.com.ar"}'::jsonb, 'Company website'),
('company_legal_name', '{"value": "Sand Process Management Company S.A."}'::jsonb, 'Company legal name'),
('company_representative', '{"value": "Juan Carlos Pérez"}'::jsonb, 'Company representative name'),
('company_representative_title', '{"value": "General Manager"}'::jsonb, 'Company representative title')
ON CONFLICT (key) DO NOTHING;

-- Verify data was inserted
SELECT 'Inventory' as table_name, COUNT(*) as count FROM inventory
UNION ALL
SELECT 'Settings', COUNT(*) FROM settings;

