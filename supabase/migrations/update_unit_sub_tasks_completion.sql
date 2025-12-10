alter table if exists public.unit_sub_tasks
  add column if not exists completion_kind text,
  add column if not exists completion_label text,
  add column if not exists completion_options jsonb not null default '[]'::jsonb;

alter table if exists public.unit_sub_tasks enable row level security;

create policy if not exists unit_sub_tasks_select_authenticated
  on public.unit_sub_tasks
  for select
  to authenticated
  using (true);

create policy if not exists unit_sub_tasks_insert_authenticated
  on public.unit_sub_tasks
  for insert
  to authenticated
  with check (true);

create policy if not exists unit_sub_tasks_update_authenticated
  on public.unit_sub_tasks
  for update
  to authenticated
  using (true)
  with check (true);

create policy if not exists unit_sub_tasks_delete_authenticated
  on public.unit_sub_tasks
  for delete
  to authenticated
  using (true);
