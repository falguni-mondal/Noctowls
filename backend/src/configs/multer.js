import multer from 'multer';

// Configure Multer for memory storage
const storage = multer.memoryStorage();

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/webp', 'image/jpeg'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Invalid file type: ${file.mimetype}. Only PNG, WEBP, and JPEG are allowed.`
      ),
      false
    );
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 13 // Max 7 main + 6 highlight images for deskmat
  },
  fileFilter: fileFilter
});

// Define upload configurations for different routes
export const uploadProductImages = upload.fields([
  { name: 'mainImages', maxCount: 7 },
  { name: 'highlightImages', maxCount: 6 }
]);

// Error handler middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large',
        errors: {
          images: ['Each image must be less than 10MB']
        }
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded',
        errors: {
          images: ['Maximum 7 main images and 6 highlight images allowed']
        }
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field',
        errors: {
          images: [err.message || 'Invalid file upload']
        }
      });
    }
  }
  
  // Other errors (like file type validation)
  if (err.message) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      errors: err.message,
    });
  }

  next(err);
};

export default upload;