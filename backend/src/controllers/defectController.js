const asyncHandler = require("../middleware/asyncHandler");
const defectService = require("../services/defectService");
const { validateDefectPayload } = require("../validators/defectValidators");
const { sendSuccess } = require("../utils/apiResponse");

const createDefect = asyncHandler(async (request, response) => {
  const data = validateDefectPayload(request.body);
  const defect = await defectService.createDefect(data);
  return sendSuccess(response, "Defect created successfully", defect, 201);
});

module.exports = { createDefect };
