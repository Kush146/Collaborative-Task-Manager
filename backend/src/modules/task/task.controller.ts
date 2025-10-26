import { Router } from 'express';
import createError from 'http-errors';
import { attachUserIfPresent, requireAuth } from '../../middleware/auth.js';
// backend/src/modules/task/task.controller.ts (top of file)
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto.js'

import { listTasks, findTask, deleteTask, type ListFilters } from './task.repository.js';
import { createTaskService, updateTaskService } from './task.service.js';
import { io } from '../../server.js';

export const router = Router();
router.use(attachUserIfPresent);

// GET /tasks
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const q = TaskQueryDto.parse(req.query);
    const userId = (req as any).userId as string;

    const filters: ListFilters = {
      status: q.status,
      priority: q.priority,
      sort: q.sort ?? 'dueDateAsc',
    };
    if (q.view === 'assigned') filters.userId = userId;
    if (q.view === 'created') filters.createdBy = userId;
    if (q.view === 'overdue') filters.overdue = true;

    const tasks = await listTasks(filters);
    res.json({ tasks });
  } catch (e) {
    next(e);
  }
});

// POST /tasks
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const dto: CreateTaskDto = CreateTaskDto.parse(req.body);

    const userId =
      (req as any).userId ??
      (req as any).user?.id ??
      null;

    if (!userId) {
      return next(createError(401, 'Not authenticated'));
    }

    const task = await createTaskService(io, userId, dto);
    res.status(201).json({ task });
  } catch (e) {
    console.error('TASK_CREATE_ERROR', e);
    next(e);
  }
});

// GET /tasks/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const task = await findTask(req.params.id);
    if (!task) throw createError(404, 'Task not found');
    res.json({ task });
  } catch (e) {
    next(e);
  }
});

// PATCH /tasks/:id
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const dto: UpdateTaskDto = UpdateTaskDto.parse(req.body);

    const userId =
      (req as any).userId ??
      (req as any).user?.id ??
      null;

    if (!userId) {
      return next(createError(401, 'Not authenticated'));
    }

    const task = await updateTaskService(io, req.params.id, userId, dto);
    res.json({ task });
  } catch (e) {
    console.error('TASK_UPDATE_ERROR', e);
    next(e);
  }
});

// DELETE /tasks/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteTask(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
