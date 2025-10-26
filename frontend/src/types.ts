export type User = { id: string; email: string; name: string }
export type Priority = 'LOW'|'MEDIUM'|'HIGH'|'URGENT'
export type Status = 'TODO'|'IN_PROGRESS'|'REVIEW'|'COMPLETED'
export type Task = {
  id: string
  title: string
  description: string
  dueDate: string
  priority: Priority
  status: Status
  creatorId: string
  assignedToId?: string | null
}
export type Notification = { id: string; type: string; data: any; read: boolean; createdAt: string }
