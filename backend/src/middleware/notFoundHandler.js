const AppError = require("../utils/appError");

function notFoundHandler(request, response, next) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
}

module.exports = notFoundHandler;