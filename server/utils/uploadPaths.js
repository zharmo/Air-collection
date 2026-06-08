const path = require('path');

const getUploadRoot = () => {
  const configuredPath = process.env.UPLOAD_DIR;
  return configuredPath
    ? path.resolve(configuredPath)
    : path.join(__dirname, '..', 'uploads');
};

const getUploadUrlPrefix = () => process.env.UPLOAD_URL_PREFIX || '/uploads';

module.exports = {
  getUploadRoot,
  getUploadUrlPrefix,
};
