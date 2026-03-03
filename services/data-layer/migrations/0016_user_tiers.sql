-- Add tier column to users table for quota enforcement
ALTER TABLE users ADD COLUMN tier TEXT NOT NULL DEFAULT 'free';
