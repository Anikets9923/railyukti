const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const {
  buildPagination,
  parseDateOnly,
  parseEnum,
  parseOptionalString,
  parsePagination,
} = require("../validators/queryValidators");
const { BlockWindowStatus } = require("@prisma/client");

async function listBlockWindows(query, onlyAvailable = false) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const section = parseOptionalString(query.section, "section");
  const status = parseEnum(query.status, BlockWindowStatus, "status");
  if (section) where.section = { code: section };
  if (onlyAvailable) where.status = BlockWindowStatus.AVAILABLE;
  else if (status) where.status = status;
  if (query.date !== undefined) where.date = parseDateOnly(query.date, "date");

  const total = await prisma.blockWindow.count({ where });
  const items = await prisma.blockWindow.findMany({
    where,
    skip,
    take: limit,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: { section: { select: { code: true, name: true } } },
  });
  return { items, pagination: buildPagination(total, page, limit) };
}

async function getBlockWindowById(id) {
  const blockWindow = await prisma.blockWindow.findUnique({
    where: { id },
    include: { section: { select: { code: true, name: true } } },
  });
  if (!blockWindow) throw new AppError("Block window not found", 404);
  return blockWindow;
}

module.exports = { getBlockWindowById, listBlockWindows };