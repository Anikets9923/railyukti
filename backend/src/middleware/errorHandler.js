function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || getDatabaseErrorStatus(error) || 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;
  const payload = {
    success: false,
    message,
  };

  if (error.details !== undefined) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    payload.error = error.message;
  }

  return response.status(statusCode).json(payload);
}

function getDatabaseErrorStatus(error) {
  if (error.code === "P2002") return 409;
  if (error.code === "P2025") return 404;
  if (error.code === "P2003") return 400;
  return undefined;
}

module.exports = errorHandler;