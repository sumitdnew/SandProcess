# Inventory and Settings Database Setup

## Overview

This document describes the inventory and settings tables added to the Sand Process Management System database.

## Setup Instructions

1. **Run the schema file**:
   ```sql
   -- In Supabase SQL Editor, run:
   schema_inventory_and_settings.sql
   ```

2. **Run the seed data file**:
   ```sql
   -- In Supabase SQL Editor, run:
   seed_inventory_and_settings.sql
   ```

## Tables

### Inventory Table

Stores product inventory by location.

**Columns:**
- `id` - UUID primary key
- `product_id` - Foreign key to products table
- `location` - Location name (e.g., "Cantera Principal", "Buffer Zone A")
- `quantity` - Total quantity in tons (DECIMAL)
- `reserved` - Reserved quantity (calculated from orders) - Not stored, calculated dynamically
- `available` - Available quantity (calculated) - Not stored, calculated as quantity - reserved

**Unique Constraint:** `(product_id, location)` - ensures one record per product per location

### Settings Table

Stores application configuration values.

**Columns:**
- `id` - UUID primary key
- `key` - Setting key (unique, e.g., "production_capacity")
- `value` - JSONB value (can store any JSON structure)
- `description` - Human-readable description
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Predefined Settings:**
- `production_capacity` - Production capacity percentage (default: 75)
- `default_purity_min` - Default minimum purity for QC (default: 95%)
- `default_roundness_min` - Default minimum roundness (default: 0.8)
- `default_moisture_max` - Default maximum moisture (default: 1.0%)
- `company_*` - Various company information for PDFs

## API Usage

### Inventory API

```typescript
import { inventoryApi } from '../services/api';

// Get all inventory
const inventory = await inventoryApi.getAll();

// Get inventory by location
const locationInventory = await inventoryApi.getByLocation('Cantera Principal');

// Update inventory quantity
await inventoryApi.update(inventoryId, newQuantity);
```

### Settings API

```typescript
import { settingsApi } from '../services/api';

// Get all settings
const settings = await settingsApi.getAll();

// Get setting by key
const capacity = await settingsApi.getByKey('production_capacity');

// Get setting value (with default)
const capacityValue = await settingsApi.getValue<{value: number}>(
  'production_capacity', 
  {value: 75}
);

// Update setting
await settingsApi.update('production_capacity', {value: 80});
```

## Notes

- **Reserved quantities** are calculated dynamically from pending/confirmed/ready orders
- **Available quantities** are calculated as `quantity - reserved`
- Inventory API automatically calculates reserved quantities when fetching data
- Settings values are stored as JSONB, allowing flexible data structures

