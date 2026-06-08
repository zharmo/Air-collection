const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { getUploadRoot, getUploadUrlPrefix } = require('../utils/uploadPaths');

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

const normalizeSubdir = (subdir) =>
  String(subdir || 'products')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('/');

const saveUploadedImage = async (file, subdir = 'products') => {
  if (!file?.buffer) {
    throw new Error('No image file was provided.');
  }

  if (!file.mimetype?.startsWith('image/')) {
    throw new Error('Only image uploads are allowed.');
  }

  const uploadRoot = getUploadRoot();
  const safeSubdir = normalizeSubdir(subdir);
  const destinationDir = path.join(uploadRoot, safeSubdir);
  const extension =
    MIME_EXTENSIONS[file.mimetype] ||
    path.extname(file.originalname || '').replace('.', '').toLowerCase() ||
    'jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;

  await fs.mkdir(destinationDir, { recursive: true });
  await fs.writeFile(path.join(destinationDir, filename), file.buffer);

  const urlPath = [getUploadUrlPrefix(), safeSubdir, filename]
    .join('/')
    .replace(/\/+/g, '/');

  return {
    url: urlPath,
    publicId: null,
  };
};

module.exports = { saveUploadedImage };
