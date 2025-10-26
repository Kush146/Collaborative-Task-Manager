import { z } from 'zod'

/** Accepts ISO, `datetime-local`, `dd-MM-yyyy HH:mm`, `dd/MM/yyyy HH:mm`, or Date */
function parseAnyDate(value: unknown): Date | unknown {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return value
  const raw = value.trim()
  if (!raw) return value

  // ISO or datetime-local
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z)?$/.test(raw)) {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) return d
  }
  // dd-MM-yyyy HH:mm
  let m = raw.match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})$/)
  if (m) {
    const [, dd, mm, yyyy, HH, MM] = m
    const d = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}`)
    if (!Number.isNaN(d.getTime())) return d
  }
  // dd/MM/yyyy HH:mm
  m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})$/)
  if (m) {
    const [, dd, mm, yyyy, HH, MM] = m
    const d = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}`)
    if (!Number.isNaN(d.getTime())) return d
  }
  // final attempt
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d

  return value
}

const dateCoerce = z.preprocess(
  parseAnyDate,
  z.date({
    required_error: 'dueDate is required',
    invalid_type_error: 'Invalid dueDate (use a valid datetime, e.g. 2025-11-22T16:18)',
  })
)

const idOrNull = z
  .union([z.string().min(1), z.literal(''), z.null(), z.undefined()])
  .transform(v => (!v || v === '' ? null : v))

export const CreateTaskDto = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  dueDate: dateCoerce,
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).default('TODO'),
  assignedToId: idOrNull.optional(),
})

export const UpdateTaskDto = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  dueDate: dateCoerce.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  assignedToId: idOrNull.optional(),
})

export const TaskQueryDto = z.object({
  view: z.enum(['assigned', 'created', 'overdue']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  sort: z.enum(['dueDateAsc', 'dueDateDesc']).optional(),
})

export type CreateTaskDto = z.infer<typeof CreateTaskDto>
export type UpdateTaskDto = z.infer<typeof UpdateTaskDto>
export type TaskQueryDto = z.infer<typeof TaskQueryDto>
