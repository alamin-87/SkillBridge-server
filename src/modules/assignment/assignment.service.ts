import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { sendEmail } from "../../utils/email";

export const AssignmentService = {
  createAssignment: async (
    tutorId: string,
    title: string,
    description: string | undefined,
    bookingId?: string,
    files?: Express.Multer.File[]
  ) => {
    let studentIdToNotify: string | null = null;
    let studentEmailToNotify: string | null = null;
    let studentNameToNotify: string | null = null;

    // Optionally link to booking
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { student: { select: { id: true, email: true, name: true } } }
      });
      if (!booking) {
        throw new AppError(status.NOT_FOUND, "Associated booking not found");
      }
      studentIdToNotify = booking.studentId;
      studentEmailToNotify = booking.student.email;
      studentNameToNotify = booking.student.name;
    }

    // Process files if any
    const filePayloads = files?.map((file: any) => ({
      url: file.path || file.url,
      publicId: file.filename || file.public_id,
      type: file.mimetype,
      name: file.originalname,
    }));

    const createdAssignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        files: filePayloads ? (filePayloads as any) : null,
        createdById: tutorId,
        bookingId: bookingId || null,
        status: "PENDING",
      },
    });

    // Fire assignment notification
    if (studentIdToNotify) {
      await prisma.notification.create({
        data: {
          userId: studentIdToNotify,
          title: "New Assignment Received",
          message: `Your tutor has posted a new task: ${title}. ${filePayloads ? "Reference PDFs attached." : ""}`,
          type: "ASSIGNMENT"
        }
      });

      if (studentEmailToNotify) {
        await sendEmail({
          to: studentEmailToNotify,
          subject: `New Assignment: ${title} - SkillBridge`,
          templateName: "assignment",
          templateData: {
            recipientName: studentNameToNotify || "Student",
            title: "New Assignment Received",
            message: `Your tutor has uploaded a new assignment with attached resources.`,
            assignmentTitle: title,
            files: filePayloads || [],
            dashboardUrl: `${envVars.FRONTEND_URL}/dashboard/assignments`,
          }
        }).catch(console.error);
      }
    }

    return createdAssignment;
  },

  getAllAssignments: async (userId: string, role: string | undefined) => {
    if (role === "ADMIN") {
      return prisma.assignment.findMany({
        include: {
          createdBy: { select: { name: true, email: true } },
          submissions: { select: { id: true, status: true, grade: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (role === "TUTOR") {
      return prisma.assignment.findMany({
        where: { createdById: userId },
        include: {
          submissions: { 
            include: {
              student: { select: { id: true, name: true, email: true, image: true } }
            },
            orderBy: { createdAt: "desc" }
          },
          booking: { include: { student: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // STUDENT: Find assignments tied to their bookings, or public assignments targeting globally
    return prisma.assignment.findMany({
      where: {
        OR: [
          { booking: { studentId: userId } },
          // Includes assignments without bounded booking globally distributed locally natively
          { bookingId: null },
        ],
      },
      include: {
        createdBy: { select: { name: true, email: true, image: true } },
        submissions: {
          where: { studentId: userId },
          // Include essential submission fields for student audit
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getAssignmentDetails: async (
    assignmentId: string,
    userId: string,
    role: string | undefined
  ) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        createdBy: { select: { name: true, email: true, image: true } },
        booking: {
          include: { student: { select: { id: true, name: true, email: true } } },
        },
        submissions: {
          include: {
            student: { select: { id: true, name: true, email: true, image: true } },
            gradedBy: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!assignment) {
      throw new AppError(status.NOT_FOUND, "Target assignment could not be fetched globally");
    }

    // If student, filter out other student's submissions for privacy
    if (role === "STUDENT") {
      assignment.submissions = assignment.submissions.filter(
        (sub) => sub.studentId === userId
      );
    }

    return assignment;
  },

  submitAssignment: async (
    assignmentId: string,
    studentId: string,
    files: Express.Multer.File[]
  ) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        booking: true,
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });

    if (!assignment) {
      throw new AppError(status.NOT_FOUND, "Assignment not found");
    }

    // Ensure student legitimately accesses bounded bookings
    if (assignment.booking && assignment.booking.studentId !== studentId) {
      throw new AppError(
        status.FORBIDDEN,
        "You are not authorized to submit to this assignment."
      );
    }

    // Get student info for email
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true },
    });

    // Process cloud storage URL mappings
    const filePayloads = files.map((file: any) => ({
      url: file.path || file.url,
      publicId: file.filename || file.public_id,
      type: file.mimetype,
      size: file.size,
      name: file.originalname,
    }));

    // Create the submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        files: filePayloads as any,
        status: "SUBMITTED",
      },
    });

    // Update parent assignment status
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: "SUBMITTED" },
    });

    // Create in-app notification for tutor
    await prisma.notification.create({
      data: {
        userId: assignment.createdById,
        title: "Assignment Submitted",
        message: `${student?.name || "A student"} has submitted an answer for: ${assignment.title}`,
        type: "ASSIGNMENT",
      },
    });

    // 🔥 Send email to tutor with student's submitted resource files
    if (assignment.createdBy?.email) {
      await sendEmail({
        to: assignment.createdBy.email,
        subject: `Assignment Submitted: ${assignment.title} - SkillBridge`,
        templateName: "assignment",
        templateData: {
          recipientName: assignment.createdBy.name || "Tutor",
          title: "Student Assignment Submission",
          message: `${student?.name || "A student"} has submitted their answer for your assignment. You can review the attached resources and grade the submission from your dashboard.`,
          assignmentTitle: assignment.title,
          studentName: student?.name || "Student",
          files: filePayloads || [],
          dashboardUrl: `${envVars.FRONTEND_URL}/tutor/dashboard/assignments`,
        }
      }).catch(console.error);
    }

    return submission;
  },

  evaluateSubmission: async (
    assignmentId: string,
    submissionId: string,
    tutorId: string,
    grade: number,
    feedback?: string,
    reportFile?: Express.Multer.File
  ) => {
    // Transactional evaluation binding
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new AppError(status.NOT_FOUND, "Parent Assignment structurally missing");
      }

      // 🔥 Security: Only owner can evaluate
      if (assignment.createdById !== tutorId) {
        throw new AppError(status.FORBIDDEN, "Only the creating tutor can evaluate this task.");
      }

      const submission = await tx.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: { student: { select: { id: true, email: true, name: true } } }
      });

      if (!submission) {
        throw new AppError(status.NOT_FOUND, "Target answersheet missing");
      }

      let reportData = null;
      if (reportFile) {
        const fileObj = reportFile as any;
        reportData = {
          url: fileObj.path || fileObj.url,
          publicId: fileObj.filename || fileObj.public_id,
          type: fileObj.mimetype,
          size: fileObj.size,
          name: fileObj.originalname,
        };
      }

      // Execute evaluation updates
      const evaluated = await tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          grade,
          feedback: feedback || null,
          gradedById: tutorId,
          status: "GRADED",
          evaluationReport: reportData ? (reportData as any) : null,
        },
      });

      // Synchronize parent assignment dynamically mapping completion
      await tx.assignment.update({
        where: { id: assignmentId },
        data: { status: "GRADED" },
      });

      await tx.notification.create({
        data: {
          userId: submission.studentId,
          title: "Assignment Evaluated",
          message: `Your assignment has been graded. Score: ${grade}. ${reportData ? "Detailed PDF report attached." : ""}`,
          type: "ASSIGNMENT",
        },
      });

      if (submission.student.email) {
        await sendEmail({
          to: submission.student.email,
          subject: `Assignment Evaluated: ${assignment.title} - SkillBridge`,
          templateName: "assignment",
          templateData: {
            recipientName: submission.student.name || "Student",
            title: "Evaluation Complete",
            message: `Your assignment has been graded. You can view the evaluation report from your dashboard.`,
            assignmentTitle: assignment.title,
            grade: grade,
            files: reportData ? [reportData] : [],
            dashboardUrl: `${envVars.FRONTEND_URL}/dashboard/assignments`,
          }
        }).catch(console.error);
      }

      return evaluated;
    });
  },

  deleteAssignment: async (assignmentId: string, tutorId: string) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new AppError(status.NOT_FOUND, "Assignment not found");
    }

    if (assignment.createdById !== tutorId) {
      throw new AppError(status.FORBIDDEN, "You are not authorized to delete this assignment.");
    }

    // Delete the assignment
    const result = await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    // If bound to a booking, notify the student
    if (assignment.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: assignment.bookingId },
      });
      if (booking) {
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            title: "Assignment Removed",
            message: `Your tutor has removed the assignment: ${assignment.title}.`,
            type: "ASSIGNMENT",
          },
        }).catch(() => {});
      }
    }

    return result;
  },
};
