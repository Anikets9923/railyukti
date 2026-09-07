const asyncHandler = require("../middleware/asyncHandler");
const resourceInputService = require("../services/resourceInputService");
const { sendSuccess } = require("../utils/apiResponse");

function createListController(type, label) {
  return asyncHandler(async (request, response) => {
    const result = await resourceInputService.listResource(type, request.query);
    return sendSuccess(response, `${label} retrieved successfully`, result);
  });
}

function createDetailController(type, label) {
  return asyncHandler(async (request, response) => {
    const result = await resourceInputService.getResource(type, request.params.id);
    return sendSuccess(response, `${label} retrieved successfully`, result);
  });
}

function createRelationController(type, relationField, label) {
  return asyncHandler(async (request, response) => {
    const result = await resourceInputService.listByRelation(type, relationField, request.params.id);
    return sendSuccess(response, `${label} retrieved successfully`, result);
  });
}

module.exports = {
  listFailureRisk: createListController("failureRisk", "Failure risk records"),
  getFailureRisk: createDetailController("failureRisk", "Failure risk record"),
  assetFailureRisk: createRelationController("failureRisk", "asset", "Asset failure risk records"),
  maintenanceFailureRisk: createRelationController("failureRisk", "maintenanceTask", "Maintenance failure risk records"),
  listSpares: createListController("spares", "Spare availability records"),
  getSpare: createDetailController("spares", "Spare availability record"),
  assetSpares: createRelationController("spares", "asset", "Asset spare availability records"),
  maintenanceSpares: createRelationController("spares", "maintenanceTask", "Maintenance spare availability records"),
  listTechnicians: createListController("technicians", "Technician availability records"),
  getTechnician: createDetailController("technicians", "Technician availability record"),
  maintenanceTechnicians: createRelationController("technicians", "maintenanceTask", "Maintenance technician availability records"),
};
