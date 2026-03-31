import type { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const PaymentController = {
  createPaymentIntent: catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    if (typeof bookingId !== "string" || !bookingId.trim()) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "A valid bookingId must be provided as a string",
      });
    }

    const data = await PaymentService.createPaymentIntent(
      bookingId.trim(),
      req.user!.userId
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Stripe PaymentIntent generated successfully",
      data,
    });
  }),

  handleWebhook: catchAsync(async (req: Request, res: Response) => {
    // Stripe webhooks require the raw body mapped to signature validation.
    // The main Express app should normally parse this route with `express.raw({type: 'application/json'})`
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Missing Stripe signature header",
      });
    }

    try {
      await PaymentService.handleStripeWebhook(req.body, signature as string);
      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe Webhook Error:", error.message);
      res.status(status.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }
  }),

  getPaymentDetails: catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.params;

    if (!transactionId || typeof transactionId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "transactionId is required",
      });
    }

    const data = await PaymentService.getPaymentDetails(
      transactionId.trim(),
      req.user!.userId,
      req.user!.role
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Payment detailed successfully fetched",
      data,
    });
  }),

  syncPayment: catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    if (!bookingId || typeof bookingId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "bookingId is required",
      });
    }

    const data = await PaymentService.syncPayment(
      bookingId.trim(),
      req.user!.userId
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: data.message,
      data,
    });
  }),
  getAllPayments: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query;

    const data = await PaymentService.getAllPayments({
      userId: req.user!.userId,
      role: req.user!.role,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Payments fetched successfully",
      data: data.payments,
      meta: data.meta,
    });
  }),
};
