require("dotenv/config");

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { after, before, test } = require("node:test");
const path = require("node:path");

process.env.MOCK_AI_MODE = "true";

const app = require("../src/app");
const prisma = require("../src/database/prisma");

let server;
let baseUrl;
let asset;
let maintenanceTask;
let train;
let blockWindow;
let generatedPlan;

const validPlanningRequest = {
  startDate: "2026-09-07",
  endDate: "2026-09-13",
  departments: ["ENG", "TRD", "SNT"],
};

before(async () => {
  execFileSync(process.execPath, ["prisma/seed/seed.js"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "ignore",
  });
  execFileSync(process.execPath, ["seed/import-dataset.js"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "ignore",
  });

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await prisma.$disconnect();
});

async function request(url, options = {}) {
  const response = await fetch(`${baseUrl}${url}`, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  return { response, body };
}

function jsonBody(value) {
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  };
}

test("GET /api/health returns the required health response", async () => {
  const { response, body } = await request("/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, message: "Backend is running" });
});

test("asset list and detail endpoints return related data", async () => {
  const list = await request("/api/assets?limit=2");
  assert.equal(list.response.status, 200);
  assert.equal(list.body.success, true);
  assert.equal(list.body.data.items.length, 2);
  asset = list.body.data.items[0];

  const detail = await request(`/api/assets/${asset.id}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.id, asset.id);
  assert.equal(detail.body.data.department.code, "ENG");
});

test("maintenance read, create, and update endpoints work", async () => {
  const list = await request("/api/maintenance?severity=CRITICAL&limit=5");
  assert.equal(list.response.status, 200);
  assert.ok(list.body.data.items.length > 0);
  maintenanceTask = list.body.data.items[0];

  const detail = await request(`/api/maintenance/${maintenanceTask.id}`);
  assert.equal(detail.response.status, 200);

  const create = await request("/api/maintenance", {
    method: "POST",
    ...jsonBody({
      taskCode: "TEST-API-TASK-001",
      assetId: asset.id,
      departmentId: asset.departmentId,
      sectionId: asset.sectionId,
      taskType: "INSPECTION",
      description: "Integration test maintenance task",
      severity: "LOW",
      dueDate: "2026-09-13",
      estimatedDuration: 30,
      crewRequired: 1,
    }),
  });
  assert.equal(create.response.status, 201);
  const createdId = create.body.data.id;

  const update = await request(`/api/maintenance/${createdId}`, {
    method: "PUT",
    ...jsonBody({ status: "COMPLETED", priorityScore: 20 }),
  });
  assert.equal(update.response.status, 200);
  assert.equal(update.body.data.status, "COMPLETED");

  const displayStatusUpdate = await request(`/api/maintenance/${createdId}`, {
    method: "PUT",
    ...jsonBody({ status: "In progress" }),
  });
  assert.equal(displayStatusUpdate.response.status, 200);
  assert.equal(displayStatusUpdate.body.data.status, "IN_PROGRESS");
});

test("field supervisor defect and maintenance history endpoints work", async () => {
  const defect = await request("/api/defects", {
    method: "POST",
    ...jsonBody({
      defect_code: "DEF-API-FIELD-001",
      asset_code: asset.assetCode,
      description: "Synthetic field supervisor defect report",
      severity: "HIGH",
      status: "OPEN",
      reported_at: "2026-09-20T09:00:00Z",
      source_system: "SYNTHETIC_FIELD",
    }),
  });
  assert.equal(defect.response.status, 201);
  assert.equal(defect.body.data.defectCode, "DEF-API-FIELD-001");

  const historicalTask = await prisma.maintenanceTask.findUnique({ where: { taskCode: "MNT-0002" } });
  const taskHistory = await request(`/api/maintenance/${historicalTask.id}/history`);
  assert.equal(taskHistory.response.status, 200);
  assert.equal(taskHistory.body.data.isDemoData, true);

  const assetHistory = await request(`/api/assets/${asset.id}/history`);
  assert.equal(assetHistory.response.status, 200);
  assert.ok(Array.isArray(assetHistory.body.data.items));
});

test("train and schedule endpoints return paginated data", async () => {
  const list = await request("/api/trains?limit=2");
  assert.equal(list.response.status, 200);
  train = list.body.data.items[0];

  const detail = await request(`/api/trains/${train.id}`);
  assert.equal(detail.response.status, 200);
  assert.ok(Array.isArray(detail.body.data.schedules));

  const schedules = await request("/api/trains/schedule?date=2026-09-06");
  assert.equal(schedules.response.status, 200);
  assert.ok(schedules.body.data.items.length > 0);

  const timetable = await request("/api/trains/timetable?date=2026-09-06");
  assert.equal(timetable.response.status, 200);
  assert.deepEqual(timetable.body.data.items, schedules.body.data.items);
});

test("block window endpoints return all and available windows", async () => {
  const list = await request("/api/blocks?limit=2");
  assert.equal(list.response.status, 200);
  blockWindow = list.body.data.items[0];

  const detail = await request(`/api/blocks/${blockWindow.id}`);
  assert.equal(detail.response.status, 200);

  const available = await request("/api/blocks/available");
  assert.equal(available.response.status, 200);
  assert.ok(available.body.data.items.every((item) => item.status === "AVAILABLE"));
});

test("department planner recommendations, weekly plans, and block requests work", async () => {
  const recommendations = await request("/api/planning/recommendations?department=TRD");
  assert.equal(recommendations.response.status, 200);
  assert.ok(Array.isArray(recommendations.body.data.items));

  const weekly = await request("/api/planning/weekly?from=2026-09-01&to=2026-09-30&department=TRD");
  assert.equal(weekly.response.status, 200);
  assert.ok(Array.isArray(weekly.body.data.items));

  const created = await request("/api/blocks", {
    method: "POST",
    ...jsonBody({
      corridor: "ALD-CNB",
      window: "22:40-00:10",
      requestedFor: "OHE mast inspection",
      impact: "2 train paths",
      department: "TRD",
    }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.data.status, "PENDING");
  assert.equal(created.body.data.requestStatus, "PENDING_REVIEW");

  const updated = await request(`/api/blocks/${created.body.data.id}`, {
    method: "PUT",
    ...jsonBody({ requestedFor: "Updated synthetic inspection" }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.requestedFor, "Updated synthetic inspection");

  const invalidApproval = await request(`/api/blocks/${created.body.data.id}`, {
    method: "PUT",
    ...jsonBody({ status: "APPROVED" }),
  });
  assert.equal(invalidApproval.response.status, 400);
});

test("department officer requests, decisions, and performance work", async () => {
  const requests = await request("/api/department-officer/requests?department=ENG&status=PENDING_REVIEW");
  assert.equal(requests.response.status, 200);
  assert.ok(requests.body.data.items.length > 0);
  const requestId = requests.body.data.items[0].id;

  const detail = await request(`/api/department-officer/requests/${requestId}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.requestStatus, "PENDING_REVIEW");

  const decision = await request(`/api/department-officer/requests/${requestId}/decision`, {
    method: "POST",
    ...jsonBody({ action: "REJECT", note: "Synthetic department-officer test decision" }),
  });
  assert.equal(decision.response.status, 200);
  assert.equal(decision.body.data.request.status, "REJECTED");
  assert.equal(decision.body.data.approval.status, "REJECTED");

  const performance = await request("/api/department-officer/performance?department=ENG");
  assert.equal(performance.response.status, 200);
  assert.ok(performance.body.data.items.length > 0);
});

test("divisional analytics, plans, approvals, and decisions work", async () => {
  const overview = await request("/api/analytics/overview");
  assert.equal(overview.response.status, 200);
  assert.equal(overview.body.data.totalMaintenanceTasks, overview.body.data.scheduledTasks + overview.body.data.unscheduledTasks);

  const performance = await request("/api/analytics/performance?periodType=WEEKLY");
  assert.equal(performance.response.status, 200);
  assert.ok(Array.isArray(performance.body.data.items));

  const weekly = await request("/api/planning/weekly");
  const monthly = await request("/api/planning/monthly");
  assert.equal(weekly.response.status, 200);
  assert.equal(monthly.response.status, 200);
  assert.ok(Array.isArray(weekly.body.data.items));
  assert.ok(Array.isArray(monthly.body.data.items));
});

test("resource-input APIs return imported failure, spare, and technician records", async () => {
  const risk = await request("/api/failure-risk?riskLevel=HIGH&limit=2");
  assert.equal(risk.response.status, 200);
  assert.ok(risk.body.data.items.every((item) => item.riskLevel === "HIGH"));
  const riskId = risk.body.data.items[0].id;

  const riskDetail = await request(`/api/failure-risk/${riskId}`);
  assert.equal(riskDetail.response.status, 200);

  const spares = await request("/api/spares?status=NOT_AVAILABLE&limit=2");
  assert.equal(spares.response.status, 200);
  assert.ok(spares.body.data.items.every((item) => item.availabilityStatus === "NOT_AVAILABLE"));

  const technicians = await request("/api/technicians/availability?status=AVAILABLE&limit=2");
  assert.equal(technicians.response.status, 200);
  assert.ok(technicians.body.data.items.every((item) => item.availabilityStatus === "AVAILABLE"));

  const task = await prisma.maintenanceTask.findFirst({ where: { taskCode: "MNT-0001" } });
  const assetResource = await request(`/api/assets/${task.assetId}/failure-risk`);
  const taskSpares = await request(`/api/maintenance/${task.id}/spares`);
  const taskTechnicians = await request(`/api/maintenance/${task.id}/technician-availability`);
  assert.equal(assetResource.response.status, 200);
  assert.equal(taskSpares.response.status, 200);
  assert.equal(taskTechnicians.response.status, 200);
});

test("planning generation persists a valid plan and scheduled tasks", async () => {
  const result = await request("/api/planning/generate", {
    method: "POST",
    ...jsonBody(validPlanningRequest),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.success, true);
  assert.ok(result.body.data.plansCreated > 0);
  generatedPlan = result.body.data.plans[0];

  const persistedPlan = await prisma.blockPlan.findUnique({
    where: { id: generatedPlan.id },
    include: { scheduledTasks: true },
  });
  assert.ok(persistedPlan);
  assert.ok(persistedPlan.scheduledTasks.length > 0);

  const maintenanceIds = new Set(
    (await prisma.maintenanceTask.findMany({ select: { id: true } })).map((task) => task.id),
  );
  const window = await prisma.blockWindow.findFirst({
    where: {
      sectionId: persistedPlan.sectionId,
      date: persistedPlan.date,
    },
  });
  assert.ok(window);
  assert.ok(toMinutes(persistedPlan.startTime) < toMinutes(persistedPlan.endTime));
  assert.ok(toMinutes(persistedPlan.endTime) <= toMinutes(window.endTime));

  let scheduledMinutes = 0;
  for (const scheduledTask of persistedPlan.scheduledTasks) {
    assert.ok(maintenanceIds.has(scheduledTask.maintenanceTaskId));
    assert.ok(scheduledTask.startTime < scheduledTask.endTime);
    assert.ok(scheduledTask.startTime >= combineDate(window.date, window.startTime));
    assert.ok(scheduledTask.endTime <= combineDate(window.date, window.endTime));
    const task = await prisma.maintenanceTask.findUnique({ where: { id: scheduledTask.maintenanceTaskId } });
    assert.equal(task.sectionId, persistedPlan.sectionId);
    scheduledMinutes += (scheduledTask.endTime - scheduledTask.startTime) / 60000;
  }
  assert.ok(scheduledMinutes <= window.maxDuration);
  assert.ok(persistedPlan.utilization >= 0 && persistedPlan.utilization <= 1);
});

test("planning detail and optimization analytics expose persisted plan metrics", async () => {
  const list = await request("/api/planning");
  assert.equal(list.response.status, 200);
  assert.ok(list.body.data.items.some((plan) => plan.id === generatedPlan.id));

  const planning = await request(`/api/planning/${generatedPlan.id}`);
  assert.equal(planning.response.status, 200);
  assert.equal(planning.body.data.id, generatedPlan.id);

  const optimization = await request(`/api/analytics/optimization/${generatedPlan.id}`);
  assert.equal(optimization.response.status, 200);
  assert.equal(optimization.body.data.planId, generatedPlan.id);
  assert.ok(optimization.body.data.utilization >= 0 && optimization.body.data.utilization <= 100);
});

test("divisional plan approval decision persists explicitly", async () => {
  const approvals = await request("/api/divisional/approvals");
  assert.equal(approvals.response.status, 200);
  assert.ok(Array.isArray(approvals.body.data.items));

  const decision = await request(`/api/planning/${generatedPlan.id}/decision`, {
    method: "POST",
    ...jsonBody({ action: "REJECT", note: "Synthetic divisional review" }),
  });
  assert.equal(decision.response.status, 200);
  assert.equal(decision.body.data.approval.status, "REJECTED");
  assert.equal(decision.body.data.plan.status, "CANCELLED");
});

test("operations timetable, corridors, conflicts, alerts, and block reads work", async () => {
  const timetable = await request("/api/trains/timetable?date=2026-09-06");
  assert.equal(timetable.response.status, 200);
  assert.ok(Array.isArray(timetable.body.data.items));

  const corridors = await request("/api/corridors");
  assert.equal(corridors.response.status, 200);
  assert.ok(corridors.body.data.items.length > 0);
  assert.equal(corridors.body.data.isDemoData, true);

  const conflicts = await request("/api/operations/conflicts");
  assert.equal(conflicts.response.status, 200);
  assert.equal(conflicts.body.data.isDemoData, true);

  const alerts = await request("/api/operations/alerts");
  assert.equal(alerts.response.status, 200);
  assert.equal(alerts.body.data.isDemoData, true);

  const blocks = await request("/api/blocks");
  const available = await request("/api/blocks/available");
  assert.equal(blocks.response.status, 200);
  assert.equal(available.response.status, 200);
  assert.ok(available.body.data.items.every((item) => item.status === "AVAILABLE"));
});

test("admin resources are readable and sensitive fields are rejected", async () => {
  const users = await request("/api/admin/users");
  const roles = await request("/api/admin/roles");
  const departments = await request("/api/admin/departments");
  const sections = await request("/api/admin/sections");
  const assets = await request("/api/admin/assets");
  const configuration = await request("/api/admin/configuration");
  const auditLogs = await request("/api/admin/audit-logs");
  for (const result of [users, roles, departments, sections, assets, configuration, auditLogs]) {
    assert.equal(result.response.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(Array.isArray(result.body.data.items));
  }
  assert.equal(users.body.data.items[0].isDemo, true);
  assert.equal(configuration.body.data.items[0].sourceSystem, "SYNTHETIC_ADMIN");

  const sensitive = await request("/api/admin/users", { method: "POST", ...jsonBody({ password: "not-accepted" }) });
  assert.equal(sensitive.response.status, 400);
});

test("repeating the same plan request does not duplicate scheduling", async () => {
  const before = await prisma.scheduledTask.findMany({ select: { maintenanceTaskId: true } });
  const beforeIds = new Set(before.map((task) => task.maintenanceTaskId));
  const result = await request("/api/planning/generate", {
    method: "POST",
    ...jsonBody(validPlanningRequest),
  });
  assert.equal(result.response.status, 200);
  const after = await prisma.scheduledTask.findMany({ select: { maintenanceTaskId: true } });
  const afterIds = new Set(after.map((task) => task.maintenanceTaskId));
  assert.equal(after.length, before.length);
  assert.deepEqual(afterIds, beforeIds);
});

test("planning returns no plans when the date range has no available blocks", async () => {
  const result = await request("/api/planning/generate", {
    method: "POST",
    ...jsonBody({ startDate: "2026-09-08", endDate: "2026-09-08", departments: ["ENG"] }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.blockWindowsConsidered, 0);
  assert.equal(result.body.data.plansCreated, 0);
});

test("the prototype optimizer safely returns an empty result when no feasible window exists", async () => {
  const result = await request("/api/planning/generate", {
    method: "POST",
    ...jsonBody({ startDate: "2026-09-12", endDate: "2026-09-12", departments: ["TRD"] }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.plansCreated, 0);
  assert.equal(result.body.data.tasksScheduled, 0);
});

test("planning validates date ranges, required fields, and department codes", async () => {
  const cases = [
    { startDate: "2026-09-13", endDate: "2026-09-07", departments: ["ENG"] },
    { startDate: "2026-09-07", endDate: "2026-09-13", departments: [] },
    { startDate: "2026-09-07", endDate: "2026-09-13", departments: ["UNKNOWN"] },
    { startDate: "2026-09-07", departments: ["ENG"] },
  ];
  for (const body of cases) {
    const result = await request("/api/planning/generate", { method: "POST", ...jsonBody(body) });
    assert.equal(result.response.status, 400);
  }
});

test("mock AI service failures are returned as upstream errors", async () => {
  const originalMode = process.env.MOCK_AI_MODE;
  const originalUrl = process.env.AI_SERVICE_URL;
  process.env.MOCK_AI_MODE = "false";
  process.env.AI_SERVICE_URL = "http://127.0.0.1:1";
  try {
    const result = await request("/api/planning/generate", {
      method: "POST",
      ...jsonBody(validPlanningRequest),
    });
    assert.equal(result.response.status, 502);
  } finally {
    process.env.MOCK_AI_MODE = originalMode;
    process.env.AI_SERVICE_URL = originalUrl;
  }
});

test("dashboard analytics satisfy distinct scheduling invariants", async () => {
  const result = await request("/api/analytics/dashboard");
  assert.equal(result.response.status, 200);
  const dashboard = result.body.data;
  const scheduledRows = await prisma.scheduledTask.findMany({ select: { maintenanceTaskId: true } });
  const distinctScheduledIds = new Set(scheduledRows.map((row) => row.maintenanceTaskId));
  const unscheduled = await prisma.maintenanceTask.count({ where: { scheduledTasks: { none: {} } } });
  assert.equal(dashboard.scheduledTasks, distinctScheduledIds.size);
  assert.equal(dashboard.unscheduledTasks, unscheduled);
  assert.equal(dashboard.totalMaintenanceTasks, dashboard.scheduledTasks + dashboard.unscheduledTasks);
  assert.ok(dashboard.averageBlockUtilization >= 0 && dashboard.averageBlockUtilization <= 100);

  const overview = await request("/api/analytics/overview");
  assert.equal(overview.response.status, 200);
  assert.deepEqual(overview.body.data, dashboard);

  for (const department of dashboard.departmentTaskCounts) {
    const record = await prisma.department.findUnique({ where: { code: department.departmentCode } });
    const scheduledCount = await prisma.maintenanceTask.count({
      where: { departmentId: record.id, scheduledTasks: { some: {} } },
    });
    assert.equal(department.scheduledTaskCount, scheduledCount);
  }
});

test("nonexistent, malformed, empty-body, and malformed-JSON requests return errors", async () => {
  for (const url of [
    "/api/assets/not-a-real-id",
    "/api/maintenance/not-a-real-id",
    "/api/trains/not-a-real-id",
    "/api/blocks/not-a-real-id",
    "/api/planning/not-a-real-id",
    "/api/analytics/optimization/not-a-real-id",
  ]) {
    const result = await request(url);
    assert.equal(result.response.status, 404, url);
  }

  const emptyBody = await request("/api/planning/generate", { method: "POST", ...jsonBody({}) });
  assert.equal(emptyBody.response.status, 400);

  const malformedJson = await request("/api/planning/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad json",
  });
  assert.equal(malformedJson.response.status, 400);
});

function toMinutes(value) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function combineDate(date, time) {
  const result = new Date(date);
  result.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), 0, 0);
  return result;
}