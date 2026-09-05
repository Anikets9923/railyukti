const asyncHandler = require("../middleware/asyncHandler");
const trainService = require("../services/trainService");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const listTrains = asyncHandler(async (request, response) => {
  const result = await trainService.listTrains(request.query);
  return sendSuccess(response, "Trains retrieved successfully", result);
});

const getTrain = asyncHandler(async (request, response) => {
  if (!request.params.id) throw new AppError("Train id is required", 400);
  const train = await trainService.getTrainById(request.params.id);
  return sendSuccess(response, "Train retrieved successfully", train);
});

const listTrainSchedules = asyncHandler(async (request, response) => {
  const result = await trainService.listSchedules(request.query);
  return sendSuccess(response, "Train schedules retrieved successfully", result);
});

module.exports = { getTrain, listTrainSchedules, listTrains };