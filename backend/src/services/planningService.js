const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const {
  buildPagination,
  parseDateOnly,
  parseEnum,
  parseOptionalString,
  parsePagination,
} = require("../validators/queryValidators");
const { BlockPlanStatus } = require("@prisma/client");

async function listBlockPlans(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const section = parseOptionalString(query.section, "section");
  const status = parseEnum(query.status, BlockPlanStatus, "status");
  if (section) where.section = { code: section };
  if (status) where.status = status;
  if (query.date !== undefined) where.date = parseDateOnly(query.date, "date");

  const [total, items] = await prisma.$transaction([
    prisma.blockPlan.count({ where }),
    prisma.blockPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ date: "asc" }, { priority: "desc" }],
      include: {
        section: { select: { code: true, name: true } },
        _count: { select: { scheduledTasks: true } },
      },
    }),
  ]);
  return { items, pagination: buildPagination(total, page, limit) };
}

async function getBlockPlanById(id) {
  const plan = await prisma.blockPlan.findUnique({
    where: { id },
    include: {
      section: { select: { code: true, name: true } },
      scheduledTasks: {
        orderBy: { startTime: "asc" },
        include: {
          maintenanceTask: {
            select: { taskCode: true, description: true, severity: true, priorityScore: true },
          },
        },
      },
    },
  });
  if (!plan) throw new AppError("Block plan not found", 404);
  return plan;
}

module.exports = { getBlockPlanById, listBlockPlans };