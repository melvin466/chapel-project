const getUploadedFilePath = (file) => {
  if (!file?.path) return undefined;
  if (/^https?:\/\//i.test(file.path)) return file.path;

  const normalizedPath = file.path.replace(/\\/g, '/');
  const uploadIndex = normalizedPath.indexOf('/uploads/');
  return uploadIndex >= 0 ? normalizedPath.slice(uploadIndex) : `/${normalizedPath}`;
};

module.exports = { getUploadedFilePath };
