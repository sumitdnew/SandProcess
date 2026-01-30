# Inventory & produce-to-inventory

Stock levels and "Produce to inventory" rely on:

1. **`schema_inventory_and_lots.sql`**  
   Run this in the Supabase SQL Editor (after the main `schema.sql`). It creates:
   - `inventory_balance` (site_id, product_id, quantity)
   - `qc_tests.quantity` and `qc_tests.site_id` for produce-to-inventory lots

2. **Flow**
   - **Produce to inventory** (Production page): creates a QC test (lot, product, quantity, site). Inventory does **not** increase yet.
   - **Quality page**: run the test and **approve** it. Only then is the quantity added to `inventory_balance`.
   - **Inventory** (Inventory Manager, Dispatcher): reads from `inventory_balance`.

If inventory never shows up:
- Ensure `schema_inventory_and_lots.sql` has been run.
- Produce to inventory → go to Quality → run test → **approve**. Stock updates only after approval.
