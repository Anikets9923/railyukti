const prisma = require("../database/prisma");
const { MaintenanceTaskStatus } = require("@prisma/client");

const pendingTaskStatuses = [MaintenanceTaskStatus.PLANNED, MaintenanceTaskStatus.IN_PROGRESS];
async function getDashboardAnalytics() {
  const today = startOfToday();

  const [
    totalMaintenanceTasks,
    pendingTasks,
    criticalTasks,
    overdueTasks,
    scheduledTaskRecords,
    unscheduledTasks,
    totalBlockWindows,
    departments,
    blockWindows,
    blockPlans,
  ] = await Promise.all([
    prisma.maintenanceTask.count(),
    prisma.maintenanceTask.count({ where: { status: { in: pendingTaskStatuses } } }),
    prisma.maintenanceTask.count({ where: { severity: "CRITICAL" } }),
    prisma.maintenanceTask.count({
      where: {
        OR: [{ overdueDays: { gt: 0 } }, { dueDate: { lt: today } }],
      },
    }),
    prisma.scheduledTask.findMany({
      select: { maintenanceTaskId: true },
    }),
    prisma.maintenanceTask.count({
      where: { scheduledTasks: { none: {} } },
    }),
    prisma.blockWindow.count(),
    prisma.department.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        _count: { select: { maintenanceTasks: true } },
      },
    }),
    prisma.blockWindow.findMany({
      select: { sectionId: true, date: true, startTime: true, endTime: true },
    }),
    prisma.blockPlan.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        sectionId: true,
        date: true,
        startTime: true,
        endTime: true,
        utilization: true,
      },
    }),
  ]);

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

module.exports = { getDashboardAnalytics };