const AppError = require("../utils/appError");

function parsePagination(query) {
  const page = parseInteger(query.page, "page", 1);
  const limit = parseInteger(query.limit, "limit", 20, 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function parseInteger(value, fieldName, defaultValue, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) {
    return defaultValue;
  }

  if (!/^\d+$/.test(String(value))) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }

  const parsedValue = Number(value);
  if (parsedValue < 1 || parsedValue > maximum) {
    throw new AppError(`${fieldName} must be between 1 and ${maximum}`, 400);
  }

  return parsedValue;
}

function parseDateOnly(value, fieldName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new AppError(`${fieldName} must use YYYY-MM-DD format`, 400);
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }

  return parsedDate;
}

function parseOptionalDate(query, fieldName) {
  return query[fieldName] === undefined ? undefined : parseDateOnly(query[fieldName], fieldName);
}

function parseEnum(value, enumValues, fieldName, aliases = {}) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedInput = String(value).trim().toUpperCase();
  const normalizedValue = aliases[normalizedInput] || normalizedInput;
  if (!Object.values(enumValues).includes(normalizedValue)) {
    throw new AppError(`${fieldName} must be one of: ${Object.values(enumValues).join(", ")}`, 400);
  }

  return normalizedValue;
}

function parseOptionalString(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  const parsedValue = String(value).trim();
  if (!parsedValue) {
    throw new AppError(`${fieldName} must not be empty`, 400);
  }

  return parsedValue;
}

function buildPagination(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

module.exports = {
  buildPagination,
  parseDateOnly,
  parseEnum,
  parseOptionalDate,
  parseOptionalString,
  parsePagination,
};