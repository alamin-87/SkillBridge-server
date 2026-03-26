// utils/cloudinaryUpload.ts
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { envVars } from "./env";
import status from "http-status";
import AppError from "../errorHelpers/AppError";

cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
});

export const uploadFileToCloudinary = async (
  buffer: Buffer,
  fileName: string,
  folderPrefix = "SkillBridge"
): Promise<{ url: string; publicId: string; type: string }> => {
  if (!buffer || !fileName) {
    throw new AppError(status.BAD_REQUEST, "File buffer and file name required");
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  const fileNameWithoutExtension = fileName
    .split(".")
    .slice(0, -1)
    .join(".")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const uniqueName =
    Math.random().toString(36).substring(2) +
    "-" +
    Date.now() +
    "-" +
    fileNameWithoutExtension;

  const folder = extension === "pdf" ? "assignments" : "images";

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: extension === "pdf" ? "raw" : "auto",
          public_id: `${folderPrefix}/${folder}/${uniqueName}`,
          folder: `${folderPrefix}/${folder}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        }
      )
      .end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id, type: extension || "file" };
};

export const deleteFileFromCloudinary = async (publicId: string, type: string) => {
  const resource_type = type === "pdf" ? "raw" : "image";
  await cloudinary.uploader.destroy(publicId, { resource_type });
};

export { cloudinary };