import multer from 'multer';

// Configure Multer for memory storage
const storage = multer.memoryStorage();

// File filter for validation
const fileFilter = (req, file, cb) => {
const allowedTypes = ['image/png', 'image/webp', 'image/jpeg'];

if (allowedTypes.includes(file.mimetype)) {
cb(null, true);
} else {
cb(new Error(`Invalid file type: ${file.mimetype}. Only PNG, WEBP, and JPEG are allowed.`), false);
}
};

// Create multer upload instance
const upload = multer({
storage: storage,
limits: {
fileSize: 5 * 1024 * 1024, // 5MB per file
files: 13 // Max 7 main + 6 highlight images for deskmat
},
fileFilter: fileFilter
});

// Define upload configurations for different routes
export const uploadProductImages = upload.fields([
{ name: 'mainImages', maxCount: 7 },
{ name: 'highlightImages', maxCount: 6 }
]);

export default upload;