import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";
import type Stripe from "stripe";
import { sendEmail } from "../../utils/email";

// Helper function to process fully confirmed payments
const processSuccessfulPayment = async (internalPaymentId: string, bookingId: string, amount: number) => {
  // Generate a Google Meet style link format (xxx-xxxx-xxx)
  const meetCode = `${bookingId.slice(0, 3)}-${bookingId.slice(3, 7)}-${bookingId.slice(7, 10)}`;
  const meetingLink = `https://meet.google.com/${meetCode.toLowerCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch full details including users for emailing
    const payment = await tx.payment.findUnique({
      where: { id: internalPaymentId },
      include: {
        booking: {
          include: { student: true, tutor: true },
        },
      },
    });

    if (!payment || payment.status === "SUCCESS") return null;

    // 2. Upgrade locally recorded payment node globally
    await tx.payment.update({
      where: { id: internalPaymentId },
      data: { status: "SUCCESS" },
    });

    // 3. Mutate parent booking natively signifying full transaction receipt
    await tx.booking.update({
      where: { id: bookingId },
      data: { 
        paymentStatus: "PAID", 
        status: "CONFIRMED",
        meetingLink: meetingLink // 🔥 Inject instant meeting link
      },
    });

    // 4. Inject the payment success metric up to the Tutor Profile
    if (payment.booking.tutorProfileId) {
      await tx.tutorProfile.update({
        where: { id: payment.booking.tutorProfileId },
        data: { totalEarnings: { increment: amount } },
      });
    }

    // 5. System Notifications
    await tx.notification.createMany({
      data: [
        {
          userId: payment.userId,
          title: "Payment Successful ✅",
          message: `Your payment of ৳${amount} has been processed. Your session is now fully confirmed! Meeting: ${meetingLink}`,
          type: "PAYMENT",
        },
        {
          userId: payment.booking.tutorId,
          title: "Student Payment Received",
          message: `A student has completed payment. The session is now fully confirmed. Meeting: ${meetingLink}`,
          type: "PAYMENT",
        },
      ],
    });

    return payment;
  });

  // 6. Send Emails (Non-blocking outside of transaction)
  if (result && result.booking) {
    const booking = result.booking;
    const student = booking.student;
    const tutor = booking.tutor;
    
    const invoiceData = {
      studentName: student.name,
      invoiceId: result.id,
      transactionId: result.transactionId || "N/A",
      paymentDate: new Date().toLocaleDateString(),
      courseName: `1-on-1 Tutoring Session with ${tutor.name}`,
      enrollmentDate: new Date(booking.createdAt).toLocaleDateString(),
      amount: amount,
      meetingLink: meetingLink, // 🔥 Send link in email
    };

    // Send Invoice to Student
    await sendEmail({
      to: student.email,
      subject: "Payment Invoice & Session Confirmation - SkillBridge",
      templateName: "invoice",
      templateData: {
        ...invoiceData
      },
    }).catch(console.error);

    // Send Notification to Tutor
    await sendEmail({
      to: tutor.email,
      subject: "New Session Confirmed - SkillBridge",
      templateName: "invoice",
      templateData: {
        ...invoiceData,
        studentName: tutor.name,
        courseName: `1-on-1 Tutoring Session booked by ${student.name}`,
        isTutor: true
      },
    }).catch(console.error);

    // Send Dedicated Google Meet Link to Student
    await sendEmail({
      to: student.email,
      subject: "Your Session Meeting Link - SkillBridge",
      templateName: "sessionLink",
      templateData: {
        userName: student.name,
        courseName: `1-on-1 Tutoring Session`,
        partnerName: tutor.name,
        meetingLink: meetingLink,
      },
    }).catch(console.error);

    // Send Dedicated Google Meet Link to Tutor
    await sendEmail({
      to: tutor.email,
      subject: "Your Session Meeting Link (Student Booked) - SkillBridge",
      templateName: "sessionLink",
      templateData: {
        userName: tutor.name,
        courseName: `1-on-1 Tutoring Session`,
        partnerName: student.name,
        meetingLink: meetingLink,
      },
    }).catch(console.error);
  }

  return result;
};

const createPaymentIntent = async (bookingId: string, studentId: string) => {
  // Validate booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: { select: { id: true, email: true, name: true } },
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Target booking could not be tracked");
  }

  // Ensure security checking student
  if (booking.studentId !== studentId) {
    throw new AppError(
      status.FORBIDDEN,
      "Unauthorized interaction attempting payment flow outside of native account"
    );
  }

  // Prevent double payments logically mapped
  if (booking.paymentStatus === "PAID") {
    throw new AppError(
      status.BAD_REQUEST,
      "Requested booking has already achieved a fully verified payment settlement"
    );
  }

  // Create or identify an INITIATED payment record internally first to track attempting events
  let paymentRecord = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (!paymentRecord) {
    paymentRecord = await prisma.payment.create({
      data: {
        userId: studentId,
        bookingId,
        amount: booking.price,
        provider: "STRIPE",
        status: "INITIATED",
      },
    });
  } else if (paymentRecord.status === "SUCCESS") {
    throw new AppError(
      status.BAD_REQUEST,
      "Payment record strictly listed as succeeded. Double-checkout avoided."
    );
  }

  // Convert logical amount (usually float dollars) to atomic cents correctly for Stripe
  // e.g., 50.50 -> 5050
  const paymentAmountCents = Math.round(booking.price * 100);

  // Generate Stripe Intent passing vital tracking Metadata identifiers
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentAmountCents,
    currency: "bdt", // Set to BDT for Bangladesh region compatibility
    payment_method_types: ["card"],
    receipt_email: booking.student.email,
    metadata: {
      bookingId: booking.id,
      studentId: booking.student.id,
      internalPaymentId: paymentRecord.id,
    },
  });

  // Stamp intent identification locally to re-identify Webhooks asynchronously
  await prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      transactionId: paymentIntent.id,
    },
  });

  // Expose Secret allowing frontend elements to securely tokenize standard CC structures
  return {
    clientSecret: paymentIntent.client_secret,
    transactionId: paymentIntent.id,
    amount: booking.price,
  };
};

const handleStripeWebhook = async (rawBody: Buffer | string, signature: string) => {
  const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Stripe Webhook config key missing");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    throw new AppError(status.BAD_REQUEST, `Webhook Signature Verification Failed: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Extract explicitly passed ids injected via the generation stage
      const bookingId = paymentIntent.metadata.bookingId;
      const internalPaymentId = paymentIntent.metadata.internalPaymentId;

      if (!bookingId || !internalPaymentId) {
        console.error("Webhook lacked critical identifying booking keys", paymentIntent.id);
        break; // Ignore malformed unsupported Stripe events mapping externally
      }

      const payment = await prisma.payment.findUnique({
        where: { id: internalPaymentId },
      });

      if (!payment || payment.status === "SUCCESS") break;

      await processSuccessfulPayment(internalPaymentId, bookingId, payment.amount);

      break;
    }

    case "payment_intent.payment_failed": {
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = failedIntent.metadata.internalPaymentId;
      const studentId = failedIntent.metadata.studentId;

      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });

        if (studentId) {
          await prisma.notification.create({
            data: {
              userId: studentId,
              title: "Payment Failed",
              message: "Your recent payment attempt failed to process. Please verify your card details.",
              type: "PAYMENT",
            },
          });
        }
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe generic event executed internally: ${event.type}`);
  }
};

const getPaymentDetails = async (transactionId: string, userId: string, role: string | undefined) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: {
      booking: {
        include: {
          student: { select: { name: true, email: true } },
          tutor: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Stripe transaction not tracked locally internally yet.");
  }

  // Validate accessibility restrictions dynamically
  if (
    role !== "ADMIN" &&
    payment.booking.studentId !== userId &&
    payment.booking.tutorId !== userId
  ) {
    throw new AppError(status.FORBIDDEN, "Unauthorized reading access.");
  }

  return payment;
};

const syncPayment = async (bookingId: string, studentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    include: { booking: true },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "No payment record found for this booking.");
  }

  if (payment.userId !== studentId) {
    throw new AppError(status.FORBIDDEN, "Unauthorized sync attempt.");
  }

  if (payment.status === "SUCCESS") {
    return { status: "SUCCESS", message: "Already synced." };
  }

  if (!payment.transactionId) {
    return { status: "INITIATED", message: "No transaction tracked yet." };
  }

  // Fetch the latest state directly from Stripe using the stored intent ID
  const intent = await stripe.paymentIntents.retrieve(payment.transactionId);

  if (intent.status === "succeeded") {
    await processSuccessfulPayment(payment.id, bookingId, payment.amount);
    
    return { status: "SUCCESS", message: "Successfully synced from Stripe." };
  }

  return { status: intent.status, message: "Checked intent state." };
};

const getAllPayments = async (params: { 
  userId: string; 
  role: string; 
  page?: number; 
  limit?: number; 
}) => {
  const { userId, role, page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  let where: any = {};

  if (role === "STUDENT") {
    where = { userId };
  } else if (role === "TUTOR") {
    // Tutors see payments related to their bookings through the relationship
    where = {
      booking: {
        tutorId: userId,
      },
    };
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            student: { select: { name: true, email: true } },
            tutor: { select: { id: true, name: true, email: true } },
            tutorProfile: { select: { id: true, profileImage: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const PaymentService = {
  createPaymentIntent,
  handleStripeWebhook,
  getPaymentDetails,
  syncPayment,
  getAllPayments,
};
