-- One-time database setup for Supabase-specific features.
-- Run via: yarn db:setup
--
-- This is separate from Prisma migrations because these are Supabase
-- platform settings (Realtime publication + RLS), not schema changes.

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

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security for Supabase Realtime
-- ─────────────────────────────────────────────────────────────────────────────
-- Requires SUPABASE_JWT_SECRET env var to be set (see src/env.js).
-- The app issues short-lived Supabase-compatible JWTs via /api/auth/realtime-token
-- which sets auth on the browser Realtime client so these policies apply.
--
-- Direct Prisma connections (postgres superuser) bypass RLS — app queries
-- are unaffected. Only Realtime broadcast filtering changes.
--
-- Safe to re-run: policies use CREATE OR REPLACE / DROP IF EXISTS guards.

-- Helper: extract user ID from our custom JWT (sub claim, text not UUID)
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )
$$;

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members can read messages" ON messages;
CREATE POLICY "members can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = public.requesting_user_id()
    )
  );

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own notifications" ON notifications;
CREATE POLICY "users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = public.requesting_user_id());
