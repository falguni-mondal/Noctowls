import { generateUploadAuth } from "../../../configs/imagekit.js";
import { cleanupUploadedImages } from "../../../utils/imageUtils.js";

/**
 * GET /api/imagekit/auth?count=N
 * Generates temporary signed authentication parameters for direct frontend uploads to ImageKit.
 * Supports generating multiple unique one-time tokens in a single call for concurrent uploads.
 */
export const getUploadAuth = (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count, 10) : 1;
    const authData = generateUploadAuth(count);

    return res.status(200).json({
      success: true,
      ...authData,
    });
  } catch (error) {
    console.error("ImageKit Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate upload authentication parameters",
    });
  }
};

/**
 * POST /api/imagekit/cleanup
 * Deletes orphaned ImageKit files if a concurrent batch upload on the frontend partially fails
 * or is aborted before saving to MongoDB.
 */
export const cleanupOrphanedImages = async (req, res) => {
  try {
    const { imageIds, images } = req.body || {};
    const listToClean = Array.isArray(imageIds)
      ? imageIds
      : Array.isArray(images)
      ? images
      : [];

    if (listToClean.length === 0) {
      return res.status(200).json({
        success: true,
        cleaned: 0,
      });
    }

    // Cap cleanup batch size to prevent abuse
    const boundedList = listToClean.slice(0, 20);
    await cleanupUploadedImages(boundedList);

    return res.status(200).json({
      success: true,
      cleaned: boundedList.length,
    });
  } catch (error) {
    console.error("ImageKit Cleanup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clean up orphaned images",
    });
  }
};