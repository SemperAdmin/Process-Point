drop policy if exists "Public read unit_forms" on public.unit_forms;
create policy "Public read unit_forms"
  on public.unit_forms
  for select
  to public
  using (true);

drop policy if exists "Public insert unit_forms" on public.unit_forms;
create policy "Public insert unit_forms"
  on public.unit_forms
  for insert
  to public
  with check (true);
