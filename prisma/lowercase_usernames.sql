-- One-time migration: normalize all existing usernames to lowercase.
-- Run this in the Supabase SQL editor before deploying the case-insensitive username changes.
--
-- If two users somehow have the same username with different casing (e.g. "Alice" and "alice"),
-- the UPDATE will fail on the unique constraint. Uncomment the check below to detect that first.

-- Optional conflict check (returns any rows that would collide):
-- SELECT LOWER(username), COUNT(*) FROM "User" GROUP BY LOWER(username) HAVING COUNT(*) > 1;

UPDATE "User" SET username = LOWER(username) WHERE username != LOWER(username);
