drop policy if exists "Public read unit_sub_tasks" on public.unit_sub_tasks;
create policy "Public read unit_sub_tasks"
  on public.unit_sub_tasks
  for select
  to public
  using (true);
