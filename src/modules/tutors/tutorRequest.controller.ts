import type { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TutorService } from "./tutorRequest.service";

// ─── Create Tutor (Admin only) ───────────────────────────────────────────────
const createTutor = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.createTutor(req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Tutor created successfully",
    data: result,
  });
});

// ─── Request to become Tutor (Logged-in user) ───────────────────────────────
const requestToBecomeTutor = catchAsync(async (req: Request, res: Response) => {
  // userId comes from auth middleware (req.user)
  const userId = (req as any).user?.userId;
  const result = await TutorService.requestToBecomeTutor(userId, req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Tutor request submitted successfully",
    data: result,
  });
});

// ─── Get My Tutor Request (Student) ─────────────────────────────────────────
const getMyTutorRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const result = await TutorService.getMyTutorRequest(userId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Your tutor request fetched successfully",
    data: result,
  });
});

// ─── Get All Tutor Requests (Admin) ─────────────────────────────────────────
const getAllTutorRequests = catchAsync(async (_req: Request, res: Response) => {
  const result = await TutorService.getAllTutorRequests();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor requests fetched successfully",
    data: result,
  });
});

// ─── Get Pending Tutor Requests (Admin) ─────────────────────────────────────
const getPendingTutorRequests = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await TutorService.getPendingTutorRequests();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Pending tutor requests fetched successfully",
      data: result,
    });
  },
);

// ─── Approve Tutor Request (Admin) ──────────────────────────────────────────
const approveTutorRequest = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.id as string;
  const result = await TutorService.approveTutorRequest(requestId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor request approved successfully. Welcome email sent.",
    data: result,
  });
});

// ─── Reject Tutor Request (Admin) ───────────────────────────────────────────
const rejectTutorRequest = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.id as string;
  const result = await TutorService.rejectTutorRequest(
    requestId,
    req.body.rejectionReason,
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor request rejected. Notification email sent.",
    data: result,
  });
});

// ─── Update Tutor Profile (Tutor only) ──────────────────────────────────────
const updateTutorProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const files = (req as any).files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const profileImageFile = files?.profileImage?.[0];

  const result = await TutorService.updateTutorProfile(
    userId,
    req.body,
    profileImageFile,
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor profile updated successfully",
    data: result,
  });
});
const cancelTutorRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const result = await TutorService.cancelTutorRequest(userId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor request cancelled successfully",
    data: result,
  });
});
const updateMyTutorRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const result = await TutorService.updateMyTutorRequest(userId, req.body);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor request updated successfully",
    data: result,
  });
});
export const TutorRequestController = {
  createTutor,
  requestToBecomeTutor,
  getMyTutorRequest,
  getAllTutorRequests,
  getPendingTutorRequests,
  approveTutorRequest,
  rejectTutorRequest,
  updateTutorProfile,
  cancelTutorRequest,
  updateMyTutorRequest,
};
