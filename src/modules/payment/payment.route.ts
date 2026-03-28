import { Router } from "express";
import { PaymentController } from "./payment.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

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

export const PaymentRoutes = router;
