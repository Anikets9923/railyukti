const asyncHandler = require("../middleware/asyncHandler");
const blockWindowService = require("../services/blockWindowService");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const listBlocks = asyncHandler(async (request, response) => {
  const result = await blockWindowService.listBlockWindows(request.query);
  return sendSuccess(response, "Block windows retrieved successfully", result);
});

const getBlock = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Block window id is required", 400);
  const blockWindow = await blockWindowService.getBlockWindowById(request.params.id);
  return sendSuccess(response, "Block window retrieved successfully", blockWindow);
});

const listAvailableBlocks = asyncHandler(async (request, response) => {
  const result = await blockWindowService.listBlockWindows(request.query, true);
  return sendSuccess(response, "Available block windows retrieved successfully", result);
});

module.exports = { getBlock, listAvailableBlocks, listBlocks };