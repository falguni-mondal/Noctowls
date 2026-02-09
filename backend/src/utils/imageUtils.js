import sharp from "sharp";
import { uploadWithRetry, deleteWithRetry } from "../configs/imagekit.js";

// Process and Upload a Single Image
export const processAndUploadImage = async (file, folder) => {
  try {
    // 1. Optimize Image (Sharp runs in C++ threads, non-blocking)
    const optimizedBuffer = await sharp(file.buffer)
      .resize({
        width: 2400,
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 4, // Reduced from 5 to 4 for speed trade-off (imperceptible quality diff)
        smartSubsample: true,
      })
      .toBuffer();

    // 2. Upload to ImageKit
    const uploadRes = await uploadWithRetry({
      file: optimizedBuffer,
      fileName: file.originalname.replace(/\.\w+$/, ".webp"),
      folder,
    });

    return {
      success: true,
      url: uploadRes.url,
      imageId: uploadRes.fileId,
      alt: file.originalname, // Temporary alt
    };
  } catch (error) {
    console.error(`Error processing ${file.originalname}:`, error);
    throw error; // Throw so Promise.all catches it
  }
};

// Cleanup Helper: Deletes a list of uploaded images
export const cleanupUploadedImages = async (images = []) => {
  if (images.length === 0) return;
  
  console.log("Rolling back: Deleting orphaned images...");
  const deletePromises = images.map((img) => deleteWithRetry(img.imageId));
  await Promise.allSettled(deletePromises);
};