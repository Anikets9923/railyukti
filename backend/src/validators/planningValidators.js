const AppError = require("../utils/appError");
const { parseDateOnly } = require("./queryValidators");

function validateGeneratePlanPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  if (body.startDate === undefined || body.endDate === undefined) {
    throw new AppError("startDate and endDate are required", 400);
  }

  const startDate = parseDateOnly(body.startDate, "startDate");
  const endDate = parseDateOnly(body.endDate, "endDate");
  if (endDate < startDate) {
    throw new AppError("endDate must be on or after startDate", 400);
  }

  if (!Array.isArray(body.departments) || body.departments.length === 0) {
    throw new AppError("departments must be a non-empty array", 400);
  }

  const departments = body.departments.map((department) => String(department).trim().toUpperCase());
  if (departments.some((department) => !department)) {
    throw new AppError("departments must contain non-empty department codes", 400);
  }

  return { startDate, endDate, departments: [...new Set(departments)] };
}

module.exports = { validateGeneratePlanPayload };