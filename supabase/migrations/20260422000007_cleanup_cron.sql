create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'industropoly-rooms-cleanup',
  '0 3 * * *',
  $$
  update public.rooms
    set status = 'abandoned'
    where status in ('lobby','in_game')
      and last_activity_at < now() - interval '7 days';

  delete from public.rooms
    where status in ('abandoned','finished')
      and last_activity_at < now() - interval '14 days';
  $$
);
