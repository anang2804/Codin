-- Use this after creating the user in Supabase Auth.
-- Set the password when creating the Auth user in Supabase Dashboard.
-- Replace the placeholders with the real Auth user UUID, email, and name.
--
-- Note: password is NOT stored in public.profiles.

insert into public.profiles (id, email, full_name, role)
values (
  'PASTE_AUTH_USER_UUID_HERE',
  'admin@example.com',
  'Admin Baru',
  'admin'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = 'admin',
  updated_at = now();