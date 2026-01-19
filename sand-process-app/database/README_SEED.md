# Database Seed Data

## Quick Start

1. **First, run the schema** (`schema.sql`) in Supabase SQL Editor
2. **Then, run the seed data** (`seed_data.sql`) to populate with sample data

## What's Included

The seed data includes:

### Customers (3)
- YPF
- Vista Energy  
- Shell Argentina

### Products (2)
- Frac Sand 30/50
- Frac Sand 40/70

### MSAs (2)
- YPF MSA (2026) - $95/ton for 30/50, $100/ton for 40/70
- Vista Energy MSA (2026) - $90/ton for 30/50, $95/ton for 40/70

### Drivers (5)
- Pedro Sánchez (Available)
- José Martínez (Available)
- Miguel Torres (Unavailable - at hours limit)
- Ricardo López (Available)
- Carlos Fernández (Available)

### Trucks (10)
- 3 old trucks (25-26 ton capacity)
- 7 new trucks (50-55 ton capacity)
- Most are available, 1 in maintenance

### Sample Orders (3)
- 2 orders for YPF
- 1 order for Vista Energy
- Various statuses (pending, confirmed)

### Sample QC Tests (3)
- Pending tests linked to orders

## Using the Data

After running the seed script, you can:

1. **Create new orders** - You'll have customers and products to choose from
2. **Assign trucks** - You'll have trucks and drivers available
3. **Test workflows** - Orders, deliveries, QC tests, etc.

## Adding More Data

You can modify `seed_data.sql` to add more:
- Customers
- Products
- Trucks
- Drivers
- Or any other data you need for testing

## Resetting Data

If you want to start fresh:

```sql
-- WARNING: This deletes ALL data!
TRUNCATE TABLE invoices, qc_tests, deliveries, order_items, orders, trucks, drivers, msas, products, customers CASCADE;
```

Then run `seed_data.sql` again.

## Notes

- All IDs use fixed UUIDs so you can reference them in your code
- The seed script uses `ON CONFLICT DO NOTHING` so it's safe to run multiple times
- Customer codes and driver license numbers are unique, so duplicates won't be inserted


