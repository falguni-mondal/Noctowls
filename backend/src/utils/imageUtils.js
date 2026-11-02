import { deleteWithRetry } from "../configs/imagekit.js";

/**
 * Validates that an image metadata object sent from the frontend
 * has a valid ImageKit URL and fileId (`imageId`).
 */
export const isValidImageKitAsset = (img) => {
  if (!img || typeof img !== "object") return false;
  const { url, imageId } = img;
  if (!url || typeof url !== "string" || !imageId || typeof imageId !== "string") {
    return false;
  }

  const trimmedUrl = url.trim();
  const endpoint = process.env.IMAGEKIT_ENDPOINT?.replace(/\/+$/, "");

  const isAllowedDomain =
    (endpoint && trimmedUrl.startsWith(endpoint)) ||
    trimmedUrl.startsWith("https://ik.imagekit.io/");

  return isAllowedDomain && imageId.trim().length > 0;
};

/**
 * Cleanup Helper: Deletes a list of uploaded images from ImageKit.
 * Accepts either `{ imageId }` objects or raw `imageId` strings.
 */
export const cleanupUploadedImages = async (images = []) => {
  if (!Array.isArray(images) || images.length === 0) return;

  const fileIds = [
    ...new Set(
      images
        .map((img) => (typeof img === "string" ? img : img?.imageId))
        .filter((id) => typeof id === "string" && id.trim().length > 0)
    ),
  ];

  if (fileIds.length === 0) return;

  console.log(`Rolling back: Deleting ${fileIds.length} orphaned image(s) from ImageKit...`);
  const deletePromises = fileIds.map((fileId) => deleteWithRetry(fileId));
  await Promise.allSettled(deletePromises);
};
