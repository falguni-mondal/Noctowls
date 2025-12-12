import Product from "../../models/product-model.js";
import Review from "../../models/review-model.js";
import mongoose from "mongoose";
import { productForDetail, productForList } from "../../utils/helpers/product-data-trimmer.js";


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

    const trimmedProducts = products.map(product => {
        return productForList(product);
    })

    return res.status(200).json({
      success: true,
      count: products.length,
      products: trimmedProducts,
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