const getErrorMessage = (error, fallback = 'Internal server error') => {
  if (process.env.NODE_ENV === 'production') {
    return fallback;
  }

  return error?.message || fallback;
};

const sendServerError = (res, error, fallback) => {
  res.status(500).json({
    success: false,
    message: getErrorMessage(error, fallback),
  });
};

module.exports = { getErrorMessage, sendServerError };
