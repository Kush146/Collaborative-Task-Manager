import { prisma } from '../../../utils/prisma.js'
import { createTaskService, updateTaskService } from '../task.service.js'

jest.mock('../../../utils/prisma.js', () => {
  const mock = {
    task: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    notification: { create: jest.fn() },
  }
  return { prisma: mock }
})

describe('task.service smoke', () => {
  const io = { emit: jest.fn(), to: jest.fn().mockReturnThis() } as any

  beforeEach(() => jest.clearAllMocks())

  it('createTaskService works', async () => {
    ;(prisma.task.create as jest.Mock).mockResolvedValue({
      id: 't1',
      title: 'Task',
      description: 'Desc',
      dueDate: new Date('2030-01-01T00:00:00Z'),
      priority: 'MEDIUM',
      status: 'TODO',
      creatorId: 'u1',
      assignedToId: null,
    })

    const dto = {
      title: 'Task',
      description: 'Desc',
      dueDate: new Date('2030-01-01T00:00:00Z'),
      priority: 'MEDIUM' as const,
      status: 'TODO' as const,
    }

    const out = await createTaskService(io, 'u1', dto)
    expect(prisma.task.create).toHaveBeenCalled()
    expect(out.id).toBe('t1')
    expect(io.emit).toHaveBeenCalledWith('taskCreated', expect.any(Object))
  })

    it('updateTaskService works', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      assignedToId: 'u1',
    })

    ;(prisma.task.update as jest.Mock).mockResolvedValue({
      id: 't1',
      title: 'Updated',
      description: 'desc',
      dueDate: new Date('2030-01-02T10:00:00.000Z'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      creatorId: 'u1',
      assignedToId: 'u2',
    })

    const dto = {
      title: 'Updated',
      description: 'desc',
      // ⬇️ pass a Date, not string
      dueDate: new Date('2030-01-02T10:00:00.000Z'),
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
      assignedToId: 'u2',
    }

    const out = await updateTaskService(io, 't1', 'u1', dto)
    expect(prisma.task.findUnique).toHaveBeenCalled()
    expect(prisma.task.update).toHaveBeenCalled()
    expect(out.id).toBe('t1')
    expect(io.emit).toHaveBeenCalledWith('taskUpdated', expect.any(Object))
  })

})
