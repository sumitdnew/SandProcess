-- Pickup fulfillment, pickup release records, invoice PDF storage path
-- Run in Supabase SQL Editor (or supabase db push).
-- After this migration: create Storage bucket "invoices" (private) in Dashboard if not auto-created.
-- See supabase/README_STORAGE.md for optional storage policies.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_fulfillment_type_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_fulfillment_type_check
      CHECK (fulfillment_type IN ('delivery', 'pickup'));
  END IF;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_location text,
  ADD COLUMN IF NOT EXISTS pickup_address text,
  ADD COLUMN IF NOT EXISTS pickup_window_start timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_window_end timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_instructions text,
  ADD COLUMN IF NOT EXISTS order_weight_tons numeric;

CREATE TABLE IF NOT EXISTS public.pickup_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  empty_weight_tons numeric NOT NULL,
  loaded_weight_tons numeric NOT NULL,
  driver_name text NOT NULL,
  driver_license_number text,
  driver_id_document text,
  truck_id uuid REFERENCES public.trucks(id),
  vehicle_plate text,
  released_at timestamptz NOT NULL DEFAULT now(),
  released_by_user_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pickup_releases_one_per_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_pickup_releases_order_id ON public.pickup_releases(order_id);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_pdf_storage_path text;
