begin;

select plan(8);

select set_config('veyra.user_a', gen_random_uuid()::text, false);
select set_config('veyra.user_b', gen_random_uuid()::text, false);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  (current_setting('veyra.user_a')::uuid, 'authenticated', 'authenticated',
   'veyra-a@example.test', 'not-used', now()),
  (current_setting('veyra.user_b')::uuid, 'authenticated', 'authenticated',
   'veyra-b@example.test', 'not-used', now());

select set_config('request.jwt.claim.sub', current_setting('veyra.user_a'), true);
set local role authenticated;

insert into public.user_library_snapshots (user_id, payload)
values (current_setting('veyra.user_a')::uuid, '{"owner":"a"}'::jsonb);

select ok(true, 'user A can insert an owned snapshot');

select is(
  (select payload->>'owner' from public.user_library_snapshots
   where user_id = current_setting('veyra.user_a')::uuid),
  'a',
  'user A can read the owned snapshot'
);

select set_config('request.jwt.claim.sub', current_setting('veyra.user_b'), true);

select is(
  (select count(*)::integer from public.user_library_snapshots
   where user_id = current_setting('veyra.user_a')::uuid),
  0,
  'user B cannot read user A snapshot'
);

select lives_ok(
  $$ update public.user_library_snapshots
     set payload = '{"owner":"b"}'::jsonb
     where user_id = current_setting('veyra.user_a')::uuid $$,
  'user B cannot update user A snapshot'
);

select lives_ok(
  $$ delete from public.user_library_snapshots
     where user_id = current_setting('veyra.user_a')::uuid $$,
  'user B cannot delete user A snapshot'
);

select set_config('request.jwt.claim.sub', current_setting('veyra.user_a'), true);

select lives_ok(
  $$ update public.user_library_snapshots
     set payload = '{"owner":"a-updated"}'::jsonb
     where user_id = current_setting('veyra.user_a')::uuid $$,
  'user A can update the owned snapshot'
);

select is(
  (select payload->>'owner' from public.user_library_snapshots
   where user_id = current_setting('veyra.user_a')::uuid),
  'a-updated',
  'user A sees the persisted update'
);

select ok(
  (select auth.uid() = current_setting('veyra.user_a')::uuid),
  'auth.uid resolves to the session subject'
);

select * from finish();

rollback;
