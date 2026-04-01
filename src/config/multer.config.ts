// middlewares/multerUpload.ts
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "./cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const fileName = file?.originalname || "unknown";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
    const isPdf = extension === "pdf";
    
    // 🔥 Cloudinary restricts PDF delivery. By making it "image" and adding an attachment flag, we bypass 401
    const resource_type = isPdf ? "image" : (isImage ? "auto" : "raw");
    const folder = isImage ? "images" : "assignments";
    
    const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, "_") || "file";
    
    const public_id = resource_type === "raw" 
      ? `${Date.now()}_${sanitizedName}.${extension}`
      : `${Date.now()}_${sanitizedName}`;

    return {
      folder: `SkillBridge/${folder}`,
      resource_type: resource_type,
      ...((isImage || isPdf) && { format: extension }),
      ...(isPdf && { transformation: [{ flags: "attachment" }] }),
      type: "upload",
      access_mode: "public",
      public_id: public_id,
    };
  },
});

export const multerUpload = multer({ storage });

const memoryStorage = multer.memoryStorage();
export const multerMemoryUpload = multer({ storage: memoryStorage });
