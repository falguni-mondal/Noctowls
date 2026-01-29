import mongoose from "mongoose";
import Product from "../../../models/product-model.js";
import Review from "../../../models/review-model.js";
import {
  productForDetail,
  productForList,
} from "../../../utils/helpers/product-data-trimmer.js";

export const getAllProducts = async (req, res) => {
  try {
    // Get all published products
    const products = await Product.find({ status: "published" })
      .select("-__v")
      .lean();

    // Check if products exist
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
        productForList(product)
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
    console.error("Get all products error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const getOneProduct = async (req, res) => {
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
    const product = await Product.findById(productId).select("-__v").lean();

    // Check if product exists
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is published
    if (product.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    const reviews = await Review.find({
      product: productId,
      status: "accepted",
    })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    return res.status(200).json({
      success: true,
      product: productForDetail(product),
      reviews,
    });
  } catch (err) {
    console.error("Get one product error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const validateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, requestedQuantity } = req.body;

    // Validation
    if (!size || !requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: "Size and quantity are required",
      });
    }

    if (requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find the specific size
    const sizeData = product.sizes.find((s) => s.value === size.toLowerCase());

    if (!sizeData) {
      return res.status(404).json({
        success: false,
        message: "Size not found for this product",
      });
    }

    // Check stock availability
    const availableStock = sizeData.stock;
    const isAvailable = requestedQuantity <= availableStock;

    return res.status(200).json({
      success: true,
      data: {
        isAvailable,
        requestedQuantity,
        availableStock,
        maxQuantity: availableStock,
        size: sizeData.value,
        message: isAvailable
          ? "Stock available"
          : `Only ${availableStock} items available in stock`,
      },
    });
  } catch (error) {
    console.error("Error validating stock:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to validate stock",
      error: error.message,
    });
  }
};

export const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // 1. Fetch real best sellers (salesCount > 0)
    let products = await Product.find({
      status: "published",
      salesCount: { $gt: 0 },
    })
      .sort({ salesCount: -1 })
      .limit(limit)
      .select("-__v")
      .lean();

    // 2. Fallback: If not enough best sellers, fill with random published products
    if (products.length < limit) {
      const existingIds = products.map((p) => p._id);
      const needed = limit - products.length;

      const randomProducts = await Product.aggregate([
        {
          $match: {
            status: "published",
            _id: { $nin: existingIds }, // Exclude ones we already have
          },
        },
        { $sample: { size: needed } }, // Random selection
      ]);

      // Combine lists
      products = [...products, ...randomProducts];
    }

    // 3. Trim data for frontend
    const formattedProducts = products.map((product) =>
      productForList(product)
    );

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (err) {
    console.error("Get best selling error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch best selling products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Create a case-insensitive regex
    const searchRegex = new RegExp(q, "i");

    // Search in Name, Category, or Description
    const products = await Product.find({
      status: "published",
      $or: [
        { name: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ],
    })
      .select("-__v")
      .lean();

    // Format the results using the helper
    const formattedProducts = products.map((product) =>
      productForList(product)
    );

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (err) {
    console.error("Search products error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};