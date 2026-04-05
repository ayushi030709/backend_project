const { AppError } = require("../utils/http");

function notFoundMiddleware(_req, _res, next) {
  next(new AppError(404, "NOT_FOUND", "Resource not found"));
}

module.exports = {
  notFoundMiddleware,
};

