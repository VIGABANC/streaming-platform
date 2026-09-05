# Library consistency

VEYRA keeps a local library for guest use and synchronizes it to
`public.user_library_snapshots` after a signed-in Supabase session is available.

- Guest changes remain usable in `localStorage`.
- The first successful sign-in merges guest data into the account.
- Collections are unioned by media identity; the newest timestamp wins for duplicate entries.
- Profile and settings use the snapshot with the newest export timestamp.
- A browser owner marker prevents one signed-in user’s local data from being uploaded to another account.
- If Supabase is unavailable, the UI retains local data and shows a warning; it never reports a false successful sync.

The migration is versioned and protected by `auth.uid()` RLS policies. Apply
`supabase/migrations/202609050001_create_user_library_snapshots.sql` to the
target Supabase project before enabling account sync in production.
