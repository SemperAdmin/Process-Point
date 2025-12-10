import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import HeaderTools from '@/components/HeaderTools'
import { fetchJson, LocalUserProfile, UsersIndexEntry, getChecklistByUnit, getProgressByMember } from '@/services/localDataService'
import { sbListUsers, sbListSubmissionsByUnit } from '@/services/supabaseDataService'
import { listPendingForSectionManager, listArchivedForUser } from '@/services/localDataService'
import { getRoleOverride } from '@/utils/localUsersStore'
import { listSections } from '@/utils/unitStructure'
import { listMyItems } from '@/utils/myItemsStore'

export default function SectionManagerDashboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'inbound' | 'outbound' | 'forms'>('inbound')
  const [inbound, setInbound] = useState<{ member_user_id: string; sub_task_id: string }[]>([])
  const [outbound, setOutbound] = useState<{ member_user_id: string; sub_task_id: string; cleared_at_timestamp?: string }[]>([])
  const [memberMap, setMemberMap] = useState<Record<string, LocalUserProfile>>({})
  const [sectionLabel, setSectionLabel] = useState('')
  const [sectionForms, setSectionForms] = useState<Array<{ user_id: string; edipi?: string; name: string; kind: string; created_at?: string }>>([])
  const [inboundMembers, setInboundMembers] = useState<string[]>([])
  const [inboundSourceMap, setInboundSourceMap] = useState<Record<string, { items: number; forms: number; pending: number; lastForm?: string; lastFormName?: string; lastFormKind?: string; lastFormCreatedAt?: string }>>({})
  const [sectionDisplayMap, setSectionDisplayMap] = useState<Record<string, string>>({})
  const [taskLabels, setTaskLabels] = useState<Record<string, { section_name: string; description: string }>>({})
  const [latestInboundMap, setLatestInboundMap] = useState<Record<string, any>>({})
  const [previewSubmission, setPreviewSubmission] = useState<any | null>(null)
  const [previewPendingBySection, setPreviewPendingBySection] = useState<Record<string, string[]>>({})
  const [previewCompletedRows, setPreviewCompletedRows] = useState<Array<{ section: string; task: string; note?: string; at?: string }>>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const map: Record<string, LocalUserProfile> = {}
      if (import.meta.env.VITE_USE_SUPABASE === '1') {
        try {
          const allUsers = await sbListUsers()
          for (const profile of allUsers) {
            map[profile.user_id] = profile
          }
        } catch {
        }
      }
      if (Object.keys(map).length === 0) {
        try {
          const index = await fetchJson<{ users: UsersIndexEntry[] }>(`/data/users/users_index.json`)
          for (const entry of index.users) {
            const profile = await fetchJson<LocalUserProfile>(`/${entry.path}`)
            map[profile.user_id] = profile
          }
        } catch {
        }
      }
      setMemberMap(map)
      const pending = await listPendingForSectionManager(user.user_id, user.unit_id, user.edipi)
      setInbound(pending)
      const archived = await listArchivedForUser(user.user_id, user.unit_id)
      setOutbound(archived)
      let formsLocal: Array<{ user_id: string; edipi?: string; name: string; kind: string; created_at?: string }> = []
      try {
        if (import.meta.env.VITE_USE_SUPABASE === '1') {
          const submissions = await sbListSubmissionsByUnit(user.unit_id)
          const mySectionKey = String(user.platoon_id || '')
          const forms = submissions
            .filter(s => {
              const p = map[s.user_id]
              const secKey = p?.platoon_id ? String(p.platoon_id) : String((s as any).member?.platoon_id || '')
              return secKey && secKey === mySectionKey
            })
            .map(s => ({
              user_id: s.user_id,
              edipi: map[s.user_id]?.edipi,
              name: s.form_name,
              kind: s.kind,
              created_at: s.created_at,
            }))
          formsLocal = forms
          setSectionForms(formsLocal)
          const latest: Record<string, any> = {}
          for (const s of submissions.filter(x => (map[x.user_id]?.platoon_id ? String(map[x.user_id]?.platoon_id) === mySectionKey : String((x as any).member?.platoon_id || '') === mySectionKey))) {
            const cur = latest[s.user_id]
            const curAt = cur?.created_at || ''
            if (!cur || String(curAt) < String(s.created_at || '')) latest[s.user_id] = s
          }
          setLatestInboundMap(latest)
        } else {
          formsLocal = []
          setSectionForms(formsLocal)
          setLatestInboundMap({})
        }
      } catch {
        formsLocal = []
        setSectionForms(formsLocal)
        setLatestInboundMap({})
      }
      const secs = await listSections(user.unit_id)
      const sec = secs.find(s => String(s.id) === String(user.platoon_id))
      setSectionLabel((sec as any)?.display_name || sec?.section_name || 'Section')
      const dispMap: Record<string, string> = {}
      for (const s of secs) {
        dispMap[s.section_name] = ((s as any).display_name || s.section_name)
        dispMap[String(s.id)] = ((s as any).display_name || s.section_name)
      }
      setSectionDisplayMap(dispMap)

      try {
        const checklist = await getChecklistByUnit(user.unit_id)
        const labels: Record<string, { section_name: string; description: string }> = {}
        for (const sec of checklist.sections) {
          for (const st of sec.sub_tasks) {
            labels[st.sub_task_id] = { section_name: sec.section_name, description: st.description }
          }
        }
        setTaskLabels(labels)
      } catch {}

      const mySecKey = String(user.platoon_id || '')
      const sectionMemberIds = Object.values(map)
        .filter(p => p.unit_id === user.unit_id && (mySecKey ? String(p.platoon_id || '') === mySecKey : true))
        .map(p => p.user_id)
      const inboundFromProgress = new Set(pending.filter(it => sectionMemberIds.includes(it.member_user_id)).map(it => it.member_user_id))
      const inboundFromForms = new Set((formsLocal || []).filter(f => f.kind === 'Inbound').map(f => f.user_id))
      const inboundFromItems = new Set<string>()
      const detailMap: Record<string, { items: number; forms: number; pending: number; lastForm?: string; lastFormName?: string; lastFormKind?: string; lastFormCreatedAt?: string }> = {}
      for (const mid of sectionMemberIds) {
        try {
          const items = await listMyItems(mid, 'Inbound')
          const itemsCount = (items || []).length
          if (itemsCount) inboundFromItems.add(mid)
          const formsCount = (formsLocal || []).filter(f => f.kind === 'Inbound' && f.user_id === mid).length
          const inboundFormsForUser = (formsLocal || []).filter(f => f.kind === 'Inbound' && f.user_id === mid)
          const lastForm = inboundFormsForUser.map(f => f.created_at || '').sort().slice(-1)[0] || undefined
          const lastEntry = inboundFormsForUser.sort((a, b) => String(a.created_at || '') < String(b.created_at || '') ? -1 : 1).slice(-1)[0]
          const lastFormName = lastEntry?.name || undefined
          const lastFormKind = lastEntry?.kind || undefined
          const lastFormCreatedAt = lastEntry?.created_at || undefined
          const pendingCount = pending.filter(it => it.member_user_id === mid).length
          detailMap[mid] = { items: itemsCount, forms: formsCount, pending: pendingCount, lastForm, lastFormName, lastFormKind, lastFormCreatedAt }
        } catch {
          const inboundFormsForUser = (formsLocal || []).filter(f => f.kind === 'Inbound' && f.user_id === mid)
          const formsCount = inboundFormsForUser.length
          const lastForm = inboundFormsForUser.map(f => f.created_at || '').sort().slice(-1)[0] || undefined
          const lastEntry = inboundFormsForUser.sort((a, b) => String(a.created_at || '') < String(b.created_at || '') ? -1 : 1).slice(-1)[0]
          const lastFormName = lastEntry?.name || undefined
          const lastFormKind = lastEntry?.kind || undefined
          const lastFormCreatedAt = lastEntry?.created_at || undefined
          const pendingCount = pending.filter(it => it.member_user_id === mid).length
          detailMap[mid] = { items: 0, forms: formsCount, pending: pendingCount, lastForm, lastFormName, lastFormKind, lastFormCreatedAt }
        }
      }
      const union = Array.from(new Set<string>([...Array.from(inboundFromProgress), ...Array.from(inboundFromForms), ...Array.from(inboundFromItems)]))
      setInboundMembers(union)
      setInboundSourceMap(detailMap)
    }
    load()
  }, [user, refreshKey])

  const overrideRole = getRoleOverride(user?.edipi || '')?.org_role
  const isReviewer = (user?.section_role === 'Section_Reviewer' || user?.org_role === 'Section_Manager' || overrideRole === 'Section_Manager')
  if (!user || !isReviewer) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <p className="text-gray-400">Access denied</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-github-dark">
      <header className="bg-github-gray bg-opacity-10 border-b border-github-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-white">Section Manager — {sectionLabel}</h1>
            <HeaderTools />
          </div>
        </div>
      </header>
      <main className="px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-github-gray bg-opacity-10 border border-github-border rounded-xl">
          <div className="flex border-b border-github-border">
            <button
              onClick={() => setTab('inbound')}
              className={`px-4 py-3 text-sm ${tab === 'inbound' ? 'text-white border-b-2 border-github-blue' : 'text-gray-400'}`}
            >
              Inbound
            </button>
            <button
              onClick={() => setTab('outbound')}
              className={`px-4 py-3 text-sm ${tab === 'outbound' ? 'text-white border-b-2 border-github-blue' : 'text-gray-400'}`}
            >
              Outbound
            </button>
            <button
              onClick={() => setTab('forms')}
              className={`px-4 py-3 text-sm ${tab === 'forms' ? 'text-white border-b-2 border-github-blue' : 'text-gray-400'}`}
            >
              Forms
            </button>
            <div className="flex-1" />
            <button onClick={() => setRefreshKey(k => k + 1)} className="ml-auto px-3 py-2 text-sm bg-github-blue hover:bg-blue-600 text-white rounded">Refresh</button>
          </div>
          <div className="p-6">
            {tab === 'inbound' && (
              <div className="space-y-6">
                <div className="text-gray-300">Pending tasks assigned to your section</div>
                <table className="min-w-full text-sm">
                  <thead className="text-gray-400">
                    <tr>
                      <th className="text-left p-2">Member</th>
                      <th className="text-left p-2">EDIPI</th>
                      <th className="text-left p-2">Pending</th>
                      <th className="text-left p-2">Form</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Created At</th>
                      <th className="text-left p-2">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inboundMembers.map(mid => {
                      const m = memberMap[mid]
                      const name = m ? [m.first_name, m.last_name].filter(Boolean).join(' ') : mid
                      const d = inboundSourceMap[mid] || { items: 0, forms: 0, pending: 0, lastForm: '', lastFormName: '', lastFormKind: '', lastFormCreatedAt: '' }
                      const edipi = m?.edipi || ''
                      const latest = latestInboundMap[mid]
                      return (
                        <tr key={mid} className="border-t border-github-border text-gray-300">
                          <td className="p-2">{name}</td>
                          <td className="p-2">{edipi}</td>
                          <td className="p-2">{d.pending}</td>
                          <td className="p-2">{d.lastFormName || '—'}</td>
                          <td className="p-2">{d.lastFormKind || '—'}</td>
                          <td className="p-2">{d.lastFormCreatedAt || '—'}</td>
                          <td className="p-2">
                            <button
                              className="px-3 py-1 bg-github-blue hover:bg-blue-600 text-white rounded text-xs"
                              onClick={async () => {
                                const progress = await getProgressByMember(mid)
                                const pendingSet = new Set(progress.progress_tasks.filter(t => t.status === 'Pending').map(t => t.sub_task_id))
                                const completedSet = new Set(progress.progress_tasks.filter(t => t.status === 'Cleared').map(t => t.sub_task_id))
                                const formName = d.lastFormName || latest?.form_name || 'Inbound'
                                const kind = 'Inbound'
                                const createdAt = d.lastFormCreatedAt || latest?.created_at || ''
                                const member = { edipi: m?.edipi || '', rank: m?.rank, first_name: m?.first_name, last_name: m?.last_name, company_id: m?.company_id, platoon_id: m?.platoon_id }
                                const tasksIds = Array.from(new Set([...(latest?.tasks || []).map((t: any) => t.sub_task_id)]))
                                const pendingBySection: Record<string, string[]> = {}
                                const allSectionNames = new Set<string>()
                                for (const tid of tasksIds) {
                                  const label = taskLabels[tid]
                                  const code = label?.section_name || ''
                                  const name2 = code ? (sectionDisplayMap[code] || code) : ''
                                  allSectionNames.add(name2)
                                }
                                for (const nm of allSectionNames) pendingBySection[nm] = []
                                for (const tid of tasksIds) {
                                  if (!pendingSet.has(tid)) continue
                                  const label = taskLabels[tid]
                                  const code = label?.section_name || ''
                                  const name2 = code ? (sectionDisplayMap[code] || code) : ''
                                  pendingBySection[name2].push(label?.description || tid)
                                }
                                setPreviewPendingBySection(pendingBySection)
                                const completedRows: Array<{ section: string; task: string; note?: string; at?: string }> = []
                                for (const tid of tasksIds) {
                                  if (!completedSet.has(tid)) continue
                                  const label = taskLabels[tid]
                                  const code = label?.section_name || ''
                                  const secName = code ? (sectionDisplayMap[code] || code) : ''
                                  const entry = (progress.progress_tasks || []).find(t => String(t.sub_task_id) === String(tid)) as any
                                  const lastLog = Array.isArray(entry?.logs) && entry.logs.length ? entry.logs[entry.logs.length - 1] : undefined
                                  completedRows.push({ section: secName, task: (label?.description || tid), note: lastLog?.note, at: lastLog?.at })
                                }
                                setPreviewCompletedRows(completedRows)
                                setPreviewSubmission({ user_id: mid, unit_id: user.unit_id, form_name: formName, kind, created_at: createdAt, member })
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <table className="min-w-full text-sm">
                  <tbody>
                    {(sectionForms || []).filter(row => row.kind === 'Inbound').map(row => {
                      const m = memberMap[row.user_id]
                      const name = m ? [m.first_name, m.last_name].filter(Boolean).join(' ') : row.user_id
                      return (
                        <tr key={`${row.user_id}-${row.name}-${row.created_at}`} className="border-t border-github-border text-gray-300">
                          <td className="p-2">{[m?.rank, name].filter(Boolean).join(' ')}</td>
                          <td className="p-2">{row.edipi || ''}</td>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.kind}</td>
                          <td className="p-2">{row.created_at || ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {previewSubmission && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="w-full max-w-2xl bg-black border border-github-border rounded-xl p-6">
                  <h3 className="text-white text-lg mb-4">{previewSubmission.kind} — {previewSubmission.form_name}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                    <div><span className="text-gray-400">EDIPI:</span> {previewSubmission.member.edipi}</div>
                    <div><span className="text-gray-400">Unit:</span> {previewSubmission.unit_id}</div>
                    <div className="col-span-2"><span className="text-gray-400">Member:</span> {[previewSubmission.member.rank, [previewSubmission.member.first_name, previewSubmission.member.last_name].filter(Boolean).join(' ')].filter(Boolean).join(' ')}</div>
                    <div><span className="text-gray-400">Company:</span> {previewSubmission.member.company_id || ''}</div>
                    <div><span className="text-gray-400">Section:</span> {sectionDisplayMap[String(previewSubmission.member.platoon_id || '')] || previewSubmission.member.platoon_id || ''}</div>
                  </div>
                  <div className="mt-6 space-y-6">
                    <div>
                      <h4 className="text-white text-sm mb-2">Pending</h4>
                      {Object.keys(previewPendingBySection).length ? (
                        <div className="space-y-4">
                          {Object.entries(previewPendingBySection).map(([sec, items]) => (
                            <div key={sec} className="border border-github-border rounded">
                              <div className="px-3 py-2 border-b border-github-border text-white text-sm">{sec || 'Section'}</div>
                              <ul className="p-3 space-y-1 text-sm text-gray-300">
                                {items.map((d, i) => (<li key={`${sec}-${i}`}>{d}</li>))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (<div className="text-gray-400 text-sm">None</div>)}
                    </div>
                    <div>
                      <h4 className="text-white text-sm mb-2">Completed</h4>
                      {previewCompletedRows.length ? (
                        <table className="min-w-full text-sm">
                          <thead className="text-gray-400">
                            <tr>
                              <th className="text-left p-2">Section</th>
                              <th className="text-left p-2">Task</th>
                              <th className="text-left p-2">Log</th>
                              <th className="text-left p-2">When</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewCompletedRows.map((r, i) => (
                              <tr key={`row-${i}`} className="border-t border-github-border text-gray-300">
                                <td className="p-2">{r.section || ''}</td>
                                <td className="p-2">{r.task}</td>
                                <td className="p-2">{r.note || ''}</td>
                                <td className="p-2">{r.at || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (<div className="text-gray-400 text-sm">None</div>)}
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2 justify-end">
                    <button onClick={() => { setPreviewSubmission(null); setPreviewPendingBySection({}); setPreviewCompletedRows([]) }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded">Close</button>
                  </div>
                </div>
              </div>
            )}
            {tab === 'forms' && (
              <div className="space-y-6">
                <div className="text-gray-300">Forms submitted by members in your section</div>
                <table className="min-w-full text-sm">
                  <thead className="text-gray-400">
                    <tr>
                      <th className="text-left p-2">Member</th>
                      <th className="text-left p-2">EDIPI</th>
                      <th className="text-left p-2">Form</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionForms.map(row => {
                      const m = memberMap[row.user_id]
                      const name = m ? [m.first_name, m.last_name].filter(Boolean).join(' ') : row.user_id
                      return (
                        <tr key={`${row.user_id}-${row.name}-${row.created_at}`} className="border-t border-github-border text-gray-300">
                          <td className="p-2">{[m?.rank, name].filter(Boolean).join(' ')}</td>
                          <td className="p-2">{row.edipi || ''}</td>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.kind}</td>
                          <td className="p-2">{row.created_at || ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {tab === 'forms' && (
              <div className="space-y-6">
                <div className="text-gray-300">Forms submitted by members in your section</div>
                <table className="min-w-full text-sm">
                  <thead className="text-gray-400">
                    <tr>
                      <th className="text-left p-2">Member</th>
                      <th className="text-left p-2">EDIPI</th>
                      <th className="text-left p-2">Form</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionForms.map(row => {
                      const m = memberMap[row.user_id]
                      const name = m ? [m.first_name, m.last_name].filter(Boolean).join(' ') : row.user_id
                      return (
                        <tr key={`${row.user_id}-${row.name}-${row.created_at}`} className="border-t border-github-border text-gray-300">
                          <td className="p-2">{[m?.rank, name].filter(Boolean).join(' ')}</td>
                          <td className="p-2">{row.edipi || ''}</td>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.kind}</td>
                          <td className="p-2">{row.created_at || ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {tab === 'outbound' && (
              <div className="space-y-6">
                <div className="text-gray-300">Tasks you have cleared</div>
                <table className="min-w-full text-sm">
                  <thead className="text-gray-400">
                    <tr>
                      <th className="text-left p-2">Member</th>
                      <th className="text-left p-2">Sub Task ID</th>
                      <th className="text-left p-2">Cleared At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outbound.map(item => {
                      const m = memberMap[item.member_user_id]
                      const name = m ? [m.first_name, m.last_name].filter(Boolean).join(' ') : item.member_user_id
                      return (
                        <tr key={`${item.member_user_id}-${item.sub_task_id}`} className="border-t border-github-border text-gray-300">
                          <td className="p-2">{name}</td>
                          <td className="p-2">{item.sub_task_id}</td>
                          <td className="p-2">{item.cleared_at_timestamp || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
