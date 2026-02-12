import sharp from "sharp";
import { uploadWithRetry, deleteWithRetry } from "../configs/imagekit.js";

// Process and Upload a Single Image
export const processAndUploadImage = async (file, folder) => {
  try {
    const transform = sharp()
      .resize({ width: 2400, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 });

    const uploadRes = await uploadWithRetry({
      file: file.stream.pipe(transform),
      fileName: file.originalname.replace(/\.\w+$/, ".webp"),
      folder,
    });

    return {
      success: true,
      url: uploadRes.url,
      imageId: uploadRes.fileId,
      alt: file.originalname,
    };
  } catch (err) {
    console.error(`Error processing ${file.originalname}`, err);
    throw err;
  }
};

// Cleanup Helper: Deletes a list of uploaded images
export const cleanupUploadedImages = async (images = []) => {
  if (images.length === 0) return;
  
  console.log("Rolling back: Deleting orphaned images...");
  const deletePromises = images.map((img) => deleteWithRetry(img.imageId));
  await Promise.allSettled(deletePromises);
};