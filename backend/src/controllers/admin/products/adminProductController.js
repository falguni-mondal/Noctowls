import mongoose from "mongoose";
import { deleteWithRetry } from "../../../configs/imagekit.js";
import orderModel from "../../../models/order-model.js";
import productModel from "../../../models/product-model.js";
import reviewModel from "../../../models/review-model.js";
import {
  productForAdminDetail,
  productForAdminList,
  sortProductsList,
} from "../../../utils/helpers/product-data-trimmer.js";
import { cleanupUploadedImages } from "../../../utils/imageUtils.js";

/**
 * Helper: Delete images from ImageKit with retry logic
 */
const deleteImagesFromImageKit = async (fileIds) => {
  try {
    const deletePromises = fileIds.map((fileId) => deleteWithRetry(fileId));
    const results = await Promise.all(deletePromises);
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
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const productAdder = async (req, res) => {
  const {
    name,
    description,
    category,
    group,
    sizes,
    inventory,
    mainImages = [],
    highlightImages = [],
  } = req.product;

  try {
    const folderName = sanitizeFolderName(name);
    const normalizedCategory = String(category || "").toLowerCase().trim();

    const formattedMainImages = mainImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: img.alt || folderName,
    }));

    const formattedHighlightImages = highlightImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: img.alt || folderName,
    }));

    // Shift any existing custom-ordered products in this category down by 1
    // so the newly added product always appears as the 1st item (displayOrder: 0)
    await productModel.updateMany(
      { category: normalizedCategory, displayOrder: { $ne: null } },
      { $inc: { displayOrder: 1 } }
    );

    const newProduct = await productModel.create({
      name,
      description,
      category: normalizedCategory,
      group,
      sizes,
      inventory,
      images: formattedMainImages,
      highlightImages: formattedHighlightImages,
      status: "published",
      displayOrder: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("PRODUCT ADD ERROR:", error);

    // Rollback pre-uploaded images from ImageKit if MongoDB creation fails
    await cleanupUploadedImages([...mainImages, ...highlightImages]);

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

const productUpdater = async (req, res) => {
  const { productId } = req.params;
  const {
    name,
    description,
    category,
    group,
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

  try {
    const folderName = sanitizeFolderName(name);

    // ==================== FIND EXISTING PRODUCT ====================
    const product = await productModel.findById(productId);
    if (!product) {
      await cleanupUploadedImages([...newMainImages, ...newHighlightImages]);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // STORE ORIGINAL IMAGES (Snapshot for comparison & cleanup)
    const originalMainImages = product.images ? [...product.images] : [];
    const originalHighlightImages = product.highlightImages
      ? [...product.highlightImages]
      : [];

    // ==================== 1. FORMAT NEW MAIN & HIGHLIGHT IMAGES ====================
    const formattedNewMainImages = newMainImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: img.alt || folderName,
    }));

    const formattedNewHighlightImages = newHighlightImages.map((img) => ({
      url: img.url,
      imageId: img.imageId,
      alt: img.alt || folderName,
    }));

    // ==================== 2. MERGE EXISTING AND NEW IMAGES ====================
    const IMAGE_COUNTS = {
      deskmat: { main: 7, highlight: 6 },
      "anime-keychain": { main: 4, highlight: 3 },
      "anime-figure": { main: 4, highlight: 3 },
      "anime-katana": { main: 4, highlight: 3 },
    };

    const counts = IMAGE_COUNTS[category] || { main: 4, highlight: 3 };

    const finalMainImages = new Array(counts.main);
    const finalHighlightImages = new Array(counts.highlight);

    // Place existing images in their target slots
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
      const rawIdx =
        newMainImages[idx]?.index !== undefined
          ? newMainImages[idx].index
          : mainImagesIndices[idx];
      const targetIndex = parseInt(rawIdx, 10);
      if (!isNaN(targetIndex)) {
        finalMainImages[targetIndex] = img;
      }
    });

    formattedNewHighlightImages.forEach((img, idx) => {
      const rawIdx =
        newHighlightImages[idx]?.index !== undefined
          ? newHighlightImages[idx].index
          : highlightImagesIndices[idx];
      const targetIndex = parseInt(rawIdx, 10);
      if (!isNaN(targetIndex)) {
        finalHighlightImages[targetIndex] = img;
      }
    });

    // ==================== 3. UPDATE PRODUCT IN DB ====================
    product.name = name;
    product.description = description;
    product.category = category;
    product.group = group;
    product.sizes = sizes;
    product.inventory = inventory;
    product.status = status;

    product.images = finalMainImages.filter(Boolean);
    product.highlightImages = finalHighlightImages.filter(Boolean);

    await product.save();

    // ==================== 4. DELETE REPLACED IMAGES FROM IMAGEKIT AFTER DB SAVE ====================
    const imagesToDelete = [];

    originalMainImages.forEach((origImg) => {
      if (origImg && origImg.imageId) {
        const isKept = existingMainImages.some(
          (keptImg) => keptImg.imageId === origImg.imageId
        );
        if (!isKept) imagesToDelete.push(origImg.imageId);
      }
    });

    originalHighlightImages.forEach((origImg) => {
      if (origImg && origImg.imageId) {
        const isKept = existingHighlightImages.some(
          (keptImg) => keptImg.imageId === origImg.imageId
        );
        if (!isKept) imagesToDelete.push(origImg.imageId);
      }
    });

    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} replaced/removed images...`);
      Promise.allSettled(imagesToDelete.map((id) => deleteWithRetry(id)));
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("PRODUCT UPDATE ERROR:", error);

    // ROLLBACK: Delete newly uploaded images if MongoDB update fails
    await cleanupUploadedImages([...newMainImages, ...newHighlightImages]);

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const hasOrders = await orderModel.exists({ "items.product": id });

    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete product with existing orders. Consider archiving instead.",
        suggestion: "Change product status to 'archived'.",
      });
    }

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

    const reviewsCount = await reviewModel.countDocuments({ product: id });

    await productModel.findByIdAndDelete(id);
    await reviewModel.deleteMany({ product: id });

    if (fileIdsToDelete.length > 0) {
      deleteImagesFromImageKit(fileIdsToDelete).catch((err) => {
        console.error("Failed to delete images from ImageKit:", err.message);
      });
    }

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
    // Fetch latest first so categories & un-reordered products are strictly newest first
    const products = await productModel
      .find()
      .sort({ createdAt: -1, _id: -1 })
      .select("-__v")
      .lean();

    // Return 200 OK with empty array instead of 404 so Axios/Redux does not reject
    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        totalProducts: 0,
        productGroups: [],
      });
    }

    const uniqueCategories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];

    const groupedByCategory = uniqueCategories.map((category) => {
      const categoryProducts = sortProductsList(
        products.filter((p) => p.category === category)
      );
      const trimmedProducts = categoryProducts.map((product) =>
        productForAdminList(product)
      );

      return {
        category,
        count: trimmedProducts.length,
        products: trimmedProducts,
      };
    });

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

/**
 * Reorder products via Admin Drag-and-Drop (or reset category to Latest First)
 */
const reorderAdminProducts = async (req, res) => {
  try {
    const { category, orderedProductIds, resetToLatest = false } = req.body || {};

    if (resetToLatest && category) {
      const normalizedCategory = String(category).toLowerCase().trim();
      await productModel.updateMany(
        { category: normalizedCategory },
        { $set: { displayOrder: null } }
      );

      return res.status(200).json({
        success: true,
        message: `Reset ${normalizedCategory} products to latest-first order`,
        category: normalizedCategory,
      });
    }

    if (!Array.isArray(orderedProductIds) || orderedProductIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderedProductIds must be a non-empty array of product IDs",
      });
    }

    const validIds = orderedProductIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid product IDs provided",
      });
    }

    const bulkOps = validIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { displayOrder: index } },
      },
    }));

    await productModel.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: "Product sequence updated successfully",
      category: category || null,
      orderedProductIds: validIds,
    });
  } catch (err) {
    console.error("Reorder admin products error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update product sequence",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const getOneAdminProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await productModel
      .findById(productId)
      .select("-__v")
      .lean();

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
    const rawProducts = await productModel
      .find()
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    if (!rawProducts || rawProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found to export",
      });
    }

    const products = sortProductsList(rawProducts);
    const exportedData = {};

    products.forEach((product) => {
      const category = product.category || "uncategorized";

      if (!exportedData[category]) {
        exportedData[category] = [];
      }

      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((size) => {
          exportedData[category].push({
            "Product ID": product._id.toString(),
            "Product Name": product.name,
            Category: category.toUpperCase(),
            Status: (product.status || "published").toUpperCase(),
            "Size Variant": size.label || (size.value || "").toUpperCase(),
            "SKU Code": (size.skuCode || "").toUpperCase(),
            "Stock Quantity": size.stock ?? 0,
            "Original Price (₹)": size.originalPrice ?? 0,
            "Selling Price (₹)": size.numPrice ?? 0,
            "Discount (%)": size.discount || 0,
            "HSN Code": (product.hsnCode || "").toUpperCase(),
            "GST Rate (%)": product.gstRate ?? 18,
            "Units Sold": size.salesCount || 0,
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
  reorderAdminProducts,
  getOneAdminProduct,
  inventoryExporter,
};