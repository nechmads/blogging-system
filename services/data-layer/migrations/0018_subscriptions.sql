-- Subscriptions table for Paddle billing integration.
-- One row per user (created on first checkout). No row = free Creator tier.
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  paddle_customer_id TEXT NOT NULL,
  paddle_subscription_id TEXT NOT NULL UNIQUE,
  paddle_price_id TEXT,
  tier TEXT NOT NULL DEFAULT 'growth',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  canceled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Paddle webhook event deduplication table.
-- Stores event_id to ensure idempotent processing.
CREATE TABLE IF NOT EXISTS paddle_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
