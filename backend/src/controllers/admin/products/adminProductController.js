import { deleteWithRetry } from "../../../configs/imagekit.js";
import orderModel from "../../../models/order-model.js";
import productModel from "../../../models/product-model.js";
import reviewModel from "../../../models/review-model.js";
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


const productAdder = async (req, res) => {
  const sanitizeFolderName = (name) => {
    if (!name || typeof name !== "string") return "default";

    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-") // Replace invalid chars with hyphens
      .replace(/-+/g, "-") // Remove duplicate hyphens
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  };
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
        suggestion:
          "Change product status to 'archived'.",
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

export { productAdder, productDeleter };
