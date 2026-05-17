import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendReminderEmail(
  email: string,
  userName: string,
  overdueTasks: any[],
  dueTodayTasks: any[],
  upcomingTasks: any[]
) {
  const totalPending = overdueTasks.length + dueTodayTasks.length + upcomingTasks.length;
  if (totalPending === 0) return;

  const subject =
    overdueTasks.length > 0
      ? `⚠️ You have ${overdueTasks.length} overdue task(s) — TaskFlow`
      : dueTodayTasks.length > 0
      ? `⚡ ${dueTodayTasks.length} task(s) due today — TaskFlow`
      : `📅 ${upcomingTasks.length} upcoming task(s) — TaskFlow`;

  const taskRow = (task: any, badge: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e2e">
        <div style="font-size:14px;font-weight:500;color:#f0eff8">${task.title}</div>
        <div style="font-size:12px;color:#6b6a85;margin-top:4px">
          ${badge} · Priority: ${task.priority}
          ${task.category ? `· ${task.category}` : ''}
        </div>
      </td>
    </tr>`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr><td style="background:#111118;border:1px solid #ffffff15;border-radius:16px 16px 0 0;padding:32px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#c4b9ff">TaskFlow</div>
          <div style="color:#a8a7c0;font-size:14px;margin-top:6px">Your daily task reminder</div>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="background:#111118;padding:24px 32px;border-left:1px solid #ffffff12;border-right:1px solid #ffffff12">
          <p style="color:#f0eff8;font-size:16px;margin:0 0 8px">Good morning, ${userName} 👋</p>
          <p style="color:#a8a7c0;font-size:14px;margin:0">
            You have <strong style="color:#f0eff8">${totalPending} pending task(s)</strong> that need your attention.
          </p>
        </td></tr>

        ${overdueTasks.length > 0 ? `
        <tr><td style="background:#ef444408;border:1px solid #ef444422;padding:20px 32px">
          <div style="color:#ef4444;font-size:13px;font-weight:700;margin-bottom:12px">⚠ OVERDUE</div>
          <table width="100%">
            ${overdueTasks.map(t => {
              const days = Math.floor((Date.now() - new Date(t.deadlineDate).getTime()) / 86400000);
              return taskRow(t, `${days} day(s) overdue`);
            }).join('')}
          </table>
        </td></tr>` : ''}

        ${dueTodayTasks.length > 0 ? `
        <tr><td style="background:#f59e0b08;border:1px solid #f59e0b22;padding:20px 32px">
          <div style="color:#f59e0b;font-size:13px;font-weight:700;margin-bottom:12px">⚡ DUE TODAY</div>
          <table width="100%">
            ${dueTodayTasks.map(t => taskRow(t, 'Due today')).join('')}
          </table>
        </td></tr>` : ''}

        ${upcomingTasks.length > 0 ? `
        <tr><td style="background:#111118;border:1px solid #ffffff12;padding:20px 32px">
          <div style="color:#a8a7c0;font-size:13px;font-weight:700;margin-bottom:12px">📅 UPCOMING</div>
          <table width="100%">
            ${upcomingTasks.slice(0, 5).map(t => {
              const days = Math.ceil((new Date(t.deadlineDate).getTime() - Date.now()) / 86400000);
              return taskRow(t, `${days} day(s) remaining`);
            }).join('')}
          </table>
        </td></tr>` : ''}

        <!-- CTA -->
        <tr><td style="background:#111118;border:1px solid #ffffff12;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center">
          <a href="http://localhost:3000/dashboard"
            style="display:inline-block;background:#7c6af5;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600">
            Open Dashboard →
          </a>
          <p style="color:#6b6a85;font-size:11px;margin:16px 0 0">
            Reminders will continue daily until tasks are marked complete.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });

  console.log(`✓ Reminder email sent to ${email}`);
}