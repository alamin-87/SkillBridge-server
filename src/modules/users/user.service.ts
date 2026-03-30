import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import status from "http-status";

// ✅ UPDATE USER (SELF ONLY)
const updateUser = async (
  userId: string,
  payload: any,
  file?: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  let profilePhotoData = {};

  // 📸 If file exists → upload via buffer (since we switched to multerMemoryUpload)
  if (file) {
    const uploaded = await uploadFileToCloudinary(
      file.buffer,
      file.originalname,
      "SkillBridge"
    );

    // 🧹 delete old image (if exists) - extract publicId from URL if needed
    if (user.image && user.image.includes("cloudinary.com")) {
      try {
        // Try to extract publicId from the URL and delete
        const urlParts = user.image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          const publicId = fileName.split(".")[0];
          // Since our uploadFileToCloudinary sets the prefix
          if (publicId) {
            await deleteFileFromCloudinary(`SkillBridge/images/${publicId}`, "image");
          }
        }
      } catch (err) {
        // If extraction fails, just continue without deletion
      }
    }

    profilePhotoData = {
      image: uploaded.url,
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
      ...profilePhotoData,
    },
  });

  return updatedUser;
};

// ✅ GET USER BY ID
const getById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user;
};

// ❌ DELETE USER (SOFT DELETE)
const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return result;
};

export const UserService = {
  getById,
  updateUser,
  deleteUser,
};