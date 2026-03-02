-- Comments system: table, indexes, and publication/notification columns

CREATE TABLE IF NOT EXISTS comments (
  id               TEXT PRIMARY KEY NOT NULL,
  publication_id   TEXT NOT NULL,
  post_slug        TEXT NOT NULL,
  parent_id        TEXT,
  author_name      TEXT NOT NULL,
  author_email     TEXT,
  content          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'approved',
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post
  ON comments (publication_id, post_slug, status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON comments (parent_id) WHERE parent_id IS NOT NULL;

ALTER TABLE publications ADD COLUMN comments_enabled    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE publications ADD COLUMN comments_moderation TEXT    NOT NULL DEFAULT 'auto-approve';

ALTER TABLE notification_preferences ADD COLUMN new_comment INTEGER NOT NULL DEFAULT 1;
