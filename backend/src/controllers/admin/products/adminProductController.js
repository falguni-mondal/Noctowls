import mongoose from "mongoose";
import { deleteWithRetry } from "../../../configs/imagekit.js";
import orderModel from "../../../models/order-model.js";
import productModel from "../../../models/product-model.js";
import reviewModel from "../../../models/review-model.js";
import {
  productForAdminDetail,
  productForAdminList,
} from "../../../utils/helpers/product-data-trimmer.js";
// import { uploadImageInWorker } from "../../../utils/imageWorker.js";
import { cleanupUploadedImages, processAndUploadImage } from "../../../utils/imageUtils.js";

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
  // Track all successful uploads for rollback
  let uploadedImagesRecord = [];

  try {
    const { name, description, category, sizes, inventory } = req.product;

    const mainImages = req.files.mainImages || [];
    const highlightImages = req.files.highlightImages || [];
    const folderName = sanitizeFolderName(name);

    // -----------------------------
    // 1. UPLOAD MAIN IMAGES
    // -----------------------------
    const mainImagePromises = mainImages.map((file) =>
      processAndUploadImage(
        file,
        `/products/${category}/${folderName}/main`
      )
    );

    const uploadedMainImages = await Promise.all(mainImagePromises);
    
    // Add to record immediately
    uploadedImagesRecord = [...uploadedImagesRecord, ...uploadedMainImages];

    // Format for Mongoose Schema
    const formattedMainImages = uploadedMainImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: folderName, 
    }));

    // -----------------------------
    // 2. UPLOAD HIGHLIGHT IMAGES
    // -----------------------------
    const highlightImagePromises = highlightImages.map((file) =>
      processAndUploadImage(
        file,
        `/products/${category}/${folderName}/highlight`
      )
    );

    const uploadedHighlightImages = await Promise.all(highlightImagePromises);
    
    // Add to record
    uploadedImagesRecord = [...uploadedImagesRecord, ...uploadedHighlightImages];

    const formattedHighlightImages = uploadedHighlightImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: folderName,
    }));

    // -----------------------------
    // 3. CREATE PRODUCT IN DATABASE
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
      product: newProduct,
    });

  } catch (error) {
    console.error("PRODUCT ADD ERROR:", error);

    // ✅ ROLLBACK: Delete images if DB creation fails
    if (uploadedImagesRecord.length > 0) {
      await cleanupUploadedImages(uploadedImagesRecord);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

const productUpdater = async (req, res) => {
  // Track ONLY newly uploaded images for rollback
  let uploadedImagesRecord = [];

  try {
    const { productId } = req.params;
    const {
      name,
      description,
      category,
      sizes,
      inventory,
      status,
      newMainImages = [],
      newHighlightImages = [],
      mainImagesIndices = [],
      highlightImagesIndices = [],
      existingMainImages = [],
      existingHighlightImages = [],
    } = req.product;

    const folderName = sanitizeFolderName(name);

    // ==================== FIND EXISTING PRODUCT ====================
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // STORE ORIGINAL IMAGES (Snapshot for comparison & cleanup)
    const originalMainImages = product.images ? [...product.images] : [];
    const originalHighlightImages = product.highlightImages ? [...product.highlightImages] : [];

    // ==================== 1. PROCESS NEW MAIN IMAGES (If Any) ====================
    let formattedNewMainImages = [];
    if (newMainImages && newMainImages.length > 0) {
      const processedMainPromises = newMainImages.map((file) =>
        processAndUploadImage(file, `/products/${category}/${folderName}/main`)
      );

      const processedMainImages = await Promise.all(processedMainPromises);
      uploadedImagesRecord = [...uploadedImagesRecord, ...processedMainImages];

      formattedNewMainImages = processedMainImages.map((img) => ({
        url: img.url,
        imageId: img.imageId,
        alt: folderName,
      }));
    }

    // ==================== 2. PROCESS NEW HIGHLIGHT IMAGES (If Any) ====================
    let formattedNewHighlightImages = [];
    if (newHighlightImages && newHighlightImages.length > 0) {
      const processedHighlightPromises = newHighlightImages.map((file) =>
        processAndUploadImage(file, `/products/${category}/${folderName}/highlight`)
      );

      const processedHighlightImages = await Promise.all(processedHighlightPromises);
      uploadedImagesRecord = [...uploadedImagesRecord, ...processedHighlightImages];

      formattedNewHighlightImages = processedHighlightImages.map((img) => ({
        url: img.url,
        imageId: img.imageId,
        alt: folderName,
      }));
    }

    // ==================== 3. MERGE EXISTING AND NEW IMAGES ====================
    const IMAGE_COUNTS = {
      deskmat: { main: 7, highlight: 6 },
      "anime-keychain": { main: 4, highlight: 3 },
      "anime-figure": { main: 4, highlight: 3 },
      "anime-katana": { main: 4, highlight: 3 },
    };

    const counts = IMAGE_COUNTS[category] || { main: 4, highlight: 3 };

    const finalMainImages = new Array(counts.main);
    const finalHighlightImages = new Array(counts.highlight);

    // Place existing images back in their original slots
    existingMainImages.forEach((img) => {
      if (img && img.index !== undefined) {
        finalMainImages[img.index] = {
          url: img.url,
          imageId: img.imageId,
          alt: img.alt || folderName,
        };
      }
    });

    existingHighlightImages.forEach((img) => {
      if (img && img.index !== undefined) {
        finalHighlightImages[img.index] = {
          url: img.url,
          imageId: img.imageId,
          alt: img.alt || folderName,
        };
      }
    });

    // Place newly uploaded images in their target slots
    formattedNewMainImages.forEach((img, idx) => {
      const targetIndex = parseInt(mainImagesIndices[idx]);
      if (!isNaN(targetIndex)) {
        finalMainImages[targetIndex] = img;
      }
    });

    formattedNewHighlightImages.forEach((img, idx) => {
      const targetIndex = parseInt(highlightImagesIndices[idx]);
      if (!isNaN(targetIndex)) {
        finalHighlightImages[targetIndex] = img;
      }
    });

    // ==================== 4. IDENTIFY IMAGES TO DELETE FROM IMAGEKIT ====================
    const imagesToDelete = [];

    // If an original image ID is NO LONGER in the existingMainImages array from the frontend, 
    // it means the user either replaced it or deleted it. We must clear it from ImageKit.
    originalMainImages.forEach((origImg) => {
      if (origImg && origImg.imageId) {
        const isKept = existingMainImages.some(keptImg => keptImg.imageId === origImg.imageId);
        if (!isKept) imagesToDelete.push(origImg.imageId);
      }
    });

    originalHighlightImages.forEach((origImg) => {
      if (origImg && origImg.imageId) {
        const isKept = existingHighlightImages.some(keptImg => keptImg.imageId === origImg.imageId);
        if (!isKept) imagesToDelete.push(origImg.imageId);
      }
    });

    // Fire & forget ImageKit deletion (doesn't block the API response time)
    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} replaced/removed images...`);
      Promise.allSettled(imagesToDelete.map((id) => deleteWithRetry(id)));
    }

    // ==================== 5. UPDATE PRODUCT IN DB ====================
    product.name = name;
    product.description = description;
    product.category = category;
    product.sizes = sizes;
    product.inventory = inventory;
    product.status = status;
    
    // Filter out nulls/undefined in case there are empty slots in the array
    product.images = finalMainImages.filter(Boolean);
    product.highlightImages = finalHighlightImages.filter(Boolean);

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });

  } catch (error) {
    console.error("PRODUCT UPDATE ERROR:", error);

    // ROLLBACK: Delete newly uploaded images if MongoDB update fails
    if (uploadedImagesRecord.length > 0) {
      await cleanupUploadedImages(uploadedImagesRecord);
    }

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

const inventoryExporter = async (req, res) => {
  try {
    // Fetch all products, lean() makes it a plain JS object for faster processing
    const products = await productModel.find().lean();

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found to export",
      });
    }

    const exportedData = {};

    products.forEach((product) => {
      const category = product.category;

      // Initialize the category array if it doesn't exist yet
      if (!exportedData[category]) {
        exportedData[category] = [];
      }

      // Flatten the product by creating a separate row for each size variant
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((size) => {
          exportedData[category].push({
            "Product ID": product._id.toString(),
            "Product Name": product.name,
            "Category": product.category.toUpperCase(),
            "Status": product.status.toUpperCase(),
            "Size Variant": size.label || size.value.toUpperCase(),
            "SKU Code": size.skuCode.toUpperCase(),
            "Stock Quantity": size.stock,
            "Original Price (₹)": size.originalPrice,
            "Selling Price (₹)": size.numPrice,
            "Discount (%)": size.discount || 0,
            "HSN Code": product.hsnCode.toUpperCase(),
            "GST Rate (%)": product.gstRate,
            "Units Sold": size.salesCount || 0,
            // "Warehouse Location": product.inventory
          });
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Inventory data successfully formatted for export",
      data: exportedData,
    });

  } catch (err) {
    console.error("Inventory Export Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to export inventory data",
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
  inventoryExporter,
};
