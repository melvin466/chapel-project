const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');

const uploadRoot = path.join(__dirname, '..', 'uploads');
const maxUploadSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 25);
const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024;
const useCloudinary = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (useCloudinary && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getUploadFolder = (req, file) => {
  if (file.fieldname === 'featuredImage') {
    return req.baseUrl.includes('announcements') ? 'announcements/images' : 'events/images';
  }
  if (file.fieldname === 'eventVideo') return 'events/videos';
  if (file.fieldname === 'announcementVideo') return 'announcements/videos';
  if (file.fieldname === 'thumbnail') return 'sermons/images';
  if (file.fieldname === 'sermonAudio') return 'sermons/audio';
  if (file.fieldname === 'sermonVideo') return 'sermons/videos';
  if (file.fieldname === 'profilePicture') return 'profiles';
  return 'general';
};

const cloudinaryStorage = {
  _handleFile: (req, file, cb) => {
    const folder = `chapel-system/${getUploadFolder(req, file)}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        public_id: `${file.fieldname}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
          mimetype: result.resource_type,
        });
      }
    );

    file.stream.pipe(uploadStream);
  },
  _removeFile: (req, file, cb) => {
    if (!file.filename) return cb(null);
    cloudinary.uploader.destroy(file.filename, { resource_type: 'auto' }, cb);
  },
};

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destination = path.join(uploadRoot, getUploadFolder(req, file));
    ensureDir(destination);
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.fieldname === 'featuredImage' || file.fieldname === 'thumbnail' || file.fieldname === 'profilePicture') {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WEBP) are allowed'));
    }
  } 
  else if (file.fieldname === 'eventVideo' || file.fieldname === 'announcementVideo' || file.fieldname === 'sermonVideo') {
    const allowedTypes = /mp4|mov|avi|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MOV, AVI, WEBM, MKV) are allowed'));
    }
  }
  else if (file.fieldname === 'sermonAudio') {
    const allowedTypes = /mp3|wav|m4a|aac|ogg|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm';
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, M4A, AAC, OGG, WEBM) are allowed'));
    }
  }
  else {
    cb(null, true);
  }
};

const upload = multer({
  storage: useCloudinary ? cloudinaryStorage : localStorage,
  limits: {
    fileSize: maxUploadSizeBytes,
    files: 4,
    fields: 30,
  },
  fileFilter: fileFilter
});

module.exports = upload;
