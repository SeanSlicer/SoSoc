-- One-time database setup for Supabase-specific features.
-- Run via: yarn db:setup
--
-- This is separate from Prisma migrations because these are Supabase
-- platform settings (Realtime publication), not schema changes.

-- Enable Realtime for messages and notifications so clients receive
-- live INSERT events instead of polling.
-- IF EXISTS guards make this idempotent — safe to run multiple times.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
