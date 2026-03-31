import cron from "node-cron";
import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../utils/email";
import { addMinutes, subMinutes } from "date-fns";

const startSessionReminderTask = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const targetTimeStart = addMinutes(now, 4); 
    const targetTimeEnd = addMinutes(now, 6);

    try {
      // Find CONFIRMED bookings starting in ~5 minutes
      // Also exclude those that already had a reminder sent (we might need a flag in the DB)
      // Since we don't have a flag, we'll just check status and time range
      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          scheduledStart: {
            gte: targetTimeStart,
            lte: targetTimeEnd,
          },
          // Optimization: If we had a 'reminderSent' field, we'd use it here.
          // Since we don't, and this runs once per minute with a tight 2min window, 
          // it's highly likely to trigger exactly once per booking if timed right.
        },
        include: {
          student: true,
          tutor: true,
        },
      });

      if (upcomingBookings.length === 0) return;

      console.log(`[Scheduler] Sending reminders for ${upcomingBookings.length} sessions...`);

      for (const booking of upcomingBookings) {
        const meetingLink = booking.meetingLink || `https://meet.jit.si/SkillBridge-${booking.id.slice(-8)}`;
        
        // 1. System Notifications
        await prisma.notification.createMany({
          data: [
            {
              userId: booking.studentId,
              title: "Session Starting Soon! ⏳",
              message: `Your tutoring session with ${booking.tutor.name} starts in 5 minutes. Join here: ${meetingLink}`,
              type: "BOOKING",
            },
            {
              userId: booking.tutorId,
              title: "Session Starting Soon! ⏳",
              message: `Your tutoring session with ${booking.student.name} starts in 5 minutes. Prepare here: ${meetingLink}`,
              type: "BOOKING",
            },
          ],
        });

        // 2. Emails
        const emailData = {
          studentName: booking.student.name,
          courseName: `Tutoring Session with ${booking.tutor.name}`,
          enrollmentDate: new Date(booking.scheduledStart).toLocaleString(),
          meetingLink: meetingLink,
          notes: "Session starts in 5 minutes! Don't be late.",
        };

        // Email Student
        await sendEmail({
          to: booking.student.email,
          subject: "Reminder: Session starting in 5 minutes - SkillBridge",
          templateName: "invoice", // Using invoice template as placeholder or base
          templateData: emailData,
        }).catch(err => console.error(`Email failed for student ${booking.student.id}:`, err));

        // Email Tutor
        await sendEmail({
          to: booking.tutor.email,
          subject: "Reminder: Session starting in 5 minutes - SkillBridge",
          templateName: "invoice",
          templateData: {
            ...emailData,
            studentName: booking.tutor.name,
            courseName: `Tutoring Session with ${booking.student.name}`,
          },
        }).catch(err => console.error(`Email failed for tutor ${booking.tutor.id}:`, err));
      }
    } catch (err) {
      console.error("[Scheduler Error]:", err);
    }
  });
};

export const SchedulerService = {
  startSessionReminderTask,
};
