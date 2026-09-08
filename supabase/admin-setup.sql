-- Run this once in Supabase SQL Editor after the account has confirmed its email.
-- Replace the email before running; do not commit personal emails to this public repository.
update public.users u
set role='admin', username='kyryl_admin'
from auth.users a
where u.id=a.id and lower(a.email)=lower('ADMIN_EMAIL_HERE');

-- Verify without exposing credentials:
select u.username,u.role from public.users u where u.role='admin';
