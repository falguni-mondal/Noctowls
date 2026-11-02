import mongoose from "mongoose";
import Product from "../../../models/product-model.js";
import Review from "../../../models/review-model.js";
import {
  productForDetail,
  productForList,
  sortProductsList,
} from "../../../utils/helpers/product-data-trimmer.js";

export const getAllProducts = async (req, res) => {
  try {
    // Sort by createdAt: -1, _id: -1 so the 1st item is the latest by default
    const products = await Product.find({
      status: "published",
      group: { $ne: "phase-00" }, // Hides phase-00 products from the general store
    })
      .sort({ createdAt: -1, _id: -1 })
      .select("-__v")
      .lean();

    // Return 200 OK with empty array instead of 404 when no products exist
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
      // Respect custom admin drag-and-drop sequence (displayOrder) and fallback to latest-first (createdAt: -1)
      const categoryProducts = sortProductsList(
        products.filter((p) => p.category === category)
      );
      const trimmedProducts = categoryProducts.map((product) =>
        productForList(product)
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

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findById(productId).select("-__v").lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

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
      .sort({ createdAt: -1, _id: -1 })
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

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const sizeData = product.sizes.find((s) => s.value === size.toLowerCase());

    if (!sizeData) {
      return res.status(404).json({
        success: false,
        message: "Size not found for this product",
      });
    }

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

    // 1. Fetch real best sellers (totalSales > 0), tie-broken by latest createdAt
    let products = await Product.find({
      status: "published",
      totalSales: { $gt: 0 },
      group: { $ne: "phase-00" },
    })
      .sort({ totalSales: -1, createdAt: -1, _id: -1 })
      .limit(limit)
      .select("-__v")
      .lean();

    // 2. Fallback: If not enough best sellers, fill with latest published products
    if (products.length < limit) {
      const existingIds = products.map((p) => p._id);
      const needed = limit - products.length;

      const latestFallbackProducts = await Product.find({
        status: "published",
        group: { $ne: "phase-00" },
        _id: { $nin: existingIds },
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(needed)
        .select("-__v")
        .lean();

      products = [...products, ...latestFallbackProducts];
    }

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

    const searchRegex = new RegExp(q, "i");

    const products = await Product.find({
      status: "published",
      $or: [
        { name: searchRegex },
        { category: searchRegex },
        { group: searchRegex },
        { type: searchRegex },
        { description: searchRegex },
      ],
    })
      .sort({ createdAt: -1, _id: -1 })
      .select("-__v")
      .lean();

    const sortedProducts = sortProductsList(products);
    const formattedProducts = sortedProducts.map((product) =>
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

export const getProductsByGroupAndCategory = async (req, res) => {
  try {
    const { group, category } = req.query;

    if (!group || group.trim() === "" || !category || category.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Both group and category parameters are required",
      });
    }

    const query = {
      status: "published",
      group: new RegExp(`^${group.trim()}$`, "i"),
      category: new RegExp(`^${category.trim()}$`, "i"),
    };

    const products = await Product.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .select("-__v")
      .lean();

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        products: [],
        message: "No products found for this group and category",
      });
    }

    const sortedProducts = sortProductsList(products);
    const formattedProducts = sortedProducts.map((product) =>
      productForList(product)
    );

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (err) {
    console.error("Filter by group error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filtered products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};