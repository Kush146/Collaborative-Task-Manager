import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import type { User, Task, Status, Priority, Notification } from '../types'
import { format } from 'date-fns'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

/** ------------- Small reusable UI components ------------- */
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 ${className}`}>{children}</div>
)

const Badge: React.FC<{ tone?: 'gray'|'green'|'blue'|'orange'|'red'|'purple'; children: React.ReactNode }> = ({ tone='gray', children }) => {
  const map: Record<string,string> = {
    gray: 'bg-gray-100 text-gray-700',
    green:'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    orange:'bg-orange-100 text-orange-700',
    red:  'bg-rose-100 text-rose-700',
    purple:'bg-violet-100 text-violet-700'
  }
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${map[tone]}`}>{children}</span>
}

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

const PillButton: React.FC<React.PropsWithChildren<{ onClick?:()=>void; className?:string; type?: 'button'|'submit' }>> = ({ onClick, className='', type='button', children }) => (
  <button type={type} onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 transition ${className}`}>
    {children}
  </button>
)

const PrimaryButton: React.FC<React.PropsWithChildren<{ onClick?:()=>void; className?:string; type?: 'button'|'submit' }>> = ({ onClick, className='', type='button', children }) => (
  <button type={type} onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-black text-white hover:bg-gray-800 active:bg-gray-900 transition shadow-sm ${className}`}>
    {children}
  </button>
)

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode; description?: string }> = ({ open, title, description, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl" onClick={e=>e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

/** Convert ISO → input format (YYYY-MM-DDTHH:mm) */
const toLocalInputValue = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/** ────────────────────────── Views ────────────────────────── */
const views = [
  { key: 'assigned', label: 'Assigned to me' },
  { key: 'created', label: 'Created by me' },
  { key: 'overdue', label: 'Overdue' }
] as const

export const Dashboard = ({ user, onLogout }: { user: User, onLogout: ()=>void }) => {
  const [view, setView] = useState<'assigned'|'created'|'overdue'>('assigned')
  const [filters, setFilters] = useState<{ status?: Status; priority?: Priority; sort?: 'asc'|'desc'; q?: string }>({ sort: 'asc', q: '' })
  const [createOpen, setCreateOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user.name)
  const [toast, setToast] = useState<string | null>(null)
  const [layout, setLayout] = useState<'list'|'kanban'>('list')
  const qc = useQueryClient()

  const fetchTasks = async () => {
    const params: any = new URLSearchParams()
    params.set('view', view)
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.q) params.set('q', filters.q)
    params.set('sort', filters.sort === 'desc' ? 'dueDateDesc' : 'dueDateAsc')
    const { data } = await api.get(`/tasks?${params.toString()}`)
    return data.tasks as Task[]
  }

  const { data: tasks, refetch, isLoading } = useQuery({ queryKey: ['tasks', view, filters], queryFn: fetchTasks })

  useEffect(() => {
    const s = getSocket()
    const onUpdate = () => refetch()
    s.on('taskUpdated', onUpdate)
    s.on('taskAssigned', onUpdate)
    return () => {
      s.off('taskUpdated', onUpdate)
      s.off('taskAssigned', onUpdate)
    }
  }, [view, refetch])

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignedToId }: { id: string; assignedToId: string }) => {
      const { data } = await api.patch(`/tasks/${id}`, { assignedToId })
      return data.task as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] })
  })

  const logout = async () => { await api.post('/auth/logout'); onLogout() }

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.notifications as Notification[]
  })

  const toneForStatus = (s: Status) => s==='COMPLETED'?'green':s==='IN_PROGRESS'?'blue':s==='REVIEW'?'orange':'gray'
  const toneForPriority = (p: Priority) => p==='URGENT'?'red':p==='HIGH'?'orange':p==='MEDIUM'?'blue':'gray'

  const unreadCount = notifications?.filter(n=>!n.read).length ?? 0

  const stats = useMemo(() => {
    const total = tasks?.length ?? 0
    const completed = tasks?.filter(t=>t.status==='COMPLETED').length ?? 0
    const inProgress = tasks?.filter(t=>t.status==='IN_PROGRESS').length ?? 0
    const urgent = tasks?.filter(t=>t.priority==='URGENT').length ?? 0
    return { total, completed, inProgress, urgent }
  }, [tasks])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Topbar */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-800">
        <div className="container mx-auto px-4 py-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:gap-3 gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold leading-tight">Welcome back, {displayName}</h1>
              <p className="text-sm text-white/70">Stay on top of your work — real-time updates enabled.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <input
                  className="pl-3 pr-3 py-2 rounded-xl bg-white/10 text-white placeholder:text-white/70 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="Search tasks..."
                  value={filters.q}
                  onChange={e=>setFilters(f=>({...f, q: e.target.value }))}
                />
              </div>

              {/* Dark-styled buttons in the header */}
              <PillButton
                className="border-transparent bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 active:bg-white/20"
                onClick={()=>setEditOpen(true)}
              >
                Edit Profile
              </PillButton>

              <PrimaryButton
                className="ring-1 ring-white/20 bg-white/10 text-white hover:bg-white/20 active:bg-white/25"
                onClick={()=>setCreateOpen(true)}
              >
                New Task
              </PrimaryButton>

              <PillButton
                className="border-transparent bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 active:bg-white/20"
                onClick={()=>setReviewOpen(true)}
              >
                Request Review
              </PillButton>

              <PillButton
                className="border-transparent bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 active:bg-white/20"
                onClick={()=>setNotifOpen(true)}
              >
                Notifications {unreadCount?`(${unreadCount})`:''}
              </PillButton>

              <button
                className="ml-1 text-sm text-white/80 hover:text-white underline decoration-white/40 hover:decoration-white"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><div className="p-4"><p className="text-sm text-gray-500">Total tasks</p><p className="text-2xl font-semibold mt-1">{stats.total}</p></div></Card>
          <Card><div className="p-4"><p className="text-sm text-gray-500">In progress</p><p className="text-2xl font-semibold mt-1">{stats.inProgress}</p></div></Card>
          <Card><div className="p-4"><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-semibold mt-1">{stats.completed}</p></div></Card>
          <Card><div className="p-4"><p className="text-sm text-gray-500">Urgent</p><p className="text-2xl font-semibold mt-1">{stats.urgent}</p></div></Card>
        </div>

        {/* Controls */}
        <Card>
          <div className="p-4 flex flex-wrap items-center gap-2">
            {views.map(v => (
              <button key={v.key} onClick={() => setView(v.key as any)} className={`px-3 py-1.5 rounded-xl transition ${view===v.key?'bg-black text-white':'bg-white ring-1 ring-gray-200 hover:bg-gray-50'}`}>
                {v.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-500 text-sm hidden sm:inline">Filters</span>
              <select className="border rounded-xl px-3 py-1.5" value={filters.status ?? ''} onChange={e=>setFilters(f=>({...f, status: (e.target.value || undefined) as Status|undefined}))}>
                <option value="">Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select className="border rounded-xl px-3 py-1.5" value={filters.priority ?? ''} onChange={e=>setFilters(f=>({...f, priority: (e.target.value || undefined) as Priority|undefined}))}>
                <option value="">Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <select className="border rounded-xl px-3 py-1.5" value={filters.sort} onChange={e=>setFilters(f=>({...f, sort: e.target.value as ('asc'|'desc')}))}>
                <option value="asc">Due date ↑</option>
                <option value="desc">Due date ↓</option>
              </select>
              <PillButton onClick={()=>setLayout(l=>l==='list'?'kanban':'list')}>
                {layout==='list'?'Kanban':'List'} view
              </PillButton>
            </div>
          </div>
        </Card>

        {/* Content */}
        {layout==='list' ? (
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            toneForStatus={toneForStatus}
            toneForPriority={toneForPriority}
            user={user}
            assign={(id, assignedToId)=>assignMutation.mutate({ id, assignedToId })}
          />
        ) : (
          <Kanban
            tasks={tasks}
            isLoading={isLoading}
            toneForStatus={toneForStatus}
            toneForPriority={toneForPriority}
            user={user}
            assign={(id, assignedToId)=>assignMutation.mutate({ id, assignedToId })}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-xl shadow-lg">{toast}</div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={()=>setCreateOpen(false)} title="Create task" description="Fill the details below to create a new task.">
        <TaskComposer onCreated={()=>{ setCreateOpen(false); setToast('✅ Task created successfully!'); refetch(); setTimeout(()=>setToast(null),2000) }} />
      </Modal>

      {/* Edit name modal */}
      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Edit profile" description="Update how your name appears across the workspace.">
        <EditName initialName={displayName} onSaved={(newName) => { setDisplayName(newName); setEditOpen(false); }} />
      </Modal>

      {/* Review modal */}
      <Modal open={reviewOpen} onClose={()=>setReviewOpen(false)} title="Request review" description="Share a file and optional notes for reviewers.">
        <ReviewRequest onDone={()=>setReviewOpen(false)} />
      </Modal>

      {/* Notifications drawer */}
      {notifOpen && (
        <aside className="fixed top-0 right-0 w-96 max-w-full h-full bg-white shadow-2xl z-50 ring-1 ring-black/5">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={()=>setNotifOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
            {notifications?.length ? notifications.map(n => (
              <div key={n.id} className="p-3 border rounded-xl">
                <div className="text-sm font-medium">{n.type}</div>
                <div className="text-xs text-gray-600 mt-1 break-words">{JSON.stringify(n.data)}</div>
              </div>
            )) : (
              <div className="text-sm text-gray-500">You're all caught up.</div>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

/** -------------------- List view -------------------- */
const TaskList = ({ tasks, isLoading, toneForStatus, toneForPriority, user, assign }: {
  tasks?: Task[]; isLoading: boolean; toneForStatus: (s: Status)=>any; toneForPriority:(p:Priority)=>any; user: User; assign: (id:string, assignedToId:string)=>void
}) => {
  return (
    <Card>
      <div className="p-2">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-14" />)}
          </div>
        ) : tasks?.length ? (
          <div className="divide-y">
            {tasks.map(t => (
              <div key={t.id} className="py-3 px-2 flex items-center gap-4 rounded-lg hover:bg-gray-50">
                <div className="min-w-[240px]">
                  <div className="font-medium line-clamp-1">{t.title}</div>
                  <div className="text-xs text-gray-500">Due {format(new Date(t.dueDate), 'PPpp')}</div>
                </div>
                <Badge tone={toneForStatus(t.status)}>{t.status.replace('_',' ')}</Badge>
                <Badge tone={toneForPriority(t.priority)}>{t.priority}</Badge>
                <div className="hidden lg:block text-sm text-gray-600 max-w-[40%] line-clamp-1">{t.description}</div>
                <div className="ml-auto flex items-center gap-2">
                  <input className="border rounded-xl px-2 py-1 text-sm" placeholder="Assign userId" onKeyDown={e=>{ if(e.key==='Enter'){ const val = (e.target as HTMLInputElement).value.trim(); if (val) assign(t.id, val) } }} />
                  <PrimaryButton onClick={() => assign(t.id, user.id)}>Assign to me</PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState/>
        )}
      </div>
    </Card>
  )
}

/** -------------------- Kanban view -------------------- */
const columns: { key: Status; title: string; hint: string }[] = [
  { key: 'TODO', title: 'To Do', hint: 'Incoming tasks' },
  { key: 'IN_PROGRESS', title: 'In Progress', hint: 'Currently being worked on' },
  { key: 'REVIEW', title: 'Review', hint: 'Needs feedback' },
  { key: 'COMPLETED', title: 'Done', hint: 'Shipped ✓' }
]

const Kanban = ({ tasks, isLoading, toneForStatus, toneForPriority, user, assign }: {
  tasks?: Task[]; isLoading: boolean; toneForStatus: (s: Status)=>any; toneForPriority:(p:Priority)=>any; user: User; assign: (id:string, assignedToId:string)=>void
}) => {
  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], COMPLETED: [] }
    ;(tasks||[]).forEach(t => g[t.status].push(t))
    return g
  }, [tasks])

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {isLoading ? (
        Array.from({length:4}).map((_,i)=>(<Card key={i}><div className="p-4 space-y-3"><Skeleton className="h-6 w-1/2"/><Skeleton className="h-28"/><Skeleton className="h-28"/></div></Card>))
      ) : (
        columns.map(col => (
          <Card key={col.key}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{col.title}</h4>
                  <p className="text-xs text-gray-500">{col.hint}</p>
                </div>
                <Badge tone={col.key==='COMPLETED'?'green':col.key==='IN_PROGRESS'?'blue':col.key==='REVIEW'?'orange':'gray'}>
                  {grouped[col.key]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-3">
                {grouped[col.key]?.length ? grouped[col.key].map(t => (
                  <div key={t.id} className="rounded-xl border p-3 bg-white hover:shadow-sm transition">
                    <div className="font-medium line-clamp-1">{t.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                      <span>{format(new Date(t.dueDate), 'PPp')}</span>
                      <span>•</span>
                      <Badge tone={toneForPriority(t.priority)}>{t.priority}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input className="border rounded-xl px-2 py-1 text-xs" placeholder="Assign userId" onKeyDown={e=>{ if(e.key==='Enter'){ const val = (e.target as HTMLInputElement).value.trim(); if (val) assign(t.id, val) } }} />
                      <PillButton onClick={()=>assign(t.id, user.id)}>Assign to me</PillButton>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-gray-500 py-8 grid place-items-center">
                    <span>No cards</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

const EmptyState = () => (
  <div className="py-16 grid place-items-center text-center">
    <div className="h-14 w-14 rounded-2xl bg-gray-100 grid place-items-center mb-3">📋</div>
    <h3 className="text-lg font-semibold">No tasks to show</h3>
    <p className="text-sm text-gray-500 mt-1">Try creating a new task or adjusting your filters.</p>
  </div>
)

/** -------------------- Create Task (React Hook Form + Zod) -------------------- */
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Max 100 characters'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']),
})

type TaskForm = z.infer<typeof taskSchema>

const TaskComposer = ({ onCreated }: { onCreated: ()=>void }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', dueDate: '', priority: 'MEDIUM', status: 'TODO' },
  })

  const dueDate = watch('dueDate')

  const onSubmit = handleSubmit(async (values) => {
    let finalDue = values.dueDate
    if (values.dueDate && values.dueDate.length === 16) {
      finalDue = new Date(values.dueDate).toISOString()
    }
    await api.post('/tasks', { ...values, dueDate: finalDue })
    reset()
    onCreated()
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className="text-sm text-gray-700">Title</span>
          <input className={`mt-1 w-full rounded-xl border px-3 py-2 ${errors.title ? 'border-rose-300' : 'border-gray-200'}`} placeholder="Title" {...register('title')} />
          {errors.title && <span className="text-xs text-rose-600">{errors.title.message}</span>}
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Description</span>
          <textarea rows={4} className={`mt-1 w-full rounded-xl border px-3 py-2 ${errors.description ? 'border-rose-300' : 'border-gray-200'}`} placeholder="Describe the task" {...register('description')} />
          {errors.description && <span className="text-xs text-rose-600">{errors.description.message}</span>}
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm text-gray-700">Due date</span>
            <input type="datetime-local" className={`mt-1 w-full rounded-xl border px-3 py-2 ${errors.dueDate ? 'border-rose-300' : 'border-gray-200'}`} value={toLocalInputValue(dueDate)} onChange={(e) => { const local = e.currentTarget.value; setValue('dueDate', local, { shouldValidate: true }) }} />
            {errors.dueDate && <span className="text-xs text-rose-600">{errors.dueDate.message}</span>}
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">Priority</span>
            <select className="mt-1 w-full rounded-xl border px-3 py-2 border-gray-200" {...register('priority')}>
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">Status</span>
            <select className="mt-1 w-full rounded-xl border px-3 py-2 border-gray-200" {...register('status')}>
              <option>TODO</option><option>IN_PROGRESS</option><option>REVIEW</option><option>COMPLETED</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <PillButton>Reset</PillButton>
        <PrimaryButton type="submit">{isSubmitting ? 'Creating…' : 'Create Task'}</PrimaryButton>
      </div>
    </form>
  )
}

/** -------------------- Edit profile name -------------------- */
const EditName = ({ initialName, onSaved }: { initialName: string; onSaved: (name: string)=>void }) => {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const schema = z.object({ name: z.string().min(1, 'Name is required').max(50) })
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse({ name })
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    setError(null); setSaving(true)
    try {
      const { data } = await api.patch('/users/me', { name: parsed.data.name })
      onSaved(data.user.name)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update name')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm text-gray-700">Display name</span>
        <input className="mt-1 w-full rounded-xl border px-3 py-2" value={name} onChange={(e)=>setName(e.currentTarget.value)} maxLength={50} />
      </label>
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="flex justify-end gap-2">
        <PillButton onClick={()=>{ setName(initialName) }}>Reset</PillButton>
        <PrimaryButton type="submit" className={saving?'opacity-70 pointer-events-none':''}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
      </div>
    </form>
  )
}

/** -------------------- Request Review (UI only for now) -------------------- */
const ReviewRequest = ({ onDone }: { onDone: ()=>void }) => {
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    alert(file ? `Pretend uploaded: ${file.name}
Notes: ${notes || '(none)'}` : 'Select a file first.')
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-xl border border-dashed p-6 text-center bg-gray-50/50">
        <input type="file" onChange={e=>setFile(e.currentTarget.files?.[0] ?? null)} />
        {file && <div className="mt-2 text-sm text-gray-600">Selected: {file.name}</div>}
      </div>
      <textarea rows={4} className="w-full rounded-xl border px-3 py-2" placeholder="What should reviewers focus on?" value={notes} onChange={e=>setNotes(e.currentTarget.value)} />
      <div className="flex justify-end gap-2">
        <PillButton onClick={onDone}>Cancel</PillButton>
        <PrimaryButton>Send for review</PrimaryButton>
      </div>
    </form>
  )
}
