import { parentPort, workerData } from "worker_threads";
import sharp from "sharp";
import { uploadWithRetry } from "../configs/imagekit.js";

(async () => {
  try {
    const { buffer, originalname, folder } = workerData;

    // Optimize Image (ONE version only)
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 2400,
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer();

    // Upload optimized buffer to ImageKit
    const uploadRes = await uploadWithRetry({
      file: optimizedBuffer,
      fileName: originalname.replace(/\.\w+$/, ".webp"), // convert to .webp
      folder,
    });

    parentPort.postMessage({
      success: true,
      result: {
        url: uploadRes.url,
        imageId: uploadRes.fileId,
      },
    });

  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
    });
  }
})();
