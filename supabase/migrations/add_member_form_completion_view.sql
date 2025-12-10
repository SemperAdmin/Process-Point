create or replace view public.member_form_completion as
with forms_tasks as (
  select f.id as form_id,
         f.unit_id,
         f.name as form_name,
         f.kind,
         jsonb_array_elements_text(f.task_ids) as sub_task_id
  from public.unit_forms f
),
members as (
  select member_user_id, unit_id
  from public.members_progress
),
progress_tasks as (
  select mp.member_user_id,
         mp.unit_id,
         (pt).sub_task_id::text as sub_task_id,
         (pt).status::text as status
  from public.members_progress mp,
       lateral jsonb_to_recordset(mp.progress_tasks) as pt(sub_task_id text, status text)
)
select m.member_user_id,
       ft.unit_id,
       ft.form_id,
       ft.form_name,
       ft.kind,
       count(ft.sub_task_id)::int as total_count,
       coalesce(sum(case when pr.status = 'Cleared' then 1 else 0 end), 0)::int as cleared_count,
       case when count(ft.sub_task_id) > 0 and coalesce(sum(case when pr.status = 'Cleared' then 1 else 0 end), 0) = count(ft.sub_task_id)
            then 'Completed' else 'In_Progress' end as status
from forms_tasks ft
join members m on m.unit_id = ft.unit_id
left join progress_tasks pr on pr.member_user_id = m.member_user_id and pr.sub_task_id = ft.sub_task_id
group by m.member_user_id, ft.unit_id, ft.form_id, ft.form_name, ft.kind;

comment on view public.member_form_completion is 'Aggregates per-member form completion counts and status using unit_forms and members_progress';
