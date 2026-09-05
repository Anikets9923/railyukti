const asyncHandler = require("../middleware/asyncHandler");
const analyticsService = require("../services/analyticsService");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const getDashboard = asyncHandler(async (request, response) => {
  const analytics = await analyticsService.getDashboardAnalytics();
  return sendSuccess(response, "Dashboard analytics retrieved successfully", analytics);
});

const getOptimization = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Block plan id is required", 400);
  const analytics = await analyticsService.getOptimizationAnalytics(request.params.id);
  return sendSuccess(response, "Optimization analytics retrieved successfully", analytics);
});

module.exports = { getDashboard, getOptimization };