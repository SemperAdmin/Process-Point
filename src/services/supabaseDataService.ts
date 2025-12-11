import { supabase } from './supabaseClient'
import { LocalUserProfile, MemberProgress } from './localDataService'
import type { UnitForm } from '@/utils/formsStore'
import type { MyFormSubmission } from '@/utils/myFormSubmissionsStore'

export const sbGetUserByEdipi = async (edipi: string): Promise<LocalUserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('edipi', edipi)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as any) || null
}

export const sbVerifyPassword = async (plain: string, hashed: string): Promise<boolean> => {
  const mod = await import('bcryptjs')
  const bcrypt = (mod as any).default || mod
  return bcrypt.compare(plain, hashed)
}

export const sbInsertUser = async (user: LocalUserProfile): Promise<void> => {
  const { error } = await supabase.from('users').insert(user as any)
  if (error) throw error
}

export const sbUpsertProgress = async (progress: MemberProgress): Promise<void> => {
  const { error } = await supabase.from('members_progress').upsert(progress as any)
  if (error) throw error
}

export const sbGetProgressByMember = async (memberUserId: string): Promise<MemberProgress | null> => {
  const { data, error } = await supabase
    .from('members_progress')
    .select('*')
    .eq('member_user_id', memberUserId)
    .maybeSingle()
  if (error) throw error
  return (data as any) || null
}

export const sbListMembers = async (): Promise<{ member_user_id: string; unit_id: string }[]> => {
  const { data, error } = await supabase
    .from('members_progress')
    .select('member_user_id, unit_id')
  if (error) throw error
  return (data as any) || []
}

// ===== Forms Management =====

export const sbListForms = async (unit_id: string): Promise<UnitForm[]> => {
  const tryEq = async (val: string) => supabase.from('unit_forms').select('*').eq('unit_id', val).order('name')
  const ruc = (unit_id || '').includes('-') ? (unit_id || '').split('-')[1] : unit_id
  let { data, error } = await tryEq(unit_id)
  if (error) throw error
  let rows = (data as any) || []
  if (!rows.length && ruc) {
    const r = await tryEq(ruc)
    if (r.error) throw r.error
    rows = (rows as any).concat(r.data || [])
    if (!rows.length) {
      const like = await supabase.from('unit_forms').select('*').ilike('unit_id', `%-${ruc}-%`).order('name')
      if (like.error) throw like.error
      rows = (rows as any).concat(like.data || [])
    }
  }
  const dedup = Array.from(new Map((rows as any[]).map(f => [f.id, f])).values())
  return dedup as any
}

export const sbUpdateMemberProgressTask = async (
  member_user_id: string,
  unit_id: string,
  sub_task_id: string,
  patch: { completion_values?: string[]; status?: 'Pending' | 'Cleared'; cleared_by_user_id?: string; cleared_at_timestamp?: string; log?: { note: string; by_user_id: string; at: string } }
): Promise<void> => {
  const current = await sbGetProgressByMember(member_user_id)
  const base = current || { member_user_id, unit_id, official_checkin_timestamp: new Date().toISOString(), current_file_sha: '', progress_tasks: [] }
  let found = false
  const tasks = (base.progress_tasks || []).map((t: any) => {
    if (String(t.sub_task_id) === String(sub_task_id)) {
      found = true
      const nextLogs = patch.log ? ([...(t.logs || []), patch.log]) : (t.logs || [])
      const { log, ...rest } = patch as any
      return { ...t, ...rest, logs: nextLogs }
    }
    return t
  })
  if (!found) tasks.push({ sub_task_id, status: patch.status || 'Pending', completion_values: patch.completion_values || [], cleared_by_user_id: patch.cleared_by_user_id, cleared_at_timestamp: patch.cleared_at_timestamp, logs: patch.log ? [patch.log] : [] })
  const next = { ...base, progress_tasks: tasks }
  const canonical = JSON.stringify(next)
  const sha = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical)).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
  ;(next as any).current_file_sha = sha
  await sbUpsertProgress(next as any)
}

export const sbCreateForm = async (form: Omit<UnitForm, 'id' | 'created_at' | 'updated_at'>): Promise<UnitForm> => {
  const { data, error } = await supabase
    .from('unit_forms')
    .insert(form as any)
    .select()
    .single()
  if (error) throw error
  return data as any
}

export const sbUpdateForm = async (id: number, patch: Partial<UnitForm>): Promise<void> => {
  const { error } = await supabase
    .from('unit_forms')
    .update({ ...patch, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
  if (error) throw error
}

export const sbDeleteForm = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('unit_forms')
    .delete()
    .eq('id', id)
  if (error) throw error
}


// ===== Form Submissions Management =====

export const sbListSubmissions = async (user_id: string): Promise<MyFormSubmission[]> => {
  const { data, error } = await supabase
    .from('my_form_submissions')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as any) || []
}

export const sbListSubmissionsByUnit = async (unit_id: string): Promise<MyFormSubmission[]> => {
  const { data, error } = await supabase
    .from('my_form_submissions')
    .select('*')
    .eq('unit_id', unit_id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as any) || []
}

export const sbListInboundSubmissionsByPlatoon = async (
  unit_id: string,
  platoon_id: string
): Promise<MyFormSubmission[]> => {
  const { data, error } = await supabase
    .from('my_form_submissions')
    .select('*')
    .eq('unit_id', unit_id)
    .eq('kind', 'Inbound')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as any) || []
}

export const sbListMemberFormCompletion = async (
  member_user_id: string
): Promise<Array<{ member_user_id: string; unit_id: string; form_id: number; form_name: string; kind: 'Inbound' | 'Outbound'; total_count: number; cleared_count: number; status: 'In_Progress' | 'Completed' }>> => {
  const { data, error } = await supabase
    .from('member_form_completion')
    .select('*')
    .eq('member_user_id', member_user_id)
  if (error) throw error
  return (data as any) || []
}

export const sbCreateSubmission = async (submission: Omit<MyFormSubmission, 'id' | 'created_at'>): Promise<MyFormSubmission> => {
  const { data, error } = await supabase
    .from('my_form_submissions')
    .insert(submission as any)
    .select()
    .single()
  if (error) throw error
  return data as any
}

export const sbDeleteSubmission = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('my_form_submissions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const sbUpdateSubmission = async (id: number, patch: Partial<MyFormSubmission>): Promise<void> => {
  const { error } = await supabase
    .from('my_form_submissions')
    .update(patch as any)
    .eq('id', id)
  if (error) throw error
}

// ===== Users Management =====

export const sbListUsers = async (): Promise<LocalUserProfile[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at_timestamp', { ascending: false })
  if (error) throw error
  return (data as any) || []
}

export const sbListUsersByRuc = async (ruc: string): Promise<LocalUserProfile[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at_timestamp', { ascending: false })
  if (error) throw error

  // Filter by RUC (unit_id contains RUC)
  const users = (data as any) || []
  return users.filter((user: LocalUserProfile) => {
    const userRuc = (user.unit_id || '').includes('-')
      ? (user.unit_id || '').split('-')[1]
      : (user.unit_id || '')
    return String(userRuc) === String(ruc)
  })
}

export const sbUpdateUser = async (user_id: string, patch: Partial<LocalUserProfile>): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ ...patch, updated_at_timestamp: new Date().toISOString() })
    .eq('user_id', user_id)
  if (error) throw error
}
