const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file type
    let resourceType = 'auto'; // auto handles most file types
    let folder = 'taskvra/messages';

    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
      folder = 'taskvra/messages/images';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'taskvra/messages/documents';
    } else if (file.mimetype.startsWith('application/')) {
      folder = 'taskvra/messages/documents';
    }

    return {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      allowed_formats: [
        // Images
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
        // Documents
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', '7z'
      ],
      max_file_size: 50 * 1024 * 1024 // 50 MB
    };
  }
});

// File filter - allow common document and image types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  }
});

module.exports = upload;
