-- Allow read access to my_form_submissions for development/demo
-- WARNING: Restrict or remove in production environments
drop policy if exists "Public read my_form_submissions" on public.my_form_submissions;
create policy "Public read my_form_submissions"
  on public.my_form_submissions
  for select
  to public
  using (true);
