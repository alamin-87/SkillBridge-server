import status from "http-status";
import { prisma } from "../../lib/prisma";
import { auth } from "../../lib/auth";
import { hashPassword } from "better-auth/crypto";
import AppError from "../../errorHelpers/AppError";
import { UserStatus, UserRole } from "../../../generated/prisma/enums";
import { sendEmail } from "../../utils/email";

const registerUser = async (payload: any) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, "Registration failed");
  }

  try {
    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        name: name || "User",
        email: email,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: false,
        isDeleted: false,
      },
      update: {
        name,
        email,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to SkillBridge! 🎉",
        message: "We're excited to have you here! Explore categories and find the perfect tutor to start your learning journey.",
        type: "SYSTEM",
      },
    }).catch(() => {});

    return { user };
  } catch (err) {
    // Clean up Better Auth user if database creation fails
    try {
      await prisma.user.delete({ where: { id: data.user.id } });
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
};

const loginUser = async (payload: any) => {
  const { email, password } = payload;

  // Sign in with Better Auth
  const data = await auth.api.signInEmail({
    body: { email, password },
  });

  if (!data.user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid credentials");
  }

  if (data.user.status === UserStatus.BANNED) {
    throw new AppError(status.FORBIDDEN, "User is blocked");
  }

  if (data.user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Ensure user exists in database and is synced
  const dbUser = await prisma.user.upsert({
    where: { id: data.user.id },
    create: {
      id: data.user.id,
      name: data.user.name || "User",
      email: data.user.email,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: data.user.emailVerified || false,
      isDeleted: false,
    },
    update: {
      lastLoginAt: new Date(),
      ...(data.user.emailVerified && { emailVerified: true }),
    },
    include: {
      tutorProfile: {
        select: { profileImage: true },
      },
    },
  });

  // ✨ Sync image if missing in User but exists in TutorProfile
  if (!dbUser.image && dbUser.role === "TUTOR" && dbUser.tutorProfile?.profileImage) {
    dbUser.image = dbUser.tutorProfile.profileImage;
    // Actually update in DB so it's persistent
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { image: dbUser.tutorProfile.profileImage },
    });
  }

  // Clean up old sessions except the latest one to prevent conflicts
  // Get all sessions for this user
  const userSessions = await prisma.session.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });

  // Delete all but the most recent session
  if (userSessions.length > 1) {
    const sessionsToDelete = userSessions.slice(1);
    await prisma.session.deleteMany({
      where: { id: { in: sessionsToDelete.map((s) => s.id) } },
    });
  }

  console.log("[LOGIN] User logged in successfully:", dbUser.email);

  return {
    ...data,
    user: dbUser, // Return the synced database user
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tutorProfile: {
        select: { profileImage: true },
      },
    },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // ✨ Sync image if missing in User but exists in TutorProfile
  if (!user.image && user.role === "TUTOR" && user.tutorProfile?.profileImage) {
    user.image = user.tutorProfile.profileImage;
  }

  return user;
};

const logoutUser = async (headers: Record<string, string>) => {
  try {
    // Get the session first to check if it exists
    const session = await auth.api.getSession({ headers });

    if (!session?.session?.id) {
      // No session found, already logged out
      return { message: "Already logged out" };
    }

    // Try to delete the session
    try {
      await auth.api.signOut({ headers });
    } catch (error: any) {
      // If session doesn't exist in DB, that's fine - user is logged out anyway
      if (error?.code === "P2025") {
        return { message: "Logged out successfully" };
      }
      throw error;
    }

    return { message: "Logged out successfully" };
  } catch (error) {
    // If we can't get session, user is likely already logged out
    return { message: "Logged out successfully" };
  }
};

const verifyEmail = async (email: string, otp: string) => {
  // Find the verification record - check all possible identifier formats
  const verification = await prisma.verification.findFirst({
    where: {
      OR: [
        { identifier: `email:${email}` },
        { identifier: email },
        { identifier: `email-verification-otp-${email}` },
      ],
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    throw new AppError(status.BAD_REQUEST, "Invalid or expired OTP");
  }

  // better-auth might store value as "123456:0" where 0 is the attempt count
  const storedOtp = verification.value.includes(":") 
    ? verification.value.split(":")[0] 
    : verification.value;

  if (storedOtp !== otp) {
    throw new AppError(status.BAD_REQUEST, "Invalid or expired OTP");
  }

  // Update user email verification status
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  // Delete used verification token
  await prisma.verification.delete({
    where: { id: verification.id },
  });

  return user;
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Check for active verification record with all possible identifier formats
  const activeVerification = await prisma.verification.findFirst({
    where: {
      OR: [
        { identifier: `email:${email}` }, 
        { identifier: email },
        { identifier: `email-verification-otp-${email}` }
      ],
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  // If active OTP exists, inform user it's still valid
  if (activeVerification) {
    const storedOtp = activeVerification.value.includes(":") 
      ? activeVerification.value.split(":")[0] 
      : activeVerification.value;

    // Resend the existing OTP
    await sendEmail({
      to: email,
      subject: "SkillBridge Email Verification OTP",
      templateName: "otp",
      templateData: { name: user.name, otp: storedOtp },
    });

    return { message: "OTP has been resent. Check your email." };
  }

  // If no active verification, generate a new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete old email verification records
  await prisma.verification.deleteMany({
    where: {
      OR: [
        { identifier: `email:${email}` }, 
        { identifier: email },
        { identifier: `email-verification-otp-${email}` }
      ],
    },
  });

  // Create new verification record
  await prisma.verification.create({
    data: {
      id: `verify_${Date.now()}_${Math.random()}`,
      identifier: `email:${email}`,
      value: otp,
      expiresAt,
    },
  });

  // Send OTP email
  await sendEmail({
    to: email,
    subject: "SkillBridge Email Verification OTP",
    templateName: "otp",
    templateData: { name: user.name, otp },
  });

  return { message: "New OTP has been sent. Check your email." };
};

const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Generate password reset OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete old reset records
  await prisma.verification.deleteMany({
    where: { identifier: `reset:${email}` },
  });

  // Store reset OTP
  await prisma.verification.create({
    data: {
      id: `reset_${Date.now()}_${Math.random()}`,
      identifier: `reset:${email}`,
      value: otp,
      expiresAt,
    },
  });

  // Send OTP email
  await sendEmail({
    to: email,
    subject: "SkillBridge Password Reset OTP",
    templateName: "otp",
    templateData: { name: user.name, otp },
  });

  return { message: "Password reset OTP sent to your email" };
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Verify reset OTP
  const verification = await prisma.verification.findFirst({
    where: {
      identifier: `reset:${email}`,
      value: otp,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    throw new AppError(status.BAD_REQUEST, "Invalid or expired OTP");
  }

  // Hash the new password using better-auth's native hasher
  const hashedPassword = await hashPassword(newPassword);

  // Update password in Account table
  await prisma.account.updateMany({
    where: { userId: user.id },
    data: { password: hashedPassword },
  });

  // Delete the verification record
  await prisma.verification.delete({
    where: { id: verification.id },
  });

  // Clear all sessions
  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Password Reset Successful",
      message: "Your password has been securely reset. If you did not authorize this, please contact support immediately.",
      type: "SYSTEM",
    },
  });
};

// GOOGLE LOGIN SUCCESS
const googleLoginSuccess = async (session: any) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    await prisma.user.create({
      data: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  }

  return session;
};

export const AuthService = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  verifyEmail,
  resendOtp,
  forgetPassword,
  resetPassword,
  googleLoginSuccess,
};