const { v2: cloudinary } = require('cloudinary');

const DEFAULT_CLOUDINARY_FOLDER = 'chapel-system';

const hasCloudinaryConfig = () => Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

const configureCloudinary = () => {
  if (!hasCloudinaryConfig()) return false;

  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  return true;
};

const getCloudinaryRootFolder = () => process.env.CLOUDINARY_FOLDER || DEFAULT_CLOUDINARY_FOLDER;

const stripExtension = (value) => value.replace(/\.[^/.]+$/, '');

const getCloudinaryPublicIdFromUrl = (value, expectedResourceType) => {
  if (!value || typeof value !== 'string') return undefined;

  try {
    const parsed = new URL(value);
    if (parsed.hostname !== 'res.cloudinary.com') return undefined;

    const segments = parsed.pathname.split('/').filter(Boolean);
    const [cloudName, resourceType, deliveryType, ...assetSegments] = segments;
    if (!cloudName || !resourceType || !deliveryType || assetSegments.length === 0) return undefined;
    if (process.env.CLOUDINARY_CLOUD_NAME && cloudName !== process.env.CLOUDINARY_CLOUD_NAME) return undefined;
    if (expectedResourceType && resourceType !== expectedResourceType) return undefined;

    const versionIndex = assetSegments.findIndex((segment) => /^v\d+$/.test(segment));
    const publicIdSegments = versionIndex >= 0 ? assetSegments.slice(versionIndex + 1) : assetSegments;
    if (publicIdSegments.length === 0) return undefined;

    return stripExtension(publicIdSegments.join('/'));
  } catch (error) {
    return undefined;
  }
};

const deleteCloudinaryAsset = async (value, resourceType = 'image') => {
  const publicId = getCloudinaryPublicIdFromUrl(value, resourceType);
  if (!publicId || !configureCloudinary()) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.warn(`Cloudinary cleanup failed for ${publicId}: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  configureCloudinary,
  deleteCloudinaryAsset,
  getCloudinaryPublicIdFromUrl,
  getCloudinaryRootFolder,
  hasCloudinaryConfig,
};
