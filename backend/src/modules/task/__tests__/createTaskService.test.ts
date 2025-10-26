// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Plain mock for prisma
jest.mock('../../../utils/prisma.js', () => ({
  prisma: {
    task: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    auditLog: { create: jest.fn(), createMany: jest.fn() },
    notification: { create: jest.fn() },
  },
}))

const { prisma } = require('../../../utils/prisma.js')
const { createTaskService } = require('../task.service.js')


describe('createTaskService', () => {
  const io = { emit: jest.fn() } as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a task and emits "taskCreated"', async () => {
    const dto = {
      title: 'Design API',
      description: 'Define routes',
      dueDate: '2030-01-01T10:00:00.000Z',
      priority: 'MEDIUM',
      status: 'TODO',
    }

    ;(prisma.task.create as any).mockResolvedValue({
      id: 'task_1',
      ...dto,
      dueDate: new Date(dto.dueDate),
      creatorId: 'u1',
      assignedToId: null,
    })

    const out = await createTaskService(io, 'u1', dto)

    expect(prisma.task.create).toHaveBeenCalled() // simple & robust
    expect(out.id).toBe('task_1')
    expect(io.emit).toHaveBeenCalledWith('taskCreated', expect.any(Object))
  })
})
