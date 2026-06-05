const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Error', statusCode = 400, errorDetails = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails,
  });
};

module.exports = { sendSuccess, sendError };