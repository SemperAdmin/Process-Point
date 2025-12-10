import type { UnitSubTask as SUnitSubTask } from '@/services/supabaseUnitConfigService'
import { listSubTasks as sbListSubTasks, createSubTask as sbCreateSubTask, deleteSubTask as sbDeleteSubTask, updateSubTask as sbUpdateSubTask } from '@/services/supabaseUnitConfigService'
import { getChecklistByUnit } from '@/services/localDataService'

export type UnitSubTask = SUnitSubTask

export const listSubTasks = async (unit_id: string): Promise<UnitSubTask[]> => {
  try {
    return await sbListSubTasks(unit_id)
  } catch {
    const checklist = await getChecklistByUnit(unit_id)
    const rows: UnitSubTask[] = [] as any
    let autoId = 1
    for (const sec of checklist.sections) {
      for (const st of sec.sub_tasks) {
        const subId = `${sec.section_name}-${st.sub_task_id}`
        rows.push({
          id: autoId++,
          unit_id,
          section_id: 0,
          sub_task_id: subId,
          description: st.description,
          responsible_user_ids: st.responsible_user_id || [],
        } as any)
      }
    }
    return rows
  }
}

export const createSubTask = async (payload: Omit<UnitSubTask, 'id'>): Promise<void> => {
  await sbCreateSubTask(payload)
}

export const deleteSubTask = async (id: number): Promise<void> => {
  await sbDeleteSubTask(id)
}

export const updateSubTask = async (id: number, patch: Partial<UnitSubTask>): Promise<void> => {
  await sbUpdateSubTask(id, patch)
}
