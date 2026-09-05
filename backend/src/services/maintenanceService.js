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

const priorityRanges = {
  LOW: { lt: 50 },
  MEDIUM: { gte: 50, lt: 75 },
  HIGH: { gte: 75, lt: 90 },
  CRITICAL: { gte: 90 },
};

async function listMaintenanceTasks(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const department = parseOptionalString(query.department, "department");
  const section = parseOptionalString(query.section, "section");
  const status = parseEnum(query.status, MaintenanceTaskStatus, "status");
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

  const [total, items] = await prisma.$transaction([
    prisma.maintenanceTask.count({ where }),
    prisma.maintenanceTask.findMany({
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
    }),
  ]);

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
  const references = await Promise.all([
    data.assetId ? prisma.asset.findUnique({ where: { id: data.assetId } }) : null,
    data.departmentId ? prisma.department.findUnique({ where: { id: data.departmentId } }) : null,
    data.sectionId ? prisma.section.findUnique({ where: { id: data.sectionId } }) : null,
  ]);

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
  return prisma.maintenanceTask.create({
    data,
    include: {
      asset: { select: { assetCode: true, assetType: true } },
      department: { select: { code: true, name: true } },
      section: { select: { code: true, name: true } },
    },
  });
}

async function updateMaintenanceTask(id, data) {
  const existingTask = await getMaintenanceTaskById(id);
  await validateTaskReferences({
    assetId: data.assetId || existingTask.assetId,
    departmentId: data.departmentId || existingTask.departmentId,
    sectionId: data.sectionId || existingTask.sectionId,
  });
  return prisma.maintenanceTask.update({
    where: { id },
    data,
    include: {
      asset: { select: { assetCode: true, assetType: true } },
      department: { select: { code: true, name: true } },
      section: { select: { code: true, name: true } },
    },
  });
}

module.exports = {
  createMaintenanceTask,
  getMaintenanceTaskById,
  listMaintenanceTasks,
  updateMaintenanceTask,
};