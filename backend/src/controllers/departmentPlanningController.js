const asyncHandler = require("../middleware/asyncHandler");
const planningService = require("../services/departmentPlanningService");
const { sendSuccess } = require("../utils/apiResponse");

const listRecommendations = asyncHandler(async (request, response) => {
  const result = await planningService.listRecommendations(request.query);
  return sendSuccess(response, "Planning recommendations retrieved successfully", result);
});

const listWeeklyPlans = asyncHandler(async (request, response) => {
  const result = await planningService.listWeeklyPlans(request.query);
  return sendSuccess(response, "Weekly plans retrieved successfully", result);
});

const listMonthlyPlans = asyncHandler(async (request, response) => {
  const result = await planningService.listMonthlyPlans(request.query);
  return sendSuccess(response, "Monthly plans retrieved successfully", result);
});

module.exports = { listMonthlyPlans, listRecommendations, listWeeklyPlans };
