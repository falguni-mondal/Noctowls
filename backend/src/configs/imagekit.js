import ImageKit from "imagekit";
import crypto from "crypto";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
});

/**
 * Generate one or more unique client-side upload authentication parameter sets.
 * ImageKit requires a unique one-time `token` per file during concurrent uploads.
 */
export const generateUploadAuth = (count = 1) => {
  const safeCount = Math.min(Math.max(parseInt(count, 10) || 1, 1), 15);
  const expire = Math.floor(Date.now() / 1000) + 60 * 10; // Valid for 10 minutes

  const createSingleAuth = () => {
    const token = crypto.randomUUID();
    if (typeof imagekit.getAuthenticationParameters === "function") {
      return imagekit.getAuthenticationParameters(token, expire);
    }
    const signature = crypto
      .createHmac("sha1", process.env.IMAGEKIT_PRIVATE_KEY)
      .update(token + expire)
      .digest("hex");
    return { token, expire, signature };
  };

  const authTokens = Array.from({ length: safeCount }, () => createSingleAuth());

  return {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
    // Single-file convenience fields
    token: authTokens[0].token,
    expire: authTokens[0].expire,
    signature: authTokens[0].signature,
    // Multi-file concurrent batch array
    authTokens,
  };
};

// Retry wrapper with exponential backoff
export const uploadWithRetry = async (uploadOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await imagekit.upload({
        ...uploadOptions,
        timeout: 60000, // 60 seconds
      });
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      // Don't retry on validation errors (400, 401, 403)
      if (error.response?.status && error.response.status < 500) {
        throw error;
      }

      if (isLastAttempt) {
        throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Retry attempt ${attempt} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Delete with retry
export const deleteWithRetry = async (fileId, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await imagekit.deleteFile(fileId);
      return { success: true, fileId };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      // File already deleted or doesn't exist
      if (
        error.message?.includes("No file found") ||
        error.response?.status === 404
      ) {
        console.log(`File ${fileId} already deleted or not found, skipping`);
        return { success: true, fileId, alreadyDeleted: true };
      }

      // Don't retry on validation errors
      if (error.response?.status && error.response.status < 500) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      if (isLastAttempt) {
        throw new Error(`Delete failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Delete retry attempt ${attempt} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default imagekit;
