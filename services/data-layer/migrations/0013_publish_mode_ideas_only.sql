-- Rename old 'draft' auto-publish mode to 'ideas-only'.
-- Previously 'draft' only gathered ideas without writing.
-- The new 'draft' mode will auto-write drafts (but not publish).
UPDATE publications SET auto_publish_mode = 'ideas-only' WHERE auto_publish_mode = 'draft';
