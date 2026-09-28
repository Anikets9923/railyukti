const asyncHandler = require("../middleware/asyncHandler");
const operationsService = require("../services/operationsService");
const { sendSuccess } = require("../utils/apiResponse");

const listCorridors = asyncHandler(async (request, response) => {
  return sendSuccess(response, "Corridors retrieved successfully", await operationsService.listCorridors());
});

const listConflicts = asyncHandler(async (request, response) => {
  return sendSuccess(response, "Operational conflicts retrieved successfully", await operationsService.listConflicts(request.query));
});

const listAlerts = asyncHandler(async (request, response) => {
  return sendSuccess(response, "Operational alerts retrieved successfully", await operationsService.listAlerts(request.query));
});

module.exports = { listAlerts, listConflicts, listCorridors };
