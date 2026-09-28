const prisma = require("../database/prisma");
const { parseDateOnly, parseOptionalString, parsePagination, buildPagination } = require("../validators/queryValidators");

async function listRecommendations(query) {
  const department = parseOptionalString(query.department, "department");
  const where = department ? { department: { code: department } } : {};
  const persisted = await prisma.recommendation.findMany({
    where,
    orderBy: [{ priorityScore: "desc" }, { generatedAt: "desc" }],
    include: { asset: { select: { assetCode: true, assetType: true } }, maintenanceTask: { select: { taskCode: true, description: true, priorityScore: true } }, department: { select: { code: true, name: true } } },
  });
  if (persisted.length > 0) return { items: persisted, isDemoData: persisted.every((item) => item.sourceSystem.includes("SYNTHETIC")) };

  const tasks = await prisma.maintenanceTask.findMany({
    where,
    orderBy: [{ priorityScore: "desc" }, { dueDate: "asc" }],
    take: 20,
    include: { asset: { select: { assetCode: true, assetType: true } }, department: { select: { code: true, name: true } } },
  });
  return {
    items: tasks.map((task) => ({
      recommendationCode: `DEMO-REC-${task.taskCode}`,
      maintenanceTask: { taskCode: task.taskCode, description: task.description, priorityScore: task.priorityScore },
      asset: task.asset,
      department: task.department,
      title: "Deterministic demo maintenance recommendation",
      rationale: "Synthetic recommendation derived from stored task priority and due date.",
      priorityScore: task.priorityScore || 0,
      status: "OPEN",
      sourceSystem: "SYNTHETIC_AI_DEMO",
    })),
    isDemoData: true,
  };
}

async function listWeeklyPlans(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const section = parseOptionalString(query.section, "section");
  const department = parseOptionalString(query.department, "department");
  if (section) where.section = { code: section };
  if (department) where.section = { ...where.section, assets: { some: { department: { code: department } } } };
  const from = query.from ? parseDateOnly(query.from, "from") : undefined;
  const to = query.to ? parseDateOnly(query.to, "to") : undefined;
  if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  const total = await prisma.blockPlan.count({ where });
  const items = await prisma.blockPlan.findMany({ where, skip, take: limit, orderBy: [{ date: "asc" }, { priority: "desc" }], include: { section: { select: { code: true, name: true } }, scheduledTasks: { include: { maintenanceTask: { select: { taskCode: true, description: true, priorityScore: true } } } } } });
  return { items, pagination: buildPagination(total, page, limit) };
}

async function listPeriodPlans(query, periodDays) {
  if (!query.from && !query.to) return listWeeklyPlans(query);
  const from = query.from ? parseDateOnly(query.from, "from") : parseDateOnly(query.to, "to");
  const to = query.to ? parseDateOnly(query.to, "to") : new Date(from);
  if (!query.to) to.setUTCDate(to.getUTCDate() + periodDays - 1);
  return listWeeklyPlans({ ...query, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
}

module.exports = { listMonthlyPlans: (query) => listPeriodPlans(query, 30), listRecommendations, listWeeklyPlans };
