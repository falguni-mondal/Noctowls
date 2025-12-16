import mongoose from 'mongoose';

const validateProductId = (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }

  next();
};

export default validateProductId;