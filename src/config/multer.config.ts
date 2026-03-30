// middlewares/multerUpload.ts
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "./cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    const folder = extension === "pdf" ? "assignments" : "images";
    return {
      folder: `SkillBridge/${folder}`,
      resource_type: extension === "pdf" ? "raw" : "auto",
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

export const multerUpload = multer({ storage });

const memoryStorage = multer.memoryStorage();
export const multerMemoryUpload = multer({ storage: memoryStorage });