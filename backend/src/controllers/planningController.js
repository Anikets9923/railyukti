const asyncHandler = require("../middleware/asyncHandler");
const planningService = require("../services/planningService");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { validateGeneratePlanPayload } = require("../validators/planningValidators");
const divisionalService = require("../services/divisionalService");

const listPlanning = asyncHandler(async (request, response) => {
  const result = await planningService.listBlockPlans(request.query);
  return sendSuccess(response, "Block plans retrieved successfully", result);
});

const getPlanning = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Block plan id is required", 400);
  const plan = await planningService.getBlockPlanById(request.params.id);
  return sendSuccess(response, "Block plan retrieved successfully", plan);
});

const generatePlan = asyncHandler(async (request, response) => {
  const input = validateGeneratePlanPayload(request.body);
  const result = await planningService.generatePlan(input);
  return sendSuccess(response, "Block plan generated successfully", result);
});

const decidePlan = asyncHandler(async (request, response) => {
  const result = await divisionalService.decidePlan(request.params.id, request.body || {});
  return sendSuccess(response, "Plan decision recorded successfully", result);
});

module.exports = { decidePlan, generatePlan, getPlanning, listPlanning };