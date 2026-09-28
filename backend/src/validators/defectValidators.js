const { DefectSeverity, DefectStatus } = require("@prisma/client");
const AppError = require("../utils/appError");
const { parseDateOnly, parseEnum } = require("./queryValidators");

function validateDefectPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  const assetId = body.assetId || body.asset_id;
  const assetCode = body.assetCode || body.asset_code;
  const description = body.description;
  if (!assetId && !assetCode) throw new AppError("assetId or assetCode is required", 400);
  if (!description || !String(description).trim()) throw new AppError("description is required", 400);

  const data = {
    assetId: assetId ? String(assetId).trim() : undefined,
    assetCode: assetCode ? String(assetCode).trim() : undefined,
    description: String(description).trim(),
    severity: parseEnum(body.severity || "MEDIUM", DefectSeverity, "severity"),
    status: parseEnum(body.status || "OPEN", DefectStatus, "status"),
    detectedAt: body.reportedAt || body.reported_at
      ? parseDateTime(body.reportedAt || body.reported_at)
      : undefined,
    departmentId: body.departmentId || body.department_id,
    sectionId: body.sectionId || body.section_id,
    sourceSystem: body.sourceSystem || body.source_system || "SYNTHETIC_FIELD",
    defectCode: body.defectCode || body.defect_code,
  };

  if (data.detectedAt === null) throw new AppError("reportedAt must be a valid ISO timestamp", 400);
  if (!data.defectCode) throw new AppError("defectCode is required", 400);
  return data;
}

function parseDateTime(value) {
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

module.exports = { validateDefectPayload };
