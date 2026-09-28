const asyncHandler = require("../middleware/asyncHandler");
const maintenanceService = require("../services/maintenanceService");
const { validateMaintenancePayload } = require("../validators/maintenanceValidators");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const listMaintenance = asyncHandler(async (request, response) => {
  const result = await maintenanceService.listMaintenanceTasks(request.query);
  return sendSuccess(response, "Maintenance tasks retrieved successfully", result);
});

const getMaintenance = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Maintenance task id is required", 400);
  const task = await maintenanceService.getMaintenanceTaskById(request.params.id);
  return sendSuccess(response, "Maintenance task retrieved successfully", task);
});

const createMaintenance = asyncHandler(async (request, response) => {
  const data = validateMaintenancePayload(request.body);
  const task = await maintenanceService.createMaintenanceTask(data);
  return sendSuccess(response, "Maintenance task created successfully", task, 201);
});

const updateMaintenance = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Maintenance task id is required", 400);
  const data = validateMaintenancePayload(request.body, true);
  const task = await maintenanceService.updateMaintenanceTask(request.params.id, data);
  return sendSuccess(response, "Maintenance task updated successfully", task);
});

const getMaintenanceHistory = asyncHandler(async (request, response) => {
  const result = await maintenanceService.getMaintenanceHistory(request.params.id);
  return sendSuccess(response, "Maintenance history retrieved successfully", result);
});

module.exports = { createMaintenance, getMaintenance, getMaintenanceHistory, listMaintenance, updateMaintenance };