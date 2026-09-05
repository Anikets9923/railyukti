const asyncHandler = require("../middleware/asyncHandler");
const planningService = require("../services/planningService");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const listPlanning = asyncHandler(async (request, response) => {
  const result = await planningService.listBlockPlans(request.query);
  return sendSuccess(response, "Block plans retrieved successfully", result);
});

const getPlanning = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Block plan id is required", 400);
  const plan = await planningService.getBlockPlanById(request.params.id);
  return sendSuccess(response, "Block plan retrieved successfully", plan);
});

module.exports = { getPlanning, listPlanning };