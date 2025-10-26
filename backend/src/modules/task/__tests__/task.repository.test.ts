import { prisma } from '../../../utils/prisma.js'
import { listTasks } from '../task.repository.js'

jest.mock('../../../utils/prisma.js', () => {
  const mock = {
    task: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    auditLog: { create: jest.fn() },
    notification: { create: jest.fn() }
  }
  return { prisma: mock }
})

describe('task.repository listTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds where/orderBy correctly for filters', async () => {
    ;(prisma.task.findMany as jest.Mock).mockResolvedValue([])

    await listTasks({
      status: 'TODO',
      priority: 'LOW',
      userId: 'u1',
      createdBy: 'u2',
      overdue: true,
      sort: 'dueDateDesc'
    })

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: 'TODO',
        priority: 'LOW',
        assignedToId: 'u1',
        creatorId: 'u2',
        dueDate: expect.objectContaining({ lt: expect.any(Date) })
      }),
      orderBy: { dueDate: 'desc' },
      include: { creator: true, assignee: true }
    })
  })
})
