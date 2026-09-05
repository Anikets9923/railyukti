const {
  DefectSeverity,
  MaintenanceTaskStatus,
  MaintenanceTaskType,
} = require("@prisma/client");
const AppError = require("../utils/appError");
const { parseDateOnly, parseEnum } = require("./queryValidators");

const requiredFields = [
  "taskCode",
  "assetId",
  "departmentId",
  "sectionId",
  "taskType",
  "description",
  "severity",
  "dueDate",
  "estimatedDuration",
];

function validateMaintenancePayload(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  if (!partial) {
    const missingFields = requiredFields.filter((field) => body[field] === undefined);
    if (missingFields.length > 0) {
      throw new AppError(`Missing required fields: ${missingFields.join(", ")}`, 400);
    }
  } else if (Object.keys(body).length === 0) {
    throw new AppError("At least one field is required for update", 400);
  }

  const data = {};
  const stringFields = ["taskCode", "assetId", "departmentId", "sectionId", "description"];
  for (const field of stringFields) {
    if (body[field] !== undefined) {
      const value = String(body[field]).trim();
      if (!value) {
        throw new AppError(`${field} must not be empty`, 400);
      }
      data[field] = value;
    }
  }

  if (body.taskType !== undefined) {
    data.taskType = parseEnum(body.taskType, MaintenanceTaskType, "taskType");
  }
  if (body.severity !== undefined) {
    data.severity = parseEnum(body.severity, DefectSeverity, "severity");
  }
  if (body.status !== undefined) {
    data.status = parseEnum(body.status, MaintenanceTaskStatus, "status");
  }
  if (body.dueDate !== undefined) {
    data.dueDate = parseDateOnly(body.dueDate, "dueDate");
  }
  if (body.priorityScore !== undefined) {
    data.priorityScore = parseNumber(body.priorityScore, "priorityScore", 0, 100);
  }
  if (body.overdueDays !== undefined) {
    data.overdueDays = parseNumber(body.overdueDays, "overdueDays", 0);
  }
  if (body.estimatedDuration !== undefined) {
    data.estimatedDuration = parseNumber(body.estimatedDuration, "estimatedDuration", 1);
  }
  if (body.crewRequired !== undefined) {
    data.crewRequired = parseNumber(body.crewRequired, "crewRequired", 1);
  }

  return data;
}

function parseNumber(value, fieldName, minimum, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === "" || !Number.isInteger(Number(value))) {
    throw new AppError(`${fieldName} must be an integer`, 400);
  }

  const parsedValue = Number(value);
  if (parsedValue < minimum || parsedValue > maximum) {
    throw new AppError(`${fieldName} must be between ${minimum} and ${maximum}`, 400);
  }

  return parsedValue;
}

module.exports = { validateMaintenancePayload };