const FALLBACK_IMAGES = [
  'https://photos.smugmug.com/2025/n-LrkspB/Makfest-25/Worship-Evening/i-GwB63b7/0/MSp79rm3QMPHDsvTsSHg4BdJFbpxvbHdN98xqXCJP/M/IMGW4103-M.jpg',
  'https://photos.smugmug.com/2025/n-LrkspB/Makfest-25/Worship-Evening/i-PSrkGPW/0/LhzdWCd7txfCHgX6K2dkfFM8MjF8PbThjwkqrkJnw/M/IMGW4117-M.jpg',
  'https://photos.smugmug.com/2025/n-LrkspB/Makfest-25/Family-Sunday/i-VKbcgk3/0/Ld65MZ7DhzkHNX9hnhMJrK5mgzR9d3SC56KznZG5Z/M/IMGW5311-M.jpg',
];

let currentImageIndex = parseInt(localStorage.getItem('imageRotationIndex') || '0', 10);

export const getNextFallbackImage = () => {
  const image = FALLBACK_IMAGES[currentImageIndex];
  currentImageIndex = (currentImageIndex + 1) % FALLBACK_IMAGES.length;
  localStorage.setItem('imageRotationIndex', String(currentImageIndex));
  return image;
};

export const getRotatedImage = (uploadedImage) => {
  if (uploadedImage) return uploadedImage;
  return getNextFallbackImage();
};

export const getAllFallbackImages = () => FALLBACK_IMAGES;
