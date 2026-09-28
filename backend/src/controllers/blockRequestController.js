const asyncHandler = require("../middleware/asyncHandler");
const blockRequestService = require("../services/blockRequestService");
const { validateBlockRequestPayload } = require("../validators/blockRequestValidators");
const { sendSuccess } = require("../utils/apiResponse");

const createBlockRequest = asyncHandler(async (request, response) => {
  const input = validateBlockRequestPayload(request.body);
  const result = await blockRequestService.createBlockRequest(input);
  return sendSuccess(response, "Block request created successfully", result, 201);
});

const updateBlockRequest = asyncHandler(async (request, response) => {
  const input = validateBlockRequestPayload(request.body, true);
  const result = await blockRequestService.updateBlockRequest(request.params.id, input);
  return sendSuccess(response, "Block request updated successfully", result);
});

module.exports = { createBlockRequest, updateBlockRequest };
