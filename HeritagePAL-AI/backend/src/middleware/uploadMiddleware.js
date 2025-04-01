const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define storage options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed file types for educational content
  const allowedFileTypes = /pdf|doc|docx|ppt|pptx|xlsx|txt/i;
  
  // Check extension
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = allowedFileTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, XLSX, and TXT files are allowed.'));
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // Default to 10MB
  },
});

module.exports = upload; 