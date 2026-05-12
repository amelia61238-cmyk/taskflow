import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const router = Router();

// Middleware to get user from token
function getUser(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

// GET ALL TASKS
router.get('/', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Auto mark overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.task.updateMany({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deadlineDate: { lt: today },
      },
      data: { status: 'OVERDUE' },
    });

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { deadlineDate: 'asc' },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET STATS
router.get('/stats', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'PENDING' } }),
      prisma.task.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { userId, status: 'OVERDUE' } }),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    res.json({ total, pending, inProgress, completed, overdue, completionRate });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE TASK
router.post('/', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const {
      title, description, priority, status,
      deadlineDate, reminderTime, category, tags, recurring,
    } = req.body;

    if (!title || !deadlineDate) {
      return res.status(400).json({ error: 'Title and deadline required' });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        deadlineDate: new Date(deadlineDate),
        reminderTime,
        category,
        tags: tags || [],
        recurring: recurring || 'NONE',
      },
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE TASK
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const {
      title, description, priority, status,
      deadlineDate, reminderTime, category, tags, recurring,
    } = req.body;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(deadlineDate !== undefined && { deadlineDate: new Date(deadlineDate) }),
        ...(reminderTime !== undefined && { reminderTime }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(recurring !== undefined && { recurring }),
        ...(status === 'COMPLETED' && { completedAt: new Date(), reminderCount: 0 }),
      },
    });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE TASK
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;