const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const {
  buildPagination,
  parseDateOnly,
  parseEnum,
  parseOptionalString,
  parsePagination,
} = require("../validators/queryValidators");
const { BlockPlanStatus, BlockWindowStatus, MaintenanceTaskStatus } = require("@prisma/client");
const aiService = require("./ai.service");

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

async function generatePlan({ startDate, endDate, departments }) {
  const departmentRecords = await prisma.department.findMany({
    where: { code: { in: departments } },
    select: { id: true, code: true },
  });
  const knownDepartments = new Set(departmentRecords.map((department) => department.code));
  const unknownDepartments = departments.filter((department) => !knownDepartments.has(department));
  if (unknownDepartments.length > 0) {
    throw new AppError(`Unknown departments: ${unknownDepartments.join(", ")}`, 400);
  }

  const endExclusive = addDays(endDate, 1);
  const maintenanceTasks = await prisma.maintenanceTask.findMany({
    where: {
      department: { code: { in: departments } },
      status: { in: [MaintenanceTaskStatus.PLANNED, MaintenanceTaskStatus.IN_PROGRESS] },
      dueDate: { lte: endDate },
    },
    include: {
      asset: { select: { id: true, assetCode: true, criticality: true, sectionId: true } },
      department: { select: { code: true } },
      section: { select: { code: true } },
    },
    orderBy: [{ priorityScore: "desc" }, { dueDate: "asc" }],
  });

  const assetIds = maintenanceTasks.map((task) => task.assetId);
  const [assets, trainSchedules, blockWindows] = await Promise.all([
    prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, assetCode: true, criticality: true, sectionId: true },
    }),
    prisma.trainSchedule.findMany({
      where: { date: { gte: startDate, lt: endExclusive } },
      select: { sectionId: true, date: true, arrivalTime: true, departureTime: true },
    }),
    prisma.blockWindow.findMany({
      where: {
        date: { gte: startDate, lt: endExclusive },
        status: BlockWindowStatus.AVAILABLE,
      },
      include: { section: { select: { code: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const trafficBySection = countTrafficBySection(trainSchedules);
  const aiInput = maintenanceTasks.map((task) => ({
    taskId: task.id,
    assetCriticality: task.asset.criticality,
    severity: task.severity,
    urgency: calculateUrgency(task.dueDate, startDate),
    overdueDays: task.overdueDays,
    trafficImpact: Math.min(100, (trafficBySection[task.sectionId] || 0) * 20),
  }));
  const priorityResponse = await aiService.prioritizeTasks(aiInput);
  const priorityByTaskId = new Map(priorityResponse.results.map((result) => [String(result.taskId), result]));

  await prisma.$transaction(
    maintenanceTasks
      .filter((task) => priorityByTaskId.has(task.id))
      .map((task) => prisma.maintenanceTask.update({
        where: { id: task.id },
        data: { priorityScore: priorityByTaskId.get(task.id).priorityScore },
      })),
  );

  const candidates = maintenanceTasks.map((task) => ({
    ...task,
    priorityScore: priorityByTaskId.get(task.id)?.priorityScore ?? task.priorityScore ?? 0,
  })).sort((left, right) => right.priorityScore - left.priorityScore);
  const assignments = buildAssignments(candidates, blockWindows, trainSchedules);
  const createdPlans = await createPlans(assignments);

  return {
    dateRange: { startDate, endDate },
    departments,
    tasksConsidered: maintenanceTasks.length,
    assetsConsidered: assets.length,
    trainSchedulesConsidered: trainSchedules.length,
    blockWindowsConsidered: blockWindows.length,
    tasksScheduled: assignments.reduce((total, assignment) => total + assignment.tasks.length, 0),
    plansCreated: createdPlans.length,
    plans: createdPlans,
  };
}

function buildAssignments(tasks, blockWindows, trainSchedules) {
  const assignments = [];
  const assignedTaskIds = new Set();

  for (const blockWindow of blockWindows) {
    if (hasTrainConflict(blockWindow, trainSchedules)) continue;

    const windowTasks = [];
    let usedMinutes = 0;
    for (const task of tasks) {
      if (assignedTaskIds.has(task.id) || task.sectionId !== blockWindow.sectionId) continue;
      if (usedMinutes + task.estimatedDuration > blockWindow.maxDuration) continue;
      windowTasks.push(task);
      assignedTaskIds.add(task.id);
      usedMinutes += task.estimatedDuration;
    }

    if (windowTasks.length > 0) {
      assignments.push({ blockWindow, tasks: windowTasks, usedMinutes });
    }
  }

  return assignments;
}

async function createPlans(assignments) {
  const createdPlans = [];
  for (const assignment of assignments) {
    const { blockWindow, tasks, usedMinutes } = assignment;
    const startMinutes = toMinutes(blockWindow.startTime);
    const endMinutes = startMinutes + usedMinutes;
    const plan = await prisma.$transaction(async (transaction) => {
      const blockPlan = await transaction.blockPlan.create({
        data: {
          sectionId: blockWindow.sectionId,
          date: blockWindow.date,
          startTime: blockWindow.startTime,
          endTime: fromMinutes(endMinutes),
          status: BlockPlanStatus.OPTIMIZED,
          utilization: usedMinutes / blockWindow.maxDuration,
          priority: Math.max(...tasks.map((task) => Math.round(task.priorityScore))),
          optimizationScore: Math.round((usedMinutes / blockWindow.maxDuration) * 100),
        },
      });

      let cursorMinutes = startMinutes;
      for (const task of tasks) {
        const taskStart = combineDateAndMinutes(blockWindow.date, cursorMinutes);
        cursorMinutes += task.estimatedDuration;
        const taskEnd = combineDateAndMinutes(blockWindow.date, cursorMinutes);
        await transaction.scheduledTask.create({
          data: {
            maintenanceTaskId: task.id,
            blockPlanId: blockPlan.id,
            startTime: taskStart,
            endTime: taskEnd,
          },
        });
      }

      return transaction.blockPlan.findUnique({
        where: { id: blockPlan.id },
        include: { scheduledTasks: true, section: { select: { code: true, name: true } } },
      });
    });
    createdPlans.push(plan);
  }
  return createdPlans;
}

function hasTrainConflict(blockWindow, trainSchedules) {
  const windowStart = toMinutes(blockWindow.startTime);
  const windowEnd = toMinutes(blockWindow.endTime);
  return trainSchedules.some((schedule) => {
    if (schedule.sectionId !== blockWindow.sectionId || !sameDate(schedule.date, blockWindow.date)) return false;
    return windowStart < toMinutes(schedule.departureTime) && windowEnd > toMinutes(schedule.arrivalTime);
  });
}

function countTrafficBySection(trainSchedules) {
  return trainSchedules.reduce((counts, schedule) => {
    counts[schedule.sectionId] = (counts[schedule.sectionId] || 0) + 1;
    return counts;
  }, {});
}

function calculateUrgency(dueDate, startDate) {
  const daysUntilDue = Math.ceil((startDate.getTime() - dueDate.getTime()) / 86400000);
  return Math.min(100, Math.max(0, 50 + daysUntilDue * 10));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function sameDate(left, right) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function toMinutes(value) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function fromMinutes(minutes) {
  return new Date(Date.UTC(1970, 0, 1, Math.floor(minutes / 60), minutes % 60));
}

function combineDateAndMinutes(date, minutes) {
  const result = new Date(date);
  result.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

module.exports = { generatePlan, getBlockPlanById, listBlockPlans };