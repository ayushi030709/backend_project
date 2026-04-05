class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function sendSuccess(res, payload, statusCode = 200, meta = undefined) {
  const requestId = res.locals.requestId || "unknown";
  const response = {
    success: true,
    requestId,
    data: payload,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  AppError,
  sendSuccess,
};

