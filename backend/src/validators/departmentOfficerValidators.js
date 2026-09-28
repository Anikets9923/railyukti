const AppError = require("../utils/appError");

function validateDecisionPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Request body must be a JSON object", 400);
  }
  const action = String(body.action || body.decision || "").trim().toUpperCase();
  if (!["APPROVE", "APPROVED", "REJECT", "REJECTED"].includes(action)) {
    throw new AppError("action must be APPROVE or REJECT", 400);
  }
  return {
    status: action.startsWith("APPRO") ? "APPROVED" : "REJECTED",
    decisionNote: body.decisionNote || body.note || null,
    requestedByRole: body.requestedByRole || "DEPARTMENT_OFFICER",
  };
}

module.exports = { validateDecisionPayload };
