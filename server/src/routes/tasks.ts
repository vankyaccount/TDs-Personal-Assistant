import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// List tasks
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, quadrant, priority, dueDate } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        quadrant: quadrant || 1,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.userId!,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, quadrant, status, priority, dueDate } = req.body;
    const id = String(req.params.id);
    const task = await prisma.task.updateMany({
      where: { id, userId: req.userId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(quadrant !== undefined && { quadrant }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });
    if (task.count === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    const updated = await prisma.task.findFirst({ where: { id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.task.deleteMany({ where: { id, userId: req.userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
