/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request } from "express";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";

interface MulterRequest extends Request {
  file?: any;
  files?: any;
}

interface FileWithMetadata {
  public_id: string;
  originalname: string;
}

export const deleteUploadedFilesFromGlobalErrorHandler = async (
  req: MulterRequest,
) => {
  try {
    const filesToDelete: Array<{ publicId: string; type: string }> = [];

    if (req.file && req.file?.public_id) {
      const extension = (req.file as FileWithMetadata).originalname
        .split(".")
        .pop()
        ?.toLowerCase();
      filesToDelete.push({
        publicId: req.file.public_id,
        type: extension || "image",
      });
    } else if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      // [ [{public_id : "...", originalname: "..."}] , [{}, {}]]
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file.public_id) {
              const extension = (file as FileWithMetadata).originalname
                .split(".")
                .pop()
                ?.toLowerCase();
              filesToDelete.push({
                publicId: file.public_id,
                type: extension || "image",
              });
            }
          });
        }
      });
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((file: any) => {
        if (file.public_id) {
          const extension = file.originalname.split(".").pop()?.toLowerCase();
          filesToDelete.push({
            publicId: file.public_id,
            type: extension || "image",
          });
        }
      });
    }

    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map(({ publicId, type }) =>
          deleteFileFromCloudinary(publicId, type),
        ),
      );
      console.log(
        `\nDeleted ${filesToDelete.length} uploaded file(s) from Cloudinary due to an error during request processing.\n`,
      );
    }
  } catch (error: any) {
    console.error(
      "Error deleting uploaded files from Global Error Handler",
      error,
    );
  }
};
