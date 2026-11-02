import { upload } from "@imagekit/javascript";
import userApi from "../../configs/userAxiosConfig";

/**
 * Sanitizes product/folder names to match ImageKit folder conventions.
 */
export const sanitizeFolderName = (name) => {
  if (!name || typeof name !== "string") return "default";
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas before uploading.
 * Replaces backend `sharp` processing: caps resolution at `maxWidth` (default 2400px)
 * and converts to WebP (`quality: 0.82`), shrinking 8-10MB raw PNG/JPEGs to ~150-350KB.
 */
export const compressImageClientSide = async (
  file,
  { maxWidth = 2400, quality = 0.82 } = {}
) => {
  if (!(file instanceof File || file instanceof Blob)) {
    return file;
  }

  try {
    let bitmap;
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
    } else {
      bitmap = await new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        };
        img.src = objectUrl;
      });
    }

    const origWidth = bitmap.width;
    const origHeight = bitmap.height;

    // Do not enlarge smaller images
    const targetWidth = origWidth > maxWidth ? maxWidth : origWidth;
    const targetHeight =
      origWidth > maxWidth
        ? Math.round((origHeight * maxWidth) / origWidth)
        : origHeight;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if (typeof bitmap.close === "function") bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    if (typeof bitmap.close === "function") bitmap.close();

    const webpBlob = await new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/webp", quality)
    );

    if (!webpBlob) return file;

    const baseName = (file.name || "image").replace(/\.\w+$/, "");
    return new File([webpBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("Client-side WebP compression fallback to raw file:", err);
    return file;
  }
};

/**
 * Requests `count` unique one-time upload signature tokens from the backend in a single API call.
 */
export const fetchUploadAuthTokens = async (count = 1) => {
  const response = await userApi.get(`/imagekit/auth?count=${count}`);
  if (!response.data?.success) {
    throw new Error("Failed to get ImageKit upload credentials");
  }
  return response.data;
};

/**
 * Deletes orphaned ImageKit files via the backend cleanup endpoint
 * if a multi-file upload batch or form submission fails.
 */
export const cleanupImageKitFiles = async (imagesOrIds = []) => {
  if (!Array.isArray(imagesOrIds) || imagesOrIds.length === 0) return;

  const imageIds = imagesOrIds
    .map((item) => (typeof item === "string" ? item : item?.imageId))
    .filter(Boolean);

  if (imageIds.length === 0) return;

  try {
    await userApi.post("/imagekit/cleanup", { imageIds });
  } catch (err) {
    console.error("Failed to clean up orphaned ImageKit files:", err);
  }
};

/**
 * Uploads a single file to ImageKit using `@imagekit/javascript` with exponential backoff retry.
 * Fetches a fresh one-time token on retry attempts.
 */
const uploadSingleWithRetry = async ({
  file,
  fileName,
  folder,
  initialAuth,
  publicKey,
  maxRetries = 3,
  onFileProgress,
}) => {
  let currentAuth = initialAuth;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!currentAuth) {
        const freshAuthData = await fetchUploadAuthTokens(1);
        currentAuth = freshAuthData.authTokens?.[0] || {
          token: freshAuthData.token,
          expire: freshAuthData.expire,
          signature: freshAuthData.signature,
        };
      }

      const res = await upload({
        file,
        fileName,
        folder,
        publicKey,
        token: currentAuth.token,
        signature: currentAuth.signature,
        expire: currentAuth.expire,
        useUniqueFileName: true,
        onProgress: onFileProgress,
      });

      return {
        url: res.url,
        imageId: res.fileId,
        name: res.name,
      };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        throw new Error(
          `Failed to upload ${fileName}: ${error?.message || "Upload error"}`
        );
      }

      // Token may have been consumed; clear it so the next attempt fetches a fresh token
      currentAuth = null;
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Asynchronously optimizes and uploads multiple files to ImageKit in parallel (`Promise.all`).
 * Automatically rolls back any succeeded uploads in the batch if any file fails.
 *
 * @param {Array<File|{file: File, index?: number, alt?: string}>} items
 * @param {Object} options
 * @returns {Promise<Array<{url: string, imageId: string, alt: string, index?: number}>>}
 */
export const uploadFilesToImageKit = async (
  items = [],
  { folder = "/uploads", maxWidth = 2400, quality = 0.82, onProgress } = {}
) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Normalize items into { file, index, alt }
  const normalized = items.map((item) => {
    if (item instanceof File || item instanceof Blob) {
      return { file: item, index: undefined, alt: item.name || "" };
    }
    return {
      file: item.file,
      index: item.index,
      alt: item.alt || item.file?.name || "",
    };
  });

  // 1. Compress all images concurrently on the client (WebP + maxWidth) AND fetch batch auth tokens in parallel
  const [compressedFiles, authData] = await Promise.all([
    Promise.all(
      normalized.map((item) =>
        compressImageClientSide(item.file, { maxWidth, quality })
      )
    ),
    fetchUploadAuthTokens(normalized.length),
  ]);

  const publicKey =
    authData.publicKey || import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const authTokens = authData.authTokens || [];

  const progressMap = new Array(normalized.length).fill(0);
  const reportAggregateProgress = () => {
    if (typeof onProgress !== "function") return;
    const sum = progressMap.reduce((acc, v) => acc + v, 0);
    onProgress(Math.round(sum / normalized.length));
  };

  // 2. Upload all compressed WebP files concurrently to ImageKit
  const uploadPromises = compressedFiles.map((compressedFile, i) => {
    const fileName = (
      compressedFile.name ||
      normalized[i].file?.name ||
      `image-${i + 1}.webp`
    ).replace(/\.\w+$/, ".webp");

    return uploadSingleWithRetry({
      file: compressedFile,
      fileName,
      folder,
      initialAuth: authTokens[i],
      publicKey,
      onFileProgress: (evt) => {
        if (evt.total > 0) {
          progressMap[i] = (evt.loaded / evt.total) * 100;
          reportAggregateProgress();
        }
      },
    }).then((res) => ({
      url: res.url,
      imageId: res.imageId,
      alt: normalized[i].alt,
      ...(normalized[i].index !== undefined && { index: normalized[i].index }),
    }));
  });

  const settled = await Promise.allSettled(uploadPromises);

  const succeeded = [];
  const failedErrors = [];

  settled.forEach((outcome) => {
    if (outcome.status === "fulfilled") {
      succeeded.push(outcome.value);
    } else {
      failedErrors.push(outcome.reason?.message || "Image upload failed");
    }
  });

  // 3. Rollback any succeeded files if any file in the concurrent batch failed
  if (failedErrors.length > 0) {
    if (succeeded.length > 0) {
      await cleanupImageKitFiles(succeeded);
    }
    throw new Error(failedErrors[0]);
  }

  return succeeded;
};
