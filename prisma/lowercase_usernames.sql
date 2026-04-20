-- One-time migration: populate username_normalized for all existing users.
-- Run this in the Supabase SQL editor after deploying the case-insensitive username changes.

UPDATE users SET username_normalized = LOWER(username) WHERE username_normalized IS NULL;
