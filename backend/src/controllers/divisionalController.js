const asyncHandler = require("../middleware/asyncHandler");
const divisionalService = require("../services/divisionalService");
const { sendSuccess } = require("../utils/apiResponse");

const listApprovals = asyncHandler(async (request, response) => {
  const result = await divisionalService.listApprovals(request.query);
  return sendSuccess(response, "Divisional approvals retrieved successfully", result);
});

const decidePlan = asyncHandler(async (request, response) => {
  const result = await divisionalService.decidePlan(request.params.id, request.body || {});
  return sendSuccess(response, "Plan decision recorded successfully", result);
});

module.exports = { decidePlan, listApprovals };
