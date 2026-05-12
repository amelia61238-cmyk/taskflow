import cron from 'node-cron';
import { prisma } from '../index';
import { sendReminderEmail } from '../services/emailService';

export function startDailyReminderScheduler() {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log(`[Scheduler] Running daily reminder — ${new Date().toISOString()}`);
    await runReminderJob();
  });

  console.log('✓ Daily reminder scheduler started — runs at 9:00 AM every day');
}

export async function runReminderJob() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Get all users
    const users = await prisma.user.findMany({
      where: { emailReminders: true },
      include: {
        tasks: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] },
          },
        },
      },
    });

    for (const user of users) {
      if (user.tasks.length === 0) continue;

      const overdueTasks = user.tasks.filter(
        t => new Date(t.deadlineDate) < today
      );

      const dueTodayTasks = user.tasks.filter(t => {
        const d = new Date(t.deadlineDate);
        return d >= today && d < new Date(today.getTime() + 86400000);
      });

      const upcomingTasks = user.tasks.filter(t => {
        const d = new Date(t.deadlineDate);
        return d > new Date(today.getTime() + 86400000) && d <= sevenDaysFromNow;
      });

      // Increment reminder count
      const taskIds = [
        ...overdueTasks.map(t => t.id),
        ...dueTodayTasks.map(t => t.id),
      ];

      if (taskIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: {
            reminderCount: { increment: 1 },
            lastRemindedAt: new Date(),
          },
        });
      }

      // Send email
      try {
        await sendReminderEmail(
          user.email,
          user.name,
          overdueTasks,
          dueTodayTasks,
          upcomingTasks
        );
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
      }
    }

    console.log(`[Scheduler] Done — processed ${users.length} users`);
  } catch (err) {
    console.error('[Scheduler] Job failed:', err);
  }
}