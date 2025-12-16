import mongoose from "mongoose";
import { deleteWithRetry } from "../../../configs/imagekit.js";
import orderModel from "../../../models/order-model.js";
import productModel from "../../../models/product-model.js";
import reviewModel from "../../../models/review-model.js";
import {
  productForAdminDetail,
  productForAdminList,
} from "../../../utils/helpers/product-data-trimmer.js";
import { uploadImageInWorker } from "../../../utils/imageWorker.js";

/**
 * Helper: Delete images from ImageKit with retry logic
 */
const deleteImagesFromImageKit = async (fileIds) => {
  try {
    const deletePromises = fileIds.map((fileId) => deleteWithRetry(fileId));
    const results = await Promise.all(deletePromises);

    const successful = results.filter((r) => r.success).length;
    const failed = fileIds.length - successful;

    return results;
  } catch (error) {
    console.error("Error deleting images from ImageKit:", error.message);
    throw error;
  }
};

const sanitizeFolderName = (name) => {
  if (!name || typeof name !== "string") return "default";

  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-") // Replace invalid chars with hyphens
    .replace(/-+/g, "-") // Remove duplicate hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
};

const productAdder = async (req, res) => {
  try {
    const { name, description, category, sizes, inventory } = req.product;

    const mainImages = req.files.mainImages || [];
    const highlightImages = req.files.highlightImages || [];

    // -----------------------------
    // UPLOAD MAIN IMAGES (WORKERS)
    // -----------------------------
    const uploadedMainImages = await Promise.all(
      mainImages.map((file) =>
        uploadImageInWorker(
          file,
          `/products/${category}/${sanitizeFolderName(name)}/main`
        )
      )
    );

    // Convert upload results to product image schema
    const formattedMainImages = uploadedMainImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: sanitizeFolderName(name), // optional alt
    }));

    // -----------------------------
    // UPLOAD HIGHLIGHT IMAGES
    // -----------------------------
    const uploadedHighlightImages = await Promise.all(
      highlightImages.map((file) =>
        uploadImageInWorker(
          file,
          `/products/${category}/${sanitizeFolderName(name)}/highlight`
        )
      )
    );

    const formattedHighlightImages = uploadedHighlightImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: sanitizeFolderName(name),
    }));

    // -----------------------------
    // CREATE PRODUCT IN DATABASE
    // -----------------------------
    const newProduct = await productModel.create({
      name,
      description,
      category,
      sizes,
      inventory,
      images: formattedMainImages,
      highlightImages: formattedHighlightImages,
      status: "published",
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("PRODUCT ADD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

const productUpdater = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      category,
      sizes,
      inventory,
      status,
      newMainImages,
      newHighlightImages,
      mainImagesIndices,
      highlightImagesIndices,
      existingMainImages,
      existingHighlightImages,
    } = req.product;

    // ==================== FIND EXISTING PRODUCT ====================
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // STORE ORIGINAL IMAGES BEFORE ANY MODIFICATIONS
    const originalMainImages = product.images ? [...product.images] : [];
    const originalHighlightImages = product.highlightImages
      ? [...product.highlightImages]
      : [];

    // ==================== PROCESS NEW MAIN IMAGES (WORKERS) ====================
    const processedMainImages = await Promise.all(
      newMainImages.map((file) =>
        uploadImageInWorker(
          file,
          `/products/${category}/${sanitizeFolderName(name)}/main`
        )
      )
    );

    const formattedNewMainImages = processedMainImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: sanitizeFolderName(name),
    }));

    // ==================== PROCESS NEW HIGHLIGHT IMAGES (WORKERS) ====================
    const processedHighlightImages = await Promise.all(
      newHighlightImages.map((file) =>
        uploadImageInWorker(
          file,
          `/products/${category}/${sanitizeFolderName(name)}/highlight`
        )
      )
    );

    const formattedNewHighlightImages = processedHighlightImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: sanitizeFolderName(name),
    }));

    // ==================== MERGE EXISTING AND NEW IMAGES ====================
    const IMAGE_COUNTS = {
      deskmat: { main: 7, highlight: 6 },
      "anime-keychain": { main: 4, highlight: 3 },
      "anime-figure": { main: 4, highlight: 3 },
      "anime-katana": { main: 4, highlight: 3 },
    };

    const counts = IMAGE_COUNTS[category];

    // Initialize arrays
    const finalMainImages = new Array(counts.main);
    const finalHighlightImages = new Array(counts.highlight);

    // Place existing images (these are the ones user wants to KEEP)
    existingMainImages.forEach((img) => {
      finalMainImages[img.index] = {
        url: img.url,
        imageId: img.imageId,
        alt: img.alt || sanitizeFolderName(name),
      };
    });

    existingHighlightImages.forEach((img) => {
      finalHighlightImages[img.index] = {
        url: img.url,
        imageId: img.imageId,
        alt: img.alt || sanitizeFolderName(name),
      };
    });

    // TRACK IMAGES TO DELETE FROM IMAGEKIT
    const imagesToDelete = [];

    // Place new main images and track old ones for deletion
    formattedNewMainImages.forEach((img, idx) => {
      const targetIndex = parseInt(mainImagesIndices[idx]);

      // CHECK ORIGINAL PRODUCT IMAGES (before any modifications)
      if (originalMainImages[targetIndex]?.imageId) {
        const oldImageId = originalMainImages[targetIndex].imageId;

        // Only delete if it's not in the "keep" list
        const isKept = existingMainImages.some(
          (existing) => existing.imageId === oldImageId
        );

        if (!isKept) {
          imagesToDelete.push(oldImageId);
        }
      }

      finalMainImages[targetIndex] = img;
    });

    // Place new highlight images and track old ones for deletion
    formattedNewHighlightImages.forEach((img, idx) => {
      const targetIndex = parseInt(highlightImagesIndices[idx]);

      // CHECK ORIGINAL PRODUCT IMAGES (before any modifications)
      if (originalHighlightImages[targetIndex]?.imageId) {
        const oldImageId = originalHighlightImages[targetIndex].imageId;

        // Only delete if it's not in the "keep" list
        const isKept = existingHighlightImages.some(
          (existing) => existing.imageId === oldImageId
        );

        if (!isKept) {
          imagesToDelete.push(oldImageId);
        }
      }

      finalHighlightImages[targetIndex] = img;
    });

    // ==================== DELETE OLD IMAGES FROM IMAGEKIT ====================
    if (imagesToDelete.length > 0) {
      console.log(
        `Deleting ${imagesToDelete.length} old images:`,
        imagesToDelete
      );

      // ✅ Use deleteWithRetry from your imagekit config
      const deletionResults = await Promise.allSettled(
        imagesToDelete.map((imageId) => deleteWithRetry(imageId))
      );

      // Log results
      deletionResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.alreadyDeleted) {
            console.log(`Image ${imagesToDelete[index]} was already deleted`);
          } else {
            console.log(`Successfully deleted image ${imagesToDelete[index]}`);
          }
        } else {
          console.error(
            `Failed to delete image ${imagesToDelete[index]}:`,
            result.reason
          );
        }
      });
    } else {
      console.log("No images to delete");
    }

    // ==================== UPDATE PRODUCT ====================
    product.name = name;
    product.description = description;
    product.category = category;
    product.sizes = sizes;
    product.inventory = inventory;
    product.status = status;
    product.images = finalMainImages;
    product.highlightImages = finalHighlightImages;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("PRODUCT UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const productDeleter = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // Find product
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product has been ordered (optional safety check)
    const hasOrders = await orderModel.exists({ "items.product": id });

    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete product with existing orders. Consider archiving instead.",
        suggestion: "Change product status to 'archived'.",
      });
    }

    // Collect all ImageKit file IDs
    const fileIdsToDelete = [];

    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img.imageId) {
          fileIdsToDelete.push(img.imageId);
        }
      });
    }

    if (product.highlightImages && product.highlightImages.length > 0) {
      product.highlightImages.forEach((img) => {
        if (img.imageId) {
          fileIdsToDelete.push(img.imageId);
        }
      });
    }

    // Get reviews count
    const reviewsCount = await reviewModel.countDocuments({ product: id });

    // Delete product
    await productModel.findByIdAndDelete(id);

    // Delete reviews
    await reviewModel.deleteMany({ product: id });

    // Delete images from ImageKit (async)
    if (fileIdsToDelete.length > 0) {
      deleteImagesFromImageKit(fileIdsToDelete).catch((err) => {
        console.error("Failed to delete images from ImageKit:", err.message);
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      deletedProduct: {
        id: product._id,
        name: product.name,
        category: product.category,
      },
      stats: {
        reviewsDeleted: reviewsCount,
        imagesDeleted: fileIdsToDelete.length,
      },
    });
  } catch (err) {
    console.error("Delete product error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const getAllAdminProducts = async (req, res) => {
  try {
    const products = await productModel.find().select("-__v").lean();

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    const uniqueCategories = [...new Set(products.map((p) => p.category))];

    // Group products by category
    const groupedByCategory = uniqueCategories.map((category) => {
      // Filter products for this category
      const categoryProducts = products.filter((p) => p.category === category);

      // Trim each product
      const trimmedProducts = categoryProducts.map((product) =>
        productForAdminList(product)
      );

      return {
        category,
        count: trimmedProducts.length,
        products: trimmedProducts,
      };
    });

    // Calculate total count
    const totalCount = groupedByCategory.reduce(
      (sum, cat) => sum + cat.count,
      0
    );

    return res.status(200).json({
      success: true,
      totalProducts: totalCount,
      productGroups: groupedByCategory,
    });
  } catch (err) {
    console.error("Get all admin products error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const getOneAdminProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // Get product
    const product = await productModel
      .findById(productId)
      .select("-__v")
      .lean();

    // Check if product exists
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product: productForAdminDetail(product),
    });
  } catch (err) {
    console.error("Get one admin product error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export {
  productAdder,
  productUpdater,
  productDeleter,
  getAllAdminProducts,
  getOneAdminProduct,
};
