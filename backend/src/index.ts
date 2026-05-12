import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import { startDailyReminderScheduler } from './scheduler/dailyReminder';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'TaskFlow API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Test email endpoint
app.post('/api/test-reminder', async (_req, res) => {
  try {
    const { runReminderJob } = await import('./scheduler/dailyReminder');
    await runReminderJob();
    res.json({ message: 'Reminder job ran successfully! Check your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run reminder job' });
  }
});

async function main() {
  await prisma.$connect();
  console.log('✓ Database connected');

  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
  });

  startDailyReminderScheduler();
}

main().catch(console.error);