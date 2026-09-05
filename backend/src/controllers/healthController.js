const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const healthService = require("../services/healthService");

const getHealth = asyncHandler(async (request, response) => {
  await healthService.checkHealth();
  return sendSuccess(response, "Backend is running");
});

module.exports = { getHealth };