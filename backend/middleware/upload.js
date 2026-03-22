const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ================= STORAGE ================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'taskvra/profile';

    return {
      folder,
      resource_type: 'image',
      public_id: `profile_${Date.now()}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    };
  }
});

/* ================= FILE FILTER ================= */
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files allowed'), false);
  }
};

/* ================= MULTER ================= */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
