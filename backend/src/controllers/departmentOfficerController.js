const asyncHandler = require("../middleware/asyncHandler");
const officerService = require("../services/departmentOfficerService");
const { validateDecisionPayload } = require("../validators/departmentOfficerValidators");
const { sendSuccess } = require("../utils/apiResponse");

const listRequests = asyncHandler(async (request, response) => {
  const result = await officerService.listRequests(request.query);
  return sendSuccess(response, "Department requests retrieved successfully", result);
});

const getRequest = asyncHandler(async (request, response) => {
  const result = await officerService.getRequest(request.params.id);
  return sendSuccess(response, "Department request retrieved successfully", result);
});

const decideRequest = asyncHandler(async (request, response) => {
  const input = validateDecisionPayload(request.body);
  const result = await officerService.decideRequest(request.params.id, input);
  return sendSuccess(response, "Department request decision recorded successfully", result);
});

const listPerformance = asyncHandler(async (request, response) => {
  const result = await officerService.listPerformance(request.query);
  return sendSuccess(response, "Department performance retrieved successfully", result);
});

module.exports = { decideRequest, getRequest, listPerformance, listRequests };
