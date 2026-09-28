const asyncHandler = require("../middleware/asyncHandler");
const assetService = require("../services/assetService");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const listAssets = asyncHandler(async (request, response) => {
  const result = await assetService.listAssets(request.query);
  return sendSuccess(response, "Assets retrieved successfully", result);
});

const getAsset = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Asset id is required", 400);
  const asset = await assetService.getAssetById(request.params.id);
  return sendSuccess(response, "Asset retrieved successfully", asset);
});

const getAssetHistory = asyncHandler(async (request, response) => {
  const history = await require("../services/maintenanceService").getAssetHistory(request.params.id);
  return sendSuccess(response, "Maintenance history retrieved successfully", history);
});

module.exports = { getAsset, getAssetHistory, listAssets };