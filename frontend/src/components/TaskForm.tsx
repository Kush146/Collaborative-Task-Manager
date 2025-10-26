import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/api'

const schema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  dueDate: z.string().min(1),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']),
  status: z.enum(['TODO','IN_PROGRESS','REVIEW','COMPLETED'])
})
type FormValues = z.infer<typeof schema>

export const TaskForm = ({ onCreated }: { onCreated: ()=>void }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title:'', description:'', dueDate:'', priority:'MEDIUM', status:'TODO' }
  })

  const onSubmit = async (values: FormValues) => {
    await api.post('/tasks', { ...values, dueDate: new Date(values.dueDate).toISOString() })
    reset()
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input className="w-full border rounded p-2" placeholder="Title" {...register('title')} />
      {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
      <textarea className="w-full border rounded p-2" placeholder="Description" rows={3} {...register('description')} />
      {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
      <div className="grid grid-cols-3 gap-3">
        <input type="datetime-local" className="border rounded p-2" {...register('dueDate')} />
        <select className="border rounded p-2" {...register('priority')}>
          <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
        </select>
        <select className="border rounded p-2" {...register('status')}>
          <option>TODO</option><option>IN_PROGRESS</option><option>REVIEW</option><option>COMPLETED</option>
        </select>
      </div>
      <button disabled={isSubmitting} className="bg-black text-white px-4 py-2 rounded">
        {isSubmitting ? 'Creating…' : 'Create Task'}
      </button>
    </form>
  )
}
