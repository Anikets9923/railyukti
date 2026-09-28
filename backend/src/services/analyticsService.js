const prisma = require("../database/prisma");
const { MaintenanceTaskStatus } = require("@prisma/client");

const pendingTaskStatuses = [MaintenanceTaskStatus.PLANNED, MaintenanceTaskStatus.IN_PROGRESS];
async function getDashboardAnalytics() {
  const today = startOfToday();

  const totalMaintenanceTasks = await prisma.maintenanceTask.count();
  const pendingTasks = await prisma.maintenanceTask.count({ where: { status: { in: pendingTaskStatuses } } });
  const criticalTasks = await prisma.maintenanceTask.count({ where: { severity: "CRITICAL" } });
  const overdueTasks = await prisma.maintenanceTask.count({
    where: { OR: [{ overdueDays: { gt: 0 } }, { dueDate: { lt: today } }] },
  });
  const scheduledTaskRecords = await prisma.scheduledTask.findMany({ select: { maintenanceTaskId: true } });
  const unscheduledTasks = await prisma.maintenanceTask.count({ where: { scheduledTasks: { none: {} } } });
  const totalBlockWindows = await prisma.blockWindow.count();
  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, _count: { select: { maintenanceTasks: true } } },
  });
  const blockWindows = await prisma.blockWindow.findMany({
    select: { sectionId: true, date: true, startTime: true, endTime: true },
  });
  const blockPlans = await prisma.blockPlan.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { sectionId: true, date: true, startTime: true, endTime: true, utilization: true },
  });

  const scheduledByDepartment = await getScheduledTaskCountsByDepartment();
  const scheduledTaskIds = new Set(scheduledTaskRecords.map((record) => record.maintenanceTaskId));
  const usedWindowCount = blockWindows.filter((window) => blockPlans.some((plan) => isPlanWithinWindow(plan, window))).length;
  const averageBlockUtilization = average(
    blockPlans.map((plan) => plan.utilization).filter((utilization) => utilization !== null),
  ) * 100;

  return {
    totalMaintenanceTasks,
    pendingTasks,
    criticalTasks,
    overdueTasks,
    scheduledTasks: scheduledTaskIds.size,
    unscheduledTasks,
    totalBlockWindows,
    usedBlockWindows: usedWindowCount,
    averageBlockUtilization,
    departmentTaskCounts: departments.map((department) => ({
      departmentCode: department.code,
      departmentName: department.name,
      taskCount: department._count.maintenanceTasks,
      scheduledTaskCount: scheduledByDepartment.get(department.id) || 0,
    })),
  };
}

async function getOptimizationAnalytics(id) {
  const plan = await prisma.blockPlan.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      status: true,
      utilization: true,
      optimizationScore: true,
      priority: true,
      section: { select: { code: true, name: true } },
      scheduledTasks: {
        select: { id: true, maintenanceTaskId: true, startTime: true, endTime: true },
      },
    },
  });

  if (!plan) {
    const AppError = require("../utils/appError");
    throw new AppError("Block plan not found", 404);
  }

  const totalScheduledMinutes = plan.scheduledTasks.reduce(
    (total, task) => total + (task.endTime.getTime() - task.startTime.getTime()) / 60000,
    0,
  );

  return {
    planId: plan.id,
    section: plan.section,
    date: plan.date,
    status: plan.status,
    utilization: (plan.utilization || 0) * 100,
    optimizationScore: plan.optimizationScore || 0,
    priority: plan.priority,
    scheduledTaskCount: new Set(plan.scheduledTasks.map((task) => task.maintenanceTaskId)).size,
    totalScheduledMinutes,
  };
}

async function listDepartmentPerformance(query) {
  const where = {};
  if (query.department) where.department = { code: String(query.department).trim().toUpperCase() };
  if (query.periodType) where.periodType = String(query.periodType).trim().toUpperCase();
  const items = await prisma.departmentPerformance.findMany({
    where,
    orderBy: [{ periodStart: "desc" }, { department: { code: "asc" } }],
    include: { department: { select: { code: true, name: true } } },
  });
  return { items, isDemoData: items.every((item) => item.sourceSystem.includes("SYNTHETIC")) };
}

async function getScheduledTaskCountsByDepartment() {
  const groupedTasks = await prisma.maintenanceTask.groupBy({
    by: ["departmentId"],
    where: { scheduledTasks: { some: {} } },
    _count: { _all: true },
  });

  return new Map(groupedTasks.map((group) => [group.departmentId, group._count._all]));
}

function isPlanWithinWindow(plan, window) {
  return plan.sectionId === window.sectionId &&
    sameDate(plan.date, window.date) &&
    toMinutes(plan.startTime) >= toMinutes(window.startTime) &&
    toMinutes(plan.endTime) <= toMinutes(window.endTime);
}

function startOfToday() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function sameDate(left, right) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function toMinutes(value) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

module.exports = { getDashboardAnalytics, getOptimizationAnalytics, listDepartmentPerformance };