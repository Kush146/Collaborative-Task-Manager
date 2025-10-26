import { prisma } from '../../utils/prisma.js'
import type { Prisma, Priority, Status } from '@prisma/client'

/** Filters accepted by listTasks */
export type ListFilters = {
  status?: Status
  priority?: Priority
  /** tasks assigned to this user */
  userId?: string
  /** tasks created by this user */
  createdBy?: string
  /** only tasks with dueDate < now */
  overdue?: boolean
  /** sort by due date */
  sort?: 'dueDateAsc' | 'dueDateDesc'
}

/**
 * List tasks using strongly-typed Prisma filters and orderBy.
 * Ensures 'orderBy' uses literal 'asc' | 'desc' to satisfy Prisma types.
 */
export const listTasks = async (filters: ListFilters) => {
  const where: Prisma.TaskWhereInput = {}

  if (filters.status) where.status = filters.status
  if (filters.priority) where.priority = filters.priority
  if (filters.userId) where.assignedToId = filters.userId
  if (filters.createdBy) where.creatorId = filters.createdBy
  if (filters.overdue) where.dueDate = { lt: new Date() }

  const orderBy: Prisma.TaskOrderByWithRelationInput = {
    dueDate: filters.sort === 'dueDateDesc' ? 'desc' : 'asc',
  }

  return prisma.task.findMany({
    where,
    orderBy,
    include: { creator: true, assignee: true },
  })
}

/**
 * Create a task. Use Unchecked input so controller/service can pass FK ids directly
 * (creatorId, assignedToId) without nested connect.
 */
export const createTask = (data: Prisma.TaskUncheckedCreateInput) =>
  prisma.task.create({
    data,
    include: { creator: true, assignee: true },
  })

/** Find a single task with relations */
export const findTask = (id: string) =>
  prisma.task.findUnique({
    where: { id },
    include: { creator: true, assignee: true },
  })

/**
 * Update a task. Unchecked input allows updating FK id fields (assignedToId, etc.)
 * Service/controller should validate fields with Zod before calling.
 */
export const updateTask = (id: string, data: Prisma.TaskUncheckedUpdateInput) =>
  prisma.task.update({
    where: { id },
    data,
    include: { creator: true, assignee: true },
  })

/** Delete a task by id */
export const deleteTask = (id: string) =>
  prisma.task.delete({ where: { id } })
