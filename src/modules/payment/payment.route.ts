import { Router } from "express";
import { PaymentController } from "./payment.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Get All Payments (with role filtering)
router.get(
  "/",
  authMiddleWare(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  PaymentController.getAllPayments
);

// Create Payment Intent for a Booking
router.post(
  "/create-payment-intent",
  authMiddleWare(UserRole.STUDENT),
  PaymentController.createPaymentIntent
);

// Stripe Webhook (No auth middleware because Stripe calls this, raw body needed)
// Note: Webhook needs express.raw() middleware at the main app level or here
router.post(
  "/webhook",
  PaymentController.handleWebhook
);

// Retrieve payment details (for authenticated users)
router.get(
  "/:transactionId",
  authMiddleWare(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  PaymentController.getPaymentDetails
);

// Fallback payment synchronization
router.post(
  "/sync",
  authMiddleWare(UserRole.STUDENT),
  PaymentController.syncPayment
);

export const PaymentRoutes = router;
