import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../utils/email";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { auth } from "../../lib/auth";
import type {
  ICreateTutorPayload,
  ITutorRequest,
  IUpdateTutor,
} from "./tutor.interface";

// ─── Tutor select shape (reusable) ───────────────────────────────────────────
const tutorProfileSelect = {
  id: true,
  userId: true,
  bio: true,
  hourlyRate: true,
  experienceYrs: true,
  location: true,
  languages: true,
  profileImage: true,
  avgRating: true,
  totalReviews: true,
  totalEarnings: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      image: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

// ─── Create Tutor (Admin only) ───────────────────────────────────────────────
const createTutor = async (payload: ICreateTutorPayload) => {
  // Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (userExists) {
    throw new AppError(status.CONFLICT, "A user with this email already exists");
  }

  // Create auth user
  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.email,
      password: payload.password,
      name: payload.name,
    },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tutorProfile = await tx.tutorProfile.create({
        data: {
          userId: userData.user.id,
          bio: payload.tutor.bio,
          hourlyRate: payload.tutor.hourlyRate,
          experienceYrs: payload.tutor.experienceYrs,
          location: payload.tutor.location ?? null,
          languages: payload.tutor.languages ?? null,
          profileImage: payload.tutor.profileImage ?? null,
          isApproved: true,
        },
        select: tutorProfileSelect,
      });

      // Update user role to TUTOR
      await tx.user.update({
        where: { id: userData.user.id },
        data: { role: "TUTOR" },
      });

      return tutorProfile;
    });

    return result;
  } catch (error) {
    // Rollback: delete auth user if transaction fails
    await prisma.user.delete({ where: { id: userData.user.id } }).catch(() => {});
    throw error;
  }
};

// ─── Tutor Request (Logged-in user applies to become tutor) ─────────────────
const requestToBecomeTutor = async (userId: string, payload: ITutorRequest) => {
  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Prevent duplicate pending requests
  const existingRequest = await prisma.tutorRequest.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    throw new AppError(
      status.CONFLICT,
      "You already have a pending tutor request"
    );
  }

  // Check if user is already a tutor
  const existingProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new AppError(status.CONFLICT, "You are already a tutor");
  }

  const tutorRequest = await prisma.tutorRequest.create({
    data: {
      userId,
      bio: payload.bio,
      hourlyRate: payload.hourlyRate,
      experienceYrs: payload.experienceYrs,
      location: payload.location ?? null,
      languages: payload.languages ?? null,
      status: "PENDING",
    },
    select: {
      id: true,
      userId: true,
      bio: true,
      hourlyRate: true,
      experienceYrs: true,
      location: true,
      languages: true,
      status: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return tutorRequest;
};

// ─── Approve Tutor Request (Admin only) ───────────────────────────────────────
const approveTutorRequest = async (requestId: string) => {
  const tutorRequest = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!tutorRequest) {
    throw new AppError(status.NOT_FOUND, "Tutor request not found");
  }

  if (tutorRequest.status !== "PENDING") {
    throw new AppError(
      status.BAD_REQUEST,
      "Only pending requests can be approved"
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create tutor profile
    const tutorProfile = await tx.tutorProfile.create({
      data: {
        userId: tutorRequest.userId,
        bio: tutorRequest.bio,
        hourlyRate: tutorRequest.hourlyRate,
        experienceYrs: tutorRequest.experienceYrs,
        location: tutorRequest.location ?? null,
        languages: tutorRequest.languages ?? null,
        isApproved: true,
      },
      select: tutorProfileSelect,
    });

    // Update user role to TUTOR
    await tx.user.update({
      where: { id: tutorRequest.userId },
      data: { role: "TUTOR" },
    });

    // Update request status
    await tx.tutorRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    return tutorProfile;
  });

  // 📧 Send welcome email to new tutor with template
  await sendEmail({
    to: tutorRequest.user.email,
    subject: "Welcome to SkillBridge as a Tutor! 🎉",
    templateName: "tutorApprovalEmail",
    templateData: {
      userName: tutorRequest.user.name,
      userEmail: tutorRequest.user.email,
      bio: tutorRequest.bio,
      hourlyRate: tutorRequest.hourlyRate,
      experienceYrs: tutorRequest.experienceYrs,
      location: tutorRequest.location,
      languages: tutorRequest.languages,
      dashboardUrl: `${process.env.FRONTEND_URL}/tutor/dashboard` || "https://skillbridge.com/tutor/dashboard",
    },
  });

  return result;
};

// ─── Reject Tutor Request (Admin only) ─────────────────────────────────────────
const rejectTutorRequest = async (
  requestId: string,
  rejectionReason: string
) => {
  const tutorRequest = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!tutorRequest) {
    throw new AppError(status.NOT_FOUND, "Tutor request not found");
  }

  if (tutorRequest.status !== "PENDING") {
    throw new AppError(
      status.BAD_REQUEST,
      "Only pending requests can be rejected"
    );
  }

  const updatedRequest = await prisma.tutorRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      rejectionReason,
    },
  });

  // 📧 Send rejection email with template
  await sendEmail({
    to: tutorRequest.user.email,
    subject: "Tutor Profile Application Status - SkillBridge",
    templateName: "tutorRejectionEmail",
    templateData: {
      userName: tutorRequest.user.name,
      rejectionReason: rejectionReason,
    },
  });

  return updatedRequest;
};

// ─── Get My Tutor Request (Student) ────────────────────────────────────────────
const getMyTutorRequest = async (userId: string) => {
  const request = await prisma.tutorRequest.findFirst({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return request;
};

// ─── Get All Tutor Requests (Admin) ────────────────────────────────────────────
const getAllTutorRequests = async () => {
  return prisma.tutorRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

// ─── Get Pending Tutor Requests (Admin) ────────────────────────────────────────
const getPendingTutorRequests = async () => {
  return prisma.tutorRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

// ─── Update Tutor Profile (Tutor only) ──────────────────────────────────────────
const updateTutorProfile = async (
  userId: string,
  payload: IUpdateTutor,
  file?: Express.Multer.File
) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!tutorProfile) {
    throw new AppError(status.NOT_FOUND, "Tutor profile not found");
  }

  let profileImageData = {};

  // 📸 If file exists → upload to Cloudinary
  if (file) {
    const uploaded = await uploadFileToCloudinary(
      file.buffer,
      file.originalname
    );

    // 🧹 delete old image (if exists) - extract publicId from URL if needed
    if (tutorProfile.profileImage) {
      try {
        // Try to extract publicId from the URL and delete
        const urlParts = tutorProfile.profileImage.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          const publicId = fileName.split(".")[0];
          if (publicId) {
            await deleteFileFromCloudinary(publicId, "image");
          }
        }
      } catch (err) {
        // If extraction fails, just continue without deletion
      }
    }

    profileImageData = {
      profileImage: uploaded.url,
    };
  }

  const updatedProfile = await prisma.tutorProfile.update({
    where: { userId },
    data: {
      ...payload,
      ...profileImageData,
    },
    select: tutorProfileSelect,
  });

  return updatedProfile;
};

export const TutorService = {
  createTutor,
  requestToBecomeTutor,
  approveTutorRequest,
  rejectTutorRequest,
  getMyTutorRequest,
  getAllTutorRequests,
  getPendingTutorRequests,
  updateTutorProfile,
};
