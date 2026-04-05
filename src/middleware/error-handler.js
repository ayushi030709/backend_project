const { AppError } = require("../utils/http");

function errorHandler(error, _req, res, _next) {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isAppError
    ? error.message
    : process.env.NODE_ENV === "production"
      ? "Unexpected internal error"
      : error.message;

  const payload = {
    success: false,
    requestId: res.locals.requestId || "unknown",
    error: {
      code,
      message,
    },
  };

  if (isAppError && error.details) {
    payload.error.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && !isAppError && error.stack) {
    payload.error.debug = error.stack;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  errorHandler,
};

