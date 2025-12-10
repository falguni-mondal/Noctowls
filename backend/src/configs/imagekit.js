import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
});

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
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default imagekit;