import productModel from "../../../models/product-model.js";
import { uploadImageInWorker } from "../../../utils/imageWorker.js";

const productAdder = async (req, res) => {
  const sanitizeFolderName = (name) => {
    if (!name || typeof name !== "string") return "default";

    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-") // Replace invalid chars with hyphens
      .replace(/-+/g, "-") // Remove duplicate hyphens
      .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
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
        uploadImageInWorker(file, `/products/${category}/${sanitizeFolderName(name)}/main`)
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
        uploadImageInWorker(file, `/products/${category}/${sanitizeFolderName(name)}/highlight`)
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

export { productAdder };
