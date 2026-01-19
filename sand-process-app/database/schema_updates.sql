-- Schema Updates for Signature and Checkpoints
-- Run this in your Supabase SQL Editor after the main schema

-- Add signature and checkpoint fields to deliveries table
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS signature JSONB,
ADD COLUMN IF NOT EXISTS checkpoints JSONB,
ADD COLUMN IF NOT EXISTS gps_track JSONB,
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Signature structure: {signerName, signerTitle, timestamp, gps: {lat, lng}, photoUrl?}
-- Checkpoints structure: [{id, name, timestamp, lat, lng, autoDetected}]
-- GPS Track structure: [{lat, lng, timestamp}]


