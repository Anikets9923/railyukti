const asyncHandler = require("../middleware/asyncHandler");
const analyticsService = require("../services/analyticsService");
const { sendSuccess } = require("../utils/apiResponse");

const getDashboard = asyncHandler(async (request, response) => {
  const analytics = await analyticsService.getDashboardAnalytics();
  return sendSuccess(response, "Dashboard analytics retrieved successfully", analytics);
});

module.exports = { getDashboard };