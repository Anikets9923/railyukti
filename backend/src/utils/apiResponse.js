function sendSuccess(response, message, data = undefined, statusCode = 200) {
  const payload = {
    success: true,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return response.status(statusCode).json(payload);
}

module.exports = { sendSuccess };