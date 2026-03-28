import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";
import type Stripe from "stripe";

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
    currency: "usd", // Modify dynamically if platform scales internationally
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

      await prisma.$transaction(async (tx) => {
        // Evaluate the payment block internally
        const payment = await tx.payment.findUnique({
          where: { id: internalPaymentId },
          include: { booking: true },
        });

        if (!payment || payment.status === "SUCCESS") return;

        // Upgrade locally recorded payment node globally
        await tx.payment.update({
          where: { id: internalPaymentId },
          data: {
            status: "SUCCESS",
          },
        });

        // Mutate parent booking natively signifying full transaction receipt
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: "PAID",
          },
        });

        // Inject the payment success metric calculating securely dynamically up to the Tutor Profile logically
        await tx.tutorProfile.update({
          where: { id: payment.booking.tutorProfileId },
          data: {
            totalEarnings: {
              increment: payment.amount,
            },
          },
        });
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = failedIntent.metadata.internalPaymentId;

      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });
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

export const PaymentService = {
  createPaymentIntent,
  handleStripeWebhook,
  getPaymentDetails,
};
