-- Use this when the admin can still log in with the old email.
--
-- Scenario:
-- 1) The admin Auth account already exists.
-- 2) You want to move it to a new email.
-- 3) `profiles` must stay in sync with `auth.users`.
--
-- Replace the placeholders below with your real values.

-- Existing admin Auth user id
-- Example: '3c1d1d8a-1111-2222-3333-444444444444'

update auth.users
set email = 'admin@gmail.com',
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where id = 'b6a0385b-2de1-4960-8799-f893110d1336';

update public.profiles
set email = 'admin@gmail.com',
    role = 'admin',
    updated_at = now()
where id = 'b6a0385b-2de1-4960-8799-f893110d1336';

-- Optional: if there is a separate old Auth user that still logs in,
-- delete it after confirming the new admin account works.
--
-- delete from auth.users
-- where email = 'mochanangardiansyah@gmail.com';