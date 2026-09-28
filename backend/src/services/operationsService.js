const prisma = require("../database/prisma");

async function listCorridors() {
  const items = await prisma.corridor.findMany({ orderBy: { corridorCode: "asc" }, include: { section: { select: { code: true, name: true } } } });
  return { items, isDemoData: items.every((item) => item.sourceSystem.includes("SYNTHETIC")) };
}

async function listConflicts(query) {
  const [schedules, windows, plans] = await Promise.all([
    prisma.trainSchedule.findMany({ include: { train: { select: { trainNumber: true, name: true } }, section: { select: { code: true, name: true } } } }),
    prisma.blockWindow.findMany({ include: { section: { select: { code: true, name: true } } } }),
    prisma.blockPlan.findMany({ where: { status: { not: "CANCELLED" } }, include: { section: { select: { code: true, name: true } } } }),
  ]);
  const conflicts = [];
  for (const schedule of schedules) {
    for (const window of windows) {
      if (overlaps(schedule, window)) conflicts.push(buildConflict("BLOCK_WINDOW_TRAIN_OVERLAP", schedule, window, "Synthetic overlap derived from timetable and block-window records."));
    }
    for (const plan of plans) {
      if (overlaps(schedule, plan)) conflicts.push(buildConflict("BLOCK_PLAN_TRAIN_OVERLAP", schedule, plan, "Synthetic overlap derived from timetable and persisted plan records."));
    }
  }
  return { items: filterItems(conflicts, query), isDemoData: true };
}

async function listAlerts(query) {
  const [defects, tasks, conflicts] = await Promise.all([
    prisma.defect.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, severity: { in: ["HIGH", "CRITICAL"] } }, include: { asset: { select: { assetCode: true } } } }),
    prisma.maintenanceTask.findMany({ where: { overdueDays: { gt: 0 } }, select: { taskCode: true, overdueDays: true, severity: true } }),
    listConflicts({}),
  ]);
  const alerts = [
    ...defects.map((defect) => ({ alertCode: `SYN-DEFECT-${defect.id}`, severity: defect.severity, status: "OPEN", title: "Synthetic active critical defect", message: `Review active defect for ${defect.asset.assetCode}.`, sourceSystem: "SYNTHETIC_OPERATIONS" })),
    ...tasks.map((task) => ({ alertCode: `SYN-OVERDUE-${task.taskCode}`, severity: task.severity, status: "OPEN", title: "Synthetic overdue maintenance task", message: `${task.taskCode} is overdue by ${task.overdueDays} days.`, sourceSystem: "SYNTHETIC_OPERATIONS" })),
    ...conflicts.items.map((conflict) => ({ alertCode: `SYN-CONFLICT-${conflict.conflictCode}`, severity: conflict.severity, status: "OPEN", title: "Synthetic operational conflict", message: conflict.description, sourceSystem: "SYNTHETIC_OPERATIONS" })),
  ];
  return { items: filterItems(alerts, query), isDemoData: true };
}

function overlaps(left, right) {
  return left.sectionId === right.sectionId &&
    sameDate(left.date, right.date) &&
    minutes(left.arrivalTime || left.startTime) < minutes(right.endTime) &&
    minutes(left.departureTime || left.endTime) > minutes(right.startTime);
}

function buildConflict(type, schedule, block, description) {
  return {
    conflictCode: `SYN-${type}-${schedule.id}-${block.id}`,
    conflictType: type,
    severity: "HIGH",
    status: "OPEN",
    description,
    train: schedule.train,
    section: schedule.section,
    date: schedule.date,
    sourceSystem: "SYNTHETIC_OPERATIONS",
  };
}

function filterItems(items, query) {
  return items.filter((item) => (!query.status || item.status === String(query.status).toUpperCase()) && (!query.severity || item.severity === String(query.severity).toUpperCase()));
}

function sameDate(left, right) { return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10); }
function minutes(value) { return value.getUTCHours() * 60 + value.getUTCMinutes(); }

module.exports = { listAlerts, listConflicts, listCorridors };
