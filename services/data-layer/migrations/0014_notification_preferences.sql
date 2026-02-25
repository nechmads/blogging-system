-- Per-user notification preference flags.
-- One row per user, created on first access (INSERT OR IGNORE pattern).
-- All flags default to enabled (1) so new users receive all notifications.

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id        TEXT PRIMARY KEY NOT NULL,
  new_ideas      INTEGER NOT NULL DEFAULT 1,
  draft_ready    INTEGER NOT NULL DEFAULT 1,
  post_published INTEGER NOT NULL DEFAULT 1,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);
