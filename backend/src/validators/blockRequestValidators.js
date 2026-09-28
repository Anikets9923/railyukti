const AppError = require("../utils/appError");

function validateBlockRequestPayload(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  const fields = {
    corridorCode: body.corridorCode || body.corridor,
    requestedWindow: body.requestedWindow || body.window,
    requestedFor: body.requestedFor,
    impact: body.impact,
    department: body.department,
    status: body.status,
  };
  if (!partial) {
    for (const field of ["corridorCode", "requestedWindow", "requestedFor", "impact", "department"]) {
      const value = fields[field];
      if (value === undefined || value === "") throw new AppError(`${field} is required`, 400);
    }
  }

  if (fields.requestedWindow !== undefined && !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(String(fields.requestedWindow))) {
    throw new AppError("window must use HH:MM-HH:MM format", 400);
  }

  if (fields.status !== undefined && !["PENDING", "PENDING_REVIEW", "REJECTED", "CANCELLED"].includes(String(fields.status).trim().toUpperCase())) {
    throw new AppError("status must be PENDING_REVIEW, REJECTED, or CANCELLED", 400);
  }

  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value).trim()]));
}

module.exports = { validateBlockRequestPayload };
