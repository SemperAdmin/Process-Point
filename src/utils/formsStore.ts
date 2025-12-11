import { sbListForms, sbCreateForm, sbUpdateForm, sbDeleteForm } from '@/services/supabaseDataService'

export type UnitFormPurpose =
  | 'Fleet_Assistance_Program'
  | 'TAD_31_plus_days'
  | 'TAD_30_or_less'
  | 'PCA'
  | 'PCS'
  | 'Separation'
  | 'Retirement'

export type UnitForm = {
  id: number
  unit_id: string
  name: string
  kind: 'Inbound' | 'Outbound'
  task_ids: string[]
  purpose?: UnitFormPurpose
}
export const listForms = async (unit_id: string): Promise<UnitForm[]> => {
  return await sbListForms(unit_id)
}

export const createForm = async (unit_id: string, name: string, kind: 'Inbound' | 'Outbound', task_ids: string[], purpose?: UnitFormPurpose): Promise<void> => {
  await sbCreateForm({ unit_id, name, kind, task_ids, purpose })
}

export const deleteForm = async (_unit_id: string, id: number): Promise<void> => {
  await sbDeleteForm(id)
}

export const updateForm = async (_unit_id: string, id: number, patch: Partial<UnitForm>): Promise<void> => {
  await sbUpdateForm(id, patch)
}
