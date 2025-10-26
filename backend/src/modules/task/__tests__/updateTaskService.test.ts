import { prisma } from '../../../utils/prisma.js'
import { updateTaskService } from '../task.service.js'

jest.mock('../../../utils/prisma.js', () => {
  const mock = {
    task: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    notification: { create: jest.fn() },
  }
  return { prisma: mock }
})

describe('updateTaskService', () => {
  const io = { emit: jest.fn(), to: jest.fn().mockReturnThis() } as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

    it('updates a task and emits "taskUpdated"', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({
      id: 'task_1',
      assignedToId: 'old_user',
    })

    ;(prisma.task.update as jest.Mock).mockResolvedValue({
      id: 'task_1',
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

    const task = await updateTaskService(io, 'task_1', 'u1', dto)
    expect(prisma.task.findUnique).toHaveBeenCalled()
    expect(prisma.task.update).toHaveBeenCalled()
    expect(task.id).toBe('task_1')
    expect(io.emit).toHaveBeenCalledWith('taskUpdated', expect.any(Object))
  })

})
