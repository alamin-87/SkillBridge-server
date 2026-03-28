import type { Request, Response } from "express";
import { AssignmentService } from "./assignment.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const AssignmentController = {
  createAssignment: catchAsync(async (req: Request, res: Response) => {
    const { title, description, bookingId } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Assignment title must be a valid string",
      });
    }

    const data = await AssignmentService.createAssignment(
      req.user!.userId,
      title,
      description,
      bookingId
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Assignment given successfully",
      data,
    });
  }),

  getAllAssignments: catchAsync(async (req: Request, res: Response) => {
    const data = await AssignmentService.getAllAssignments(
      req.user!.userId,
      req.user!.role
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Assignments retrieved successfully",
      data,
    });
  }),

  getAssignmentDetails: catchAsync(async (req: Request, res: Response) => {
    const data = await AssignmentService.getAssignmentDetails(
      req.params.id as string,
      req.user!.userId,
      req.user!.role
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Assignment details securely fetched",
      data,
    });
  }),

  submitAssignment: catchAsync(async (req: Request, res: Response) => {
    const assignmentId = req.params.id as string;

    // files array collected by multer using Cloudinary storage mappings
    const uploadedFiles = req.files as Express.Multer.File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Please upload at least one answer sheet file (PDF/Image)",
      });
    }

    const data = await AssignmentService.submitAssignment(
      assignmentId,
      req.user!.userId,
      uploadedFiles
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Student answer sheet securely submitted for evaluation",
      data,
    });
  }),

  evaluateSubmission: catchAsync(async (req: Request, res: Response) => {
    const assignmentId = req.params.assignmentId as string;
    const submissionId = req.params.submissionId as string;
    const { grade, feedback } = req.body;

    if (grade === undefined || typeof grade !== "number") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "grade must be a valid number",
      });
    }

    const data = await AssignmentService.evaluateSubmission(
      assignmentId,
      submissionId,
      req.user!.userId,
      grade,
      feedback
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Instant evaluation saved securely",
      data,
    });
  }),
};
