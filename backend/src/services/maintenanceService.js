const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const {
  buildPagination,
  parseDateOnly,
  parseEnum,
  parseOptionalString,
  parsePagination,
} = require("../validators/queryValidators");
const { DefectSeverity, MaintenanceTaskStatus, MaintenanceTaskType } = require("@prisma/client");
const { maintenanceStatusAliases } = require("../validators/maintenanceValidators");

const priorityRanges = {
  LOW: { lt: 50 },
  MEDIUM: { gte: 50, lt: 75 },
  HIGH: { gte: 75, lt: 90 },
  CRITICAL: { gte: 90 },
};

const allowedStatusTransitions = {
  PLANNED: new Set(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  IN_PROGRESS: new Set(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  COMPLETED: new Set(["COMPLETED", "IN_PROGRESS"]),
  CANCELLED: new Set(["CANCELLED"]),
};

async function listMaintenanceTasks(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const department = parseOptionalString(query.department, "department");
  const section = parseOptionalString(query.section, "section");
  const status = parseEnum(query.status, MaintenanceTaskStatus, "status", maintenanceStatusAliases);
  const severity = parseEnum(query.severity, DefectSeverity, "severity");
  const taskType = parseEnum(query.taskType, MaintenanceTaskType, "taskType");

  if (department) where.department = { code: department };
  if (section) where.section = { code: section };
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (taskType) where.taskType = taskType;

  if (query.priority !== undefined) {
    const priority = String(query.priority).toUpperCase();
    if (priorityRanges[priority]) {
      where.priorityScore = priorityRanges[priority];
    } else if (/^\d+(\.\d+)?$/.test(priority) && Number(priority) <= 100) {
      where.priorityScore = { gte: Number(priority) };
    } else {
      throw new AppError("priority must be LOW, MEDIUM, HIGH, CRITICAL, or a score from 0 to 100", 400);
    }
  }

  if (query.date !== undefined) {
    const date = parseDateOnly(query.date, "date");
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    where.dueDate = { gte: date, lt: nextDate };
  }

  const total = await prisma.maintenanceTask.count({ where });
  const items = await prisma.maintenanceTask.findMany({
    where,
    skip,
    take: limit,
    orderBy: [{ priorityScore: "desc" }, { dueDate: "asc" }],
    include: {
      asset: { select: { assetCode: true, assetType: true, criticality: true } },
      department: { select: { code: true, name: true } },
      section: { select: { code: true, name: true } },
      _count: { select: { scheduledTasks: true } },
    },
  });

  return { items, pagination: buildPagination(total, page, limit) };
}

async function getMaintenanceTaskById(id) {
  const task = await prisma.maintenanceTask.findUnique({
    where: { id },
    include: {
      asset: true,
      department: true,
      section: true,
      scheduledTasks: { include: { blockPlan: true } },
    },
  });

  if (!task) throw new AppError("Maintenance task not found", 404);
  return task;
}

async function validateTaskReferences(data) {
  const references = [];
  references.push(data.assetId ? await prisma.asset.findUnique({ where: { id: data.assetId } }) : null);
  references.push(data.departmentId ? await prisma.department.findUnique({ where: { id: data.departmentId } }) : null);
  references.push(data.sectionId ? await prisma.section.findUnique({ where: { id: data.sectionId } }) : null);

  if (data.assetId && !references[0]) throw new AppError("Asset not found", 400);
  if (data.departmentId && !references[1]) throw new AppError("Department not found", 400);
  if (data.sectionId && !references[2]) throw new AppError("Section not found", 400);

  if (data.assetId && data.departmentId && references[0].departmentId !== data.departmentId) {
    throw new AppError("Asset does not belong to the selected department", 400);
  }
  if (data.assetId && data.sectionId && references[0].sectionId !== data.sectionId) {
    throw new AppError("Asset does not belong to the selected section", 400);
  }
}

async function createMaintenanceTask(data) {
  await validateTaskReferences(data);
  const task = await prisma.maintenanceTask.create({ data });
  return getMaintenanceTaskById(task.id);
}

async function updateMaintenanceTask(id, data) {
  const existingTask = await getMaintenanceTaskById(id);
  await validateTaskReferences({
    assetId: data.assetId || existingTask.assetId,
    departmentId: data.departmentId || existingTask.departmentId,
    sectionId: data.sectionId || existingTask.sectionId,
  });
  if (data.status && !allowedStatusTransitions[existingTask.status]?.has(data.status)) {
    throw new AppError(`Invalid maintenance status transition: ${existingTask.status} -> ${data.status}`, 400);
  }
  await prisma.maintenanceTask.update({ where: { id }, data });
  return getMaintenanceTaskById(id);
}

async function getMaintenanceHistory(id) {
  const task = await prisma.maintenanceTask.findUnique({ where: { id }, select: { id: true, assetId: true } });
  if (!task) throw new AppError("Maintenance task not found", 404);
  const items = await prisma.maintenanceHistory.findMany({
    where: { OR: [{ maintenanceTaskId: task.id }, { assetId: task.assetId }] },
    orderBy: { completedAt: "desc" },
  });
  return { items, isDemoData: items.some((item) => item.sourceSystem.startsWith("SYNTHETIC")) };
}

async function getAssetHistory(id) {
  const asset = await prisma.asset.findUnique({ where: { id }, select: { id: true } });
  if (!asset) throw new AppError("Asset not found", 404);
  const items = await prisma.maintenanceHistory.findMany({ where: { assetId: asset.id }, orderBy: { completedAt: "desc" } });
  return { items, isDemoData: items.some((item) => item.sourceSystem.startsWith("SYNTHETIC")) };
}

module.exports = {
  createMaintenanceTask,
  getMaintenanceTaskById,
  getMaintenanceHistory,
  getAssetHistory,
  listMaintenanceTasks,
  updateMaintenanceTask,
};