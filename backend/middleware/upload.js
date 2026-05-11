const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadRoot = path.join(__dirname, '..', 'uploads');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = '';
    
    if (file.fieldname === 'featuredImage') {
      folder += req.baseUrl.includes('announcements') ? 'announcements/images/' : 'events/images/';
    } else if (file.fieldname === 'eventVideo') {
      folder += 'events/videos/';
    } else if (file.fieldname === 'announcementVideo') {
      folder += 'announcements/videos/';
    } else if (file.fieldname === 'thumbnail') {
      folder += 'sermons/';
    } else if (file.fieldname === 'profilePicture') {
      folder += 'profiles/';
    } else {
      folder += 'general/';
    }
    
    const destination = path.join(uploadRoot, folder);
    ensureDir(destination);
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.fieldname === 'featuredImage') {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WEBP) are allowed'));
    }
  } 
  else if (file.fieldname === 'eventVideo' || file.fieldname === 'announcementVideo') {
    const allowedTypes = /mp4|mov|avi|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MOV, AVI, WEBM, MKV) are allowed'));
    }
  }
  else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit for videos
  fileFilter: fileFilter
});

module.exports = upload;
