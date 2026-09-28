require("dotenv/config");

const fs = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const datasetMapping = require("./dataset-mapping");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const datasetDirectory = process.env.DATASET_PATH
  ? path.resolve(process.env.DATASET_PATH)
  : path.resolve(__dirname, "../../dataset");

const sourceFiles = {
  assets: "assets.json",
  defects: "defects.json",
  maintenance: "maintenance.json",
  trains: "trains.json",
  blocks: "blocks.json",
  failureRisk: "failure_risk.json",
  spares: "spares_available.json",
  technicians: "technician_available.json",
  planning: "planning.json",
  analytics: "analytics.json",
  readme: "README.json",
  frontendMockDirectory: "frontend-mock-data",
};

async function readJson(fileName) {
  const content = await fs.readFile(path.join(datasetDirectory, fileName), "utf8");
  return JSON.parse(content);
}

async function readFrontendMockData() {
  const directory = path.join(__dirname, sourceFiles.frontendMockDirectory);
  const files = {
    defectReports: "defect_reports.json",
    maintenanceHistory: "maintenance_history.json",
    blockRequests: "block_requests.json",
    recommendations: "recommendations.json",
    approvals: "approval_requests.json",
    performance: "department_performance.json",
    corridors: "corridors.json",
    conflicts: "operational_conflicts.json",
    alerts: "operational_alerts.json",
    roles: "roles.json",
    adminUsers: "admin_users.json",
    configuration: "system_configuration.json",
    auditLogs: "audit_logs.json",
  };
  const entries = {};
  for (const [key, fileName] of Object.entries(files)) {
    entries[key] = JSON.parse(await fs.readFile(path.join(directory, fileName), "utf8"));
  }
  return entries;
}

function bucket(source) {
  return { source, imported: 0, updated: 0, skipped: 0, failed: 0 };
}

function createReport(records) {
  return {
    assets: bucket(records.assets.length),
    defects: bucket(records.defects.length),
    maintenance: bucket(records.maintenance.length),
    trains: bucket(records.trains.length),
    schedules: bucket(records.trains.length),
    blocks: bucket(records.blocks.length),
    failureRisk: bucket(records.failureRisk.length),
    spares: bucket(records.spares.length),
    technicians: bucket(records.technicians.length),
    defectReports: bucket(records.frontend.defectReports.length),
    maintenanceHistory: bucket(records.frontend.maintenanceHistory.length),
    blockRequests: bucket(records.frontend.blockRequests.length),
    recommendations: bucket(records.frontend.recommendations.length),
    approvals: bucket(records.frontend.approvals.length),
    performance: bucket(records.frontend.performance.length),
    corridors: bucket(records.frontend.corridors.length),
    conflicts: bucket(records.frontend.conflicts.length),
    alerts: bucket(records.frontend.alerts.length),
    roles: bucket(records.frontend.roles.length),
    adminUsers: bucket(records.frontend.adminUsers.length),
    configuration: bucket(records.frontend.configuration.length),
    auditLogs: bucket(records.frontend.auditLogs.length),
    generatedDefaults: new Map(),
    generatedDemoData: new Map(),
    skippedReasons: new Map(),
    warnings: [],
    errors: [],
  };
}

function countMap(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function recordDefault(report, field, reason) {
  countMap(report.generatedDefaults, `${field}: ${reason}`);
}

function recordDemoData(report, field, reason) {
  countMap(report.generatedDemoData, `${field}: ${reason}`);
}

function recordSkip(report, category, reason, sourceFile, index, field, value) {
  report[category].skipped += 1;
  countMap(report.skippedReasons, `${category}: ${reason}`);
  const message = `${sourceFile}\nrecord #${index + 1}\n${field} = ${JSON.stringify(value)}\n${reason}`;
  report.warnings.push(message);
  console.warn(`WARNING:\n${message}`);
}

function recordFailure(report, category, sourceFile, index, field, value, cause) {
  report[category].failed += 1;
  const message = `${sourceFile}\nrecord #${index + 1}\n${field} = ${JSON.stringify(value)}\n${cause.message}`;
  report.errors.push(message);
  console.error(`ERROR:\n${message}`);
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateTime(value) {
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursToMinutes(value) {
  const hours = Number(value);
  return Number.isFinite(hours) && hours > 0 ? Math.round(hours * 60) : null;
}

function timeToDate(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}

function addMinutes(value, minutes) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function timeFromDate(value) {
  return new Date(Date.UTC(1970, 0, 1, value.getUTCHours(), value.getUTCMinutes()));
}

function dateKey(value) {
  return value.toISOString().slice(0, 10);
}

function mappingForCity(city) {
  return datasetMapping.cityMappings[city] || null;
}

async function loadIndexes() {
  const departments = await prisma.department.findMany({ select: { id: true, code: true } });
  const sections = await prisma.section.findMany({ select: { id: true, code: true } });
  const assets = await prisma.asset.findMany({ select: { id: true, assetCode: true } });
  const trains = await prisma.train.findMany({ select: { id: true, trainNumber: true } });
  const maintenance = await prisma.maintenanceTask.findMany({ select: { id: true, taskCode: true } });
  const blockWindows = await prisma.blockWindow.findMany({ include: { section: { select: { code: true } } } });
  const schedules = await prisma.trainSchedule.findMany({ include: { train: { select: { trainNumber: true } }, section: { select: { code: true } } } });
  const blockPlans = await prisma.blockPlan.findMany({ select: { id: true, sectionId: true, date: true, startTime: true, endTime: true } });

  return {
    departments: new Map(departments.map((item) => [item.code, item])),
    sections: new Map(sections.map((item) => [item.code, item])),
    assets: new Map(assets.map((item) => [item.assetCode, item])),
    trains: new Map(trains.map((item) => [item.trainNumber, item])),
    maintenance: new Map(maintenance.map((item) => [item.taskCode, item])),
    blockWindows,
    schedules,
    blockPlans,
  };
}

function timeKey(value) {
  return value.toISOString().slice(11, 16);
}

function blockWindowForKey(key, indexes) {
  return indexes.blockWindows.find((window) =>
    `${window.section.code}|${dateKey(window.date)}|${timeKey(window.startTime)}|${timeKey(window.endTime)}` === key,
  );
}

function scheduleForKey(record, indexes) {
  return indexes.schedules.find((schedule) =>
    schedule.train.trainNumber === record.train_number &&
    schedule.section.code === record.section_code &&
    dateKey(schedule.date) === record.schedule_date,
  );
}

function blockPlanForKey(record, indexes) {
  return indexes.blockPlans.find((plan) =>
    plan.sectionId === indexes.sections.get(record.section_code)?.id &&
    dateKey(plan.date) === record.plan_date &&
    timeKey(plan.startTime) === record.start_time &&
    timeKey(plan.endTime) === record.end_time,
  );
}

function buildAssetDates(maintenanceRecords) {
  const datesByAsset = new Map();
  for (const record of maintenanceRecords) {
    const last = parseDate(record.last_maintenance_date);
    const next = parseDate(record.due_date);
    if (!datesByAsset.has(record.asset_id)) datesByAsset.set(record.asset_id, { last: [], next: [] });
    if (last) datesByAsset.get(record.asset_id).last.push(last);
    if (next) datesByAsset.get(record.asset_id).next.push(next);
  }

  const result = new Map();
  for (const [assetId, dates] of datesByAsset) {
    result.set(assetId, {
      lastMaintenance: dates.last.length ? new Date(Math.max(...dates.last.map((date) => date.getTime()))) : null,
      nextMaintenance: dates.next.length ? new Date(Math.min(...dates.next.map((date) => date.getTime()))) : null,
    });
  }
  return result;
}

async function importAssets(records, maintenanceRecords, report, indexes) {
  const datesByAsset = buildAssetDates(maintenanceRecords);
  for (const [index, record] of records.entries()) {
    const mapping = mappingForCity(record.city);
    const department = mapping && indexes.departments.get(mapping.departmentCode);
    const section = mapping && indexes.sections.get(mapping.sectionCode);
    if (!mapping || !department || !section) {
      recordSkip(report, "assets", "No configured city-to-department/section mapping resolved.", sourceFiles.assets, index, "city", record.city);
      continue;
    }

    const dates = datesByAsset.get(record.asset_id) || { lastMaintenance: null, nextMaintenance: null };
    const data = {
      assetCode: record.asset_id,
      departmentId: department.id,
      sectionId: section.id,
      assetType: record.asset_type,
      criticality: record.criticality,
      status: datasetMapping.assetStatusMap[record.availability_status],
      lastMaintenance: dates.lastMaintenance,
      nextMaintenance: dates.nextMaintenance,
    };
    try {
      const existing = indexes.assets.get(record.asset_id);
      const savedAsset = await prisma.asset.upsert({ where: { assetCode: record.asset_id }, create: data, update: data, select: { id: true, assetCode: true } });
      existing ? report.assets.updated += 1 : report.assets.imported += 1;
      indexes.assets.set(record.asset_id, savedAsset);
    } catch (cause) {
      recordFailure(report, "assets", sourceFiles.assets, index, "asset_id", record.asset_id, cause);
    }
  }
}

async function importDefects(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const asset = indexes.assets.get(record.asset_id);
    const detectedAt = parseDate(record.reported_date);
    if (!asset || !detectedAt) {
      recordSkip(report, "defects", !asset ? "Asset reference could not be resolved." : "reported_date is invalid.", sourceFiles.defects, index, !asset ? "asset_id" : "reported_date", !asset ? record.asset_id : record.reported_date);
      continue;
    }

    const data = {
      defectCode: record.defect_id,
      assetId: asset.id,
      description: record.description,
      severity: record.severity,
      status: record.status,
      detectedAt,
      sourceSystem: datasetMapping.defaults.defectSourceSystem,
    };
    try {
      const existing = await prisma.defect.findUnique({ where: { defectCode: record.defect_id }, select: { id: true } });
      await prisma.defect.upsert({ where: { defectCode: record.defect_id }, create: data, update: data });
      existing ? report.defects.updated += 1 : report.defects.imported += 1;
    } catch (cause) {
      recordFailure(report, "defects", sourceFiles.defects, index, "defect_id", record.defect_id, cause);
    }
  }
}

async function importMaintenance(records, planningRecords, report, indexes) {
  const planningScores = new Map(planningRecords.map((record) => [record.maintenance_id, Number(record.priority_score)]));
  for (const [index, record] of records.entries()) {
    const mapping = mappingForCity(record.city);
    const asset = indexes.assets.get(record.asset_id);
    const department = mapping && indexes.departments.get(mapping.departmentCode);
    const section = mapping && indexes.sections.get(mapping.sectionCode);
    const dueDate = parseDate(record.due_date);
    const estimatedDuration = hoursToMinutes(record.duration_hours);
    const taskType = datasetMapping.taskTypeMap[record.schedule_type];
    if (!mapping || !asset || !department || !section || !dueDate || !estimatedDuration || !taskType) {
      recordSkip(report, "maintenance", "Required relationship or transform could not be resolved.", sourceFiles.maintenance, index, "maintenance_id", record.maintenance_id);
      continue;
    }

    const hasPlanningOverride = planningScores.has(record.maintenance_id);
    const priorityScore = hasPlanningOverride
      ? planningScores.get(record.maintenance_id)
      : datasetMapping.priorityScoreMap[record.priority];
    const data = {
      taskCode: record.maintenance_id,
      assetId: asset.id,
      departmentId: department.id,
      sectionId: section.id,
      taskType,
      description: datasetMapping.defaults.maintenanceDescription,
      severity: datasetMapping.defaults.maintenanceSeverity,
      priorityScore,
      status: datasetMapping.taskStatusMap[record.status],
      dueDate,
      overdueDays: Number(record.days_overdue) || 0,
      estimatedDuration,
      crewRequired: datasetMapping.defaults.crewRequired,
    };
    recordDefault(report, "MaintenanceTask.description", "Required field absent from source dataset.");
    recordDefault(report, "MaintenanceTask.severity", "Required field absent; neutral MEDIUM fallback used. Priority remains priorityScore.");
    recordDefault(report, "MaintenanceTask.crewRequired", "Required field absent from source dataset.");
    if (hasPlanningOverride) recordDefault(report, "MaintenanceTask.priorityScore", "planning.json priority_score override used.");

    try {
      const existing = await prisma.maintenanceTask.findUnique({ where: { taskCode: record.maintenance_id }, select: { id: true } });
      await prisma.maintenanceTask.upsert({ where: { taskCode: record.maintenance_id }, create: data, update: data });
      existing ? report.maintenance.updated += 1 : report.maintenance.imported += 1;
    } catch (cause) {
      recordFailure(report, "maintenance", sourceFiles.maintenance, index, "maintenance_id", record.maintenance_id, cause);
    }
  }
}

function blockIdentity(sectionId, start, end) {
  return { sectionId, date: parseDate(dateKey(start)), startTime: timeFromDate(start), endTime: timeFromDate(end) };
}

function blockScheduleDate(blocks, city) {
  const dates = blocks
    .filter((block) => block.city === city)
    .map((block) => parseDateTime(block.start_datetime))
    .filter(Boolean)
    .sort((left, right) => left - right);
  return dates[0] ? parseDate(dateKey(dates[0])) : parseDate(datasetMapping.source.snapshotDate);
}

async function importBlocks(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const mapping = mappingForCity(record.city);
    const section = mapping && indexes.sections.get(mapping.sectionCode);
    const start = parseDateTime(record.start_datetime);
    const duration = hoursToMinutes(record.duration_hours);
    const status = datasetMapping.blockStatusMap[record.approval_status];
    if (!mapping || !section || !start || !duration || !status) {
      recordSkip(report, "blocks", "Required section, time, duration, or status could not be resolved.", sourceFiles.blocks, index, "block_id", record.block_id);
      continue;
    }

    const end = addMinutes(start, duration);
    const identity = blockIdentity(section.id, start, end);
    const data = { ...identity, maxDuration: duration, status };
    try {
      const existing = await prisma.blockWindow.findFirst({ where: identity, select: { id: true } });
      if (existing) {
        await prisma.blockWindow.update({ where: { id: existing.id }, data });
        report.blocks.updated += 1;
      } else {
        await prisma.blockWindow.create({ data });
        report.blocks.imported += 1;
      }
    } catch (cause) {
      recordFailure(report, "blocks", sourceFiles.blocks, index, "block_id", record.block_id, cause);
    }
  }
}

async function importTrains(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    if (!record.train_number || !record.train_name || !record.train_type) {
      recordSkip(report, "trains", "Required train fields are missing.", sourceFiles.trains, index, "train_number", record.train_number);
      continue;
    }

    try {
      const existing = indexes.trains.get(record.train_number);
      const data = {
        trainNumber: record.train_number,
        name: record.train_name,
        trainType: record.train_type,
        active: datasetMapping.defaults.trainActive,
      };
      const savedTrain = await prisma.train.upsert({ where: { trainNumber: record.train_number }, create: data, update: data, select: { id: true, trainNumber: true } });
      recordDefault(report, "Train.active", "Required field absent from source dataset.");
      existing ? report.trains.updated += 1 : report.trains.imported += 1;
      indexes.trains.set(record.train_number, savedTrain);
    } catch (cause) {
      recordFailure(report, "trains", sourceFiles.trains, index, "train_number", record.train_number, cause);
    }
  }
}

async function importSchedules(records, blocks, report, indexes) {
  for (const [index, record] of records.entries()) {
    const mapping = mappingForCity(record.origin);
    const train = indexes.trains.get(record.train_number);
    const section = mapping && indexes.sections.get(mapping.sectionCode);
    const date = blockScheduleDate(blocks, record.origin);
    const departure = timeToDate(record.scheduled_departure);
    const arrival = departure && addMinutes(departure, datasetMapping.demoSchedulePolicy.arrivalOffsetMinutes);
    if (!train || !section || !date || !departure || !arrival) {
      recordSkip(report, "schedules", "Required synthetic schedule relationship or time could not be resolved.", sourceFiles.trains, index, "train_number", record.train_number);
      continue;
    }

    const identity = { trainId: train.id, sectionId: section.id, date, arrivalTime: arrival, departureTime: departure };
    const data = { ...identity, status: datasetMapping.demoSchedulePolicy.status };
    try {
      const existing = await prisma.trainSchedule.findFirst({ where: identity, select: { id: true } });
      if (existing) {
        await prisma.trainSchedule.update({ where: { id: existing.id }, data });
        report.schedules.updated += 1;
      } else {
        await prisma.trainSchedule.create({ data });
        report.schedules.imported += 1;
      }
      recordDemoData(report, datasetMapping.demoSchedulePolicy.generatedDataMarker, "Date, section, and arrival time are deterministic synthetic values.");
    } catch (cause) {
      recordFailure(report, "schedules", sourceFiles.trains, index, "train_number", record.train_number, cause);
    }
  }
}

async function importFailureRisks(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const asset = indexes.assets.get(record.asset_id);
    const maintenance = indexes.maintenance.get(record.maintenance_id);
    const valid = asset && maintenance && record.risk_score >= 0 && record.risk_score <= 100 &&
      record.failure_probability >= 0 && record.failure_probability <= 1 &&
      record.impact_score >= 1 && record.impact_score <= 5 && record.days_to_expected_failure >= 0;
    if (!valid) {
      recordSkip(report, "failureRisk", "Invalid source reference or risk value.", sourceFiles.failureRisk, index, "failure_risk_id", record.failure_risk_id);
      continue;
    }
    try {
      const existing = await prisma.failureRisk.findUnique({ where: { failureRiskCode: record.failure_risk_id }, select: { id: true } });
      await prisma.failureRisk.upsert({
        where: { failureRiskCode: record.failure_risk_id },
        create: {
          failureRiskCode: record.failure_risk_id,
          assetId: asset.id,
          maintenanceTaskId: maintenance.id,
          riskScore: record.risk_score,
          riskLevel: record.risk_level,
          failureProbability: record.failure_probability,
          impactScore: record.impact_score,
          daysToExpectedFailure: record.days_to_expected_failure,
          riskFactors: record.risk_factors,
          calculatedAt: new Date(record.calculated_at),
        },
        update: {
          assetId: asset.id,
          maintenanceTaskId: maintenance.id,
          riskScore: record.risk_score,
          riskLevel: record.risk_level,
          failureProbability: record.failure_probability,
          impactScore: record.impact_score,
          daysToExpectedFailure: record.days_to_expected_failure,
          riskFactors: record.risk_factors,
          calculatedAt: new Date(record.calculated_at),
        },
      });
      existing ? report.failureRisk.updated += 1 : report.failureRisk.imported += 1;
    } catch (cause) {
      recordFailure(report, "failureRisk", sourceFiles.failureRisk, index, "failure_risk_id", record.failure_risk_id, cause);
    }
  }
}

async function importSpares(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const asset = indexes.assets.get(record.asset_id);
    const maintenance = indexes.maintenance.get(record.maintenance_id);
    const validStatuses = ["AVAILABLE", "PARTIAL", "NOT_AVAILABLE"];
    const valid = asset && maintenance && validStatuses.includes(record.availability_status) &&
      record.required_quantity >= 0 && record.available_quantity >= 0 &&
      record.availability_score >= 0 && record.availability_score <= 100;
    if (!valid) {
      recordSkip(report, "spares", "Invalid source reference or spare availability value.", sourceFiles.spares, index, "spare_availability_id", record.spare_availability_id);
      continue;
    }
    try {
      const existing = await prisma.spareAvailability.findUnique({ where: { spareAvailabilityCode: record.spare_availability_id }, select: { id: true } });
      await prisma.spareAvailability.upsert({
        where: { spareAvailabilityCode: record.spare_availability_id },
        create: {
          spareAvailabilityCode: record.spare_availability_id,
          maintenanceTaskId: maintenance.id,
          assetId: asset.id,
          sparePartCode: record.spare_part_code,
          sparePartName: record.spare_part_name,
          requiredQuantity: record.required_quantity,
          availableQuantity: record.available_quantity,
          availabilityStatus: record.availability_status,
          availabilityScore: record.availability_score,
          warehouse: record.warehouse,
          lastUpdated: new Date(record.last_updated),
        },
        update: {
          maintenanceTaskId: maintenance.id,
          assetId: asset.id,
          sparePartCode: record.spare_part_code,
          sparePartName: record.spare_part_name,
          requiredQuantity: record.required_quantity,
          availableQuantity: record.available_quantity,
          availabilityStatus: record.availability_status,
          availabilityScore: record.availability_score,
          warehouse: record.warehouse,
          lastUpdated: new Date(record.last_updated),
        },
      });
      existing ? report.spares.updated += 1 : report.spares.imported += 1;
    } catch (cause) {
      recordFailure(report, "spares", sourceFiles.spares, index, "spare_availability_id", record.spare_availability_id, cause);
    }
  }
}

async function importTechnicians(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const maintenance = indexes.maintenance.get(record.maintenance_id);
    const validStatuses = ["AVAILABLE", "PARTIAL", "UNAVAILABLE"];
    const valid = maintenance && validStatuses.includes(record.availability_status) &&
      record.required_technicians >= 0 && record.available_technicians >= 0 &&
      record.availability_score >= 0 && record.availability_score <= 100;
    if (!valid) {
      recordSkip(report, "technicians", "Invalid maintenance reference or technician availability value.", sourceFiles.technicians, index, "technician_availability_id", record.technician_availability_id);
      continue;
    }
    try {
      const existing = await prisma.technicianAvailability.findUnique({ where: { technicianAvailabilityCode: record.technician_availability_id }, select: { id: true } });
      await prisma.technicianAvailability.upsert({
        where: { technicianAvailabilityCode: record.technician_availability_id },
        create: {
          technicianAvailabilityCode: record.technician_availability_id,
          technicianId: record.technician_id,
          maintenanceTaskId: maintenance.id,
          departmentCode: record.department_code,
          sectionCode: record.section_code,
          skill: record.skill,
          requiredTechnicians: record.required_technicians,
          availableTechnicians: record.available_technicians,
          availabilityStatus: record.availability_status,
          availabilityScore: record.availability_score,
          availableFrom: new Date(record.available_from),
          availableUntil: new Date(record.available_until),
        },
        update: {
          technicianId: record.technician_id,
          maintenanceTaskId: maintenance.id,
          departmentCode: record.department_code,
          sectionCode: record.section_code,
          skill: record.skill,
          requiredTechnicians: record.required_technicians,
          availableTechnicians: record.available_technicians,
          availabilityStatus: record.availability_status,
          availabilityScore: record.availability_score,
          availableFrom: new Date(record.available_from),
          availableUntil: new Date(record.available_until),
        },
      });
      existing ? report.technicians.updated += 1 : report.technicians.imported += 1;
    } catch (cause) {
      recordFailure(report, "technicians", sourceFiles.technicians, index, "technician_availability_id", record.technician_availability_id, cause);
    }
  }
}

async function importFrontendDefectReports(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const asset = indexes.assets.get(record.asset_code);
    const detectedAt = parseDateTime(record.reported_at);
    if (!asset || !detectedAt) {
      recordSkip(report, "defectReports", !asset ? "Asset reference could not be resolved." : "reported_at is invalid.", "frontend-mock-data/defect_reports.json", index, "asset_code", record.asset_code);
      continue;
    }
    const data = {
      defectCode: record.defect_code,
      assetId: asset.id,
      description: record.description,
      severity: record.severity,
      status: record.status,
      detectedAt,
      sourceSystem: record.source_system,
    };
    try {
      const existing = await prisma.defect.findUnique({ where: { defectCode: record.defect_code }, select: { id: true } });
      await prisma.defect.upsert({ where: { defectCode: record.defect_code }, create: data, update: data });
      existing ? report.defectReports.updated += 1 : report.defectReports.imported += 1;
    } catch (cause) {
      recordFailure(report, "defectReports", "frontend-mock-data/defect_reports.json", index, "defect_code", record.defect_code, cause);
    }
  }
}

async function importMaintenanceHistory(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const asset = indexes.assets.get(record.asset_code);
    const maintenance = indexes.maintenance.get(record.maintenance_code);
    const completedAt = parseDateTime(record.completed_at);
    if (!asset || !maintenance || !completedAt) {
      recordSkip(report, "maintenanceHistory", "Asset, maintenance, or completed_at reference could not be resolved.", "frontend-mock-data/maintenance_history.json", index, "history_code", record.history_code);
      continue;
    }
    const data = {
      historyCode: record.history_code,
      assetId: asset.id,
      maintenanceTaskId: maintenance.id,
      eventType: record.event_type,
      summary: record.summary,
      completedAt,
      performedBy: record.performed_by,
      notes: record.notes || null,
      sourceSystem: record.source_system,
    };
    try {
      const existing = await prisma.maintenanceHistory.findUnique({ where: { historyCode: record.history_code }, select: { id: true } });
      await prisma.maintenanceHistory.upsert({ where: { historyCode: record.history_code }, create: data, update: data });
      existing ? report.maintenanceHistory.updated += 1 : report.maintenanceHistory.imported += 1;
    } catch (cause) {
      recordFailure(report, "maintenanceHistory", "frontend-mock-data/maintenance_history.json", index, "history_code", record.history_code, cause);
    }
  }
}

async function importBlockRequests(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const department = indexes.departments.get(record.department_code);
    const section = indexes.sections.get(record.section_code);
    const blockWindow = record.block_window_key ? blockWindowForKey(record.block_window_key, indexes) : null;
    if (!department || !section || (record.block_window_key && !blockWindow)) {
      recordSkip(report, "blockRequests", "Department, section, or block-window reference could not be resolved.", "frontend-mock-data/block_requests.json", index, "request_code", record.request_code);
      continue;
    }
    const data = {
      requestCode: record.request_code,
      departmentId: department.id,
      sectionId: section.id,
      blockWindowId: blockWindow?.id || null,
      corridorCode: record.corridor_code,
      requestedWindow: record.requested_window,
      requestedFor: record.requested_for,
      impact: record.impact,
      requestedByRole: record.requested_by_role,
      status: record.status,
      decisionNote: record.decision_note || null,
      sourceSystem: record.source_system,
    };
    try {
      const existing = await prisma.blockRequest.findUnique({ where: { requestCode: record.request_code }, select: { id: true } });
      await prisma.blockRequest.upsert({ where: { requestCode: record.request_code }, create: data, update: data });
      existing ? report.blockRequests.updated += 1 : report.blockRequests.imported += 1;
    } catch (cause) {
      recordFailure(report, "blockRequests", "frontend-mock-data/block_requests.json", index, "request_code", record.request_code, cause);
    }
  }
}

async function importRecommendations(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const task = indexes.maintenance.get(record.maintenance_code);
    const asset = indexes.assets.get(record.asset_code);
    const department = indexes.departments.get(record.department_code);
    const recommendedDate = record.recommended_date ? parseDate(record.recommended_date) : null;
    const generatedAt = parseDateTime(record.generated_at);
    if (!task || !asset || !department || !generatedAt || (record.recommended_date && !recommendedDate)) {
      recordSkip(report, "recommendations", "Maintenance, asset, department, or date reference could not be resolved.", "frontend-mock-data/recommendations.json", index, "recommendation_code", record.recommendation_code);
      continue;
    }
    const data = {
      recommendationCode: record.recommendation_code,
      maintenanceTaskId: task.id,
      assetId: asset.id,
      departmentId: department.id,
      title: record.title,
      rationale: record.rationale,
      priorityScore: record.priority_score,
      status: record.status,
      recommendedDate,
      generatedAt,
      sourceSystem: record.source_system,
    };
    try {
      const existing = await prisma.recommendation.findUnique({ where: { recommendationCode: record.recommendation_code }, select: { id: true } });
      await prisma.recommendation.upsert({ where: { recommendationCode: record.recommendation_code }, create: data, update: data });
      existing ? report.recommendations.updated += 1 : report.recommendations.imported += 1;
    } catch (cause) {
      recordFailure(report, "recommendations", "frontend-mock-data/recommendations.json", index, "recommendation_code", record.recommendation_code, cause);
    }
  }
}

async function importApprovals(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const request = record.block_request_code ? await prisma.blockRequest.findUnique({ where: { requestCode: record.block_request_code }, select: { id: true } }) : null;
    const department = record.department_code ? indexes.departments.get(record.department_code) : null;
    const decidedAt = record.decided_at ? parseDateTime(record.decided_at) : null;
    if (!request || !department || (record.decided_at && !decidedAt)) {
      recordSkip(report, "approvals", "Block request, department, or decision timestamp could not be resolved.", "frontend-mock-data/approval_requests.json", index, "approval_code", record.approval_code);
      continue;
    }
    const data = {
      approvalCode: record.approval_code,
      blockRequestId: request.id,
      departmentId: department.id,
      requestedByRole: record.requested_by_role,
      requestedAction: record.requested_action,
      status: record.status,
      decisionNote: record.decision_note || null,
      decidedAt,
      sourceSystem: record.source_system,
    };
    try {
      const existing = await prisma.approvalRequest.findUnique({ where: { approvalCode: record.approval_code }, select: { id: true } });
      await prisma.approvalRequest.upsert({ where: { approvalCode: record.approval_code }, create: data, update: data });
      existing ? report.approvals.updated += 1 : report.approvals.imported += 1;
    } catch (cause) {
      recordFailure(report, "approvals", "frontend-mock-data/approval_requests.json", index, "approval_code", record.approval_code, cause);
    }
  }
}

async function importPerformance(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const department = indexes.departments.get(record.department_code);
    const periodStart = parseDate(record.period_start);
    const periodEnd = parseDate(record.period_end);
    if (!department || !periodStart || !periodEnd) {
      recordSkip(report, "performance", "Department or performance period could not be resolved.", "frontend-mock-data/department_performance.json", index, "performance_code", record.performance_code);
      continue;
    }
    const data = {
      performanceCode: record.performance_code,
      departmentId: department.id,
      periodType: record.period_type,
      periodStart,
      periodEnd,
      totalTasks: record.total_tasks,
      completedTasks: record.completed_tasks,
      overdueTasks: record.overdue_tasks,
      scheduledTasks: record.scheduled_tasks,
      assetAvailabilityScore: record.asset_availability_score,
      blockUtilization: record.block_utilization,
      sourceSystem: record.source_system,
    };
    try {
      const existing = await prisma.departmentPerformance.findUnique({ where: { performanceCode: record.performance_code }, select: { id: true } });
      await prisma.departmentPerformance.upsert({ where: { performanceCode: record.performance_code }, create: data, update: data });
      existing ? report.performance.updated += 1 : report.performance.imported += 1;
    } catch (cause) {
      recordFailure(report, "performance", "frontend-mock-data/department_performance.json", index, "performance_code", record.performance_code, cause);
    }
  }
}

async function importCorridors(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const section = record.section_code ? indexes.sections.get(record.section_code) : null;
    if (record.section_code && !section) {
      recordSkip(report, "corridors", "Section reference could not be resolved.", "frontend-mock-data/corridors.json", index, "corridor_code", record.corridor_code);
      continue;
    }
    const data = { corridorCode: record.corridor_code, sectionId: section?.id || null, name: record.name, status: record.status, description: record.description, sourceSystem: record.source_system };
    try {
      const existing = await prisma.corridor.findUnique({ where: { corridorCode: record.corridor_code }, select: { id: true } });
      await prisma.corridor.upsert({ where: { corridorCode: record.corridor_code }, create: data, update: data });
      existing ? report.corridors.updated += 1 : report.corridors.imported += 1;
    } catch (cause) {
      recordFailure(report, "corridors", "frontend-mock-data/corridors.json", index, "corridor_code", record.corridor_code, cause);
    }
  }
}

async function importConflicts(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const schedule = scheduleForKey(record, indexes);
    const blockWindow = blockWindowForKey(record.block_window_key, indexes);
    const corridor = await prisma.corridor.findUnique({ where: { corridorCode: record.corridor_code }, select: { id: true } });
    const detectedAt = parseDateTime(record.detected_at);
    const resolvedAt = record.resolved_at ? parseDateTime(record.resolved_at) : null;
    if (!schedule || !blockWindow || !corridor || !detectedAt || (record.resolved_at && !resolvedAt)) {
      recordSkip(report, "conflicts", "Schedule, block-window, corridor, or timestamp reference could not be resolved.", "frontend-mock-data/operational_conflicts.json", index, "conflict_code", record.conflict_code);
      continue;
    }
    const data = { conflictCode: record.conflict_code, trainScheduleId: schedule.id, blockWindowId: blockWindow.id, corridorId: corridor.id, conflictType: record.conflict_type, severity: record.severity, status: record.status, description: record.description, detectedAt, resolvedAt, sourceSystem: record.source_system };
    try {
      const existing = await prisma.operationalConflict.findUnique({ where: { conflictCode: record.conflict_code }, select: { id: true } });
      await prisma.operationalConflict.upsert({ where: { conflictCode: record.conflict_code }, create: data, update: data });
      existing ? report.conflicts.updated += 1 : report.conflicts.imported += 1;
    } catch (cause) {
      recordFailure(report, "conflicts", "frontend-mock-data/operational_conflicts.json", index, "conflict_code", record.conflict_code, cause);
    }
  }
}

async function importAlerts(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const conflict = record.conflict_code ? await prisma.operationalConflict.findUnique({ where: { conflictCode: record.conflict_code }, select: { id: true } }) : null;
    const corridor = record.corridor_code ? await prisma.corridor.findUnique({ where: { corridorCode: record.corridor_code }, select: { id: true } }) : null;
    const occurredAt = parseDateTime(record.occurred_at);
    const acknowledgedAt = record.acknowledged_at ? parseDateTime(record.acknowledged_at) : null;
    if (!conflict || !corridor || !occurredAt || (record.acknowledged_at && !acknowledgedAt)) {
      recordSkip(report, "alerts", "Conflict, corridor, or timestamp reference could not be resolved.", "frontend-mock-data/operational_alerts.json", index, "alert_code", record.alert_code);
      continue;
    }
    const data = { alertCode: record.alert_code, conflictId: conflict.id, corridorId: corridor.id, severity: record.severity, status: record.status, title: record.title, message: record.message, occurredAt, acknowledgedAt, sourceSystem: record.source_system };
    try {
      const existing = await prisma.operationalAlert.findUnique({ where: { alertCode: record.alert_code }, select: { id: true } });
      await prisma.operationalAlert.upsert({ where: { alertCode: record.alert_code }, create: data, update: data });
      existing ? report.alerts.updated += 1 : report.alerts.imported += 1;
    } catch (cause) {
      recordFailure(report, "alerts", "frontend-mock-data/operational_alerts.json", index, "alert_code", record.alert_code, cause);
    }
  }
}

async function importRoles(records, report) {
  for (const [index, record] of records.entries()) {
    const data = { roleCode: record.role_code, name: record.name, description: record.description, sourceSystem: record.source_system };
    try {
      const existing = await prisma.role.findUnique({ where: { roleCode: record.role_code }, select: { id: true } });
      await prisma.role.upsert({ where: { roleCode: record.role_code }, create: data, update: data });
      existing ? report.roles.updated += 1 : report.roles.imported += 1;
    } catch (cause) {
      recordFailure(report, "roles", "frontend-mock-data/roles.json", index, "role_code", record.role_code, cause);
    }
  }
}

async function importAdminUsers(records, report, indexes) {
  for (const [index, record] of records.entries()) {
    const role = await prisma.role.findUnique({ where: { roleCode: record.role_code }, select: { id: true } });
    const department = record.department_code ? indexes.departments.get(record.department_code) : null;
    if (!role || (record.department_code && !department)) {
      recordSkip(report, "adminUsers", "Role or department reference could not be resolved.", "frontend-mock-data/admin_users.json", index, "user_code", record.user_code);
      continue;
    }
    const data = { userCode: record.user_code, displayName: record.display_name, email: record.email, roleId: role.id, departmentId: department?.id || null, status: record.status, isDemo: record.is_demo, sourceSystem: record.source_system };
    try {
      const existing = await prisma.adminUser.findUnique({ where: { userCode: record.user_code }, select: { id: true } });
      await prisma.adminUser.upsert({ where: { userCode: record.user_code }, create: data, update: data });
      existing ? report.adminUsers.updated += 1 : report.adminUsers.imported += 1;
    } catch (cause) {
      recordFailure(report, "adminUsers", "frontend-mock-data/admin_users.json", index, "user_code", record.user_code, cause);
    }
  }
}

async function importConfiguration(records, report) {
  for (const [index, record] of records.entries()) {
    const data = { configKey: record.config_key, value: record.value, description: record.description, environment: record.environment, sourceSystem: record.source_system };
    try {
      const existing = await prisma.systemConfiguration.findUnique({ where: { configKey: record.config_key }, select: { id: true } });
      await prisma.systemConfiguration.upsert({ where: { configKey: record.config_key }, create: data, update: data });
      existing ? report.configuration.updated += 1 : report.configuration.imported += 1;
    } catch (cause) {
      recordFailure(report, "configuration", "frontend-mock-data/system_configuration.json", index, "config_key", record.config_key, cause);
    }
  }
}

async function importAuditLogs(records, report) {
  for (const [index, record] of records.entries()) {
    const actor = record.user_code ? await prisma.adminUser.findUnique({ where: { userCode: record.user_code }, select: { id: true } }) : null;
    const occurredAt = parseDateTime(record.occurred_at);
    if (!actor || !occurredAt) {
      recordSkip(report, "auditLogs", "Actor or timestamp reference could not be resolved.", "frontend-mock-data/audit_logs.json", index, "audit_code", record.audit_code);
      continue;
    }
    const data = { auditCode: record.audit_code, actorUserId: actor.id, action: record.action, resourceType: record.resource_type, resourceId: record.resource_id || null, details: record.details, occurredAt, sourceSystem: record.source_system };
    try {
      const existing = await prisma.auditLog.findUnique({ where: { auditCode: record.audit_code }, select: { id: true } });
      await prisma.auditLog.upsert({ where: { auditCode: record.audit_code }, create: data, update: data });
      existing ? report.auditLogs.updated += 1 : report.auditLogs.imported += 1;
    } catch (cause) {
      recordFailure(report, "auditLogs", "frontend-mock-data/audit_logs.json", index, "audit_code", record.audit_code, cause);
    }
  }
}

function printMap(title, map) {
  console.log(title);
  if (!map.size) console.log("- none");
  for (const [key, count] of map) console.log(`- ${key}: ${count}`);
}

function printSummary(report) {
  console.log("\nDATASET IMPORT SUMMARY\n");
  for (const [label, key] of [["Assets", "assets"], ["Defects", "defects"], ["Maintenance", "maintenance"], ["Trains", "trains"], ["Schedules", "schedules"], ["Block Windows", "blocks"], ["Failure Risk", "failureRisk"], ["Spare Availability", "spares"], ["Technician Availability", "technicians"], ["Defect Reports", "defectReports"], ["Maintenance History", "maintenanceHistory"], ["Block Requests", "blockRequests"], ["Recommendations", "recommendations"], ["Approvals", "approvals"], ["Department Performance", "performance"], ["Corridors", "corridors"], ["Operational Conflicts", "conflicts"], ["Operational Alerts", "alerts"], ["Roles", "roles"], ["Admin Users", "adminUsers"], ["Configuration", "configuration"], ["Audit Logs", "auditLogs"]]) {
    const result = report[key];
    console.log(`${label}:`);
    console.log(`Source: ${result.source}`);
    console.log(`Imported: ${result.imported}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Failed: ${result.failed}\n`);
  }
  printMap("Generated defaults:", report.generatedDefaults);
  printMap("Generated demo data:", report.generatedDemoData);
  printMap("Skipped reasons:", report.skippedReasons);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log("Reference-only files: planning.json, analytics.json, README.json");
}

async function main() {
  console.log(`Dataset import started from ${datasetDirectory}...`);
  const assets = await readJson(sourceFiles.assets);
  const defects = await readJson(sourceFiles.defects);
  const maintenance = await readJson(sourceFiles.maintenance);
  const trains = await readJson(sourceFiles.trains);
  const blocks = await readJson(sourceFiles.blocks);
  const failureRisk = await readJson(sourceFiles.failureRisk);
  const spares = await readJson(sourceFiles.spares);
  const technicians = await readJson(sourceFiles.technicians);
  const planning = await readJson(sourceFiles.planning);
  const frontend = await readFrontendMockData();
  await readJson(sourceFiles.analytics);
  await readJson(sourceFiles.readme);

  const report = createReport({ assets, defects, maintenance, trains, blocks, failureRisk, spares, technicians, frontend });
  const indexes = await loadIndexes();
  await importAssets(assets, maintenance, report, indexes);
  await importDefects(defects, report, indexes);
  await importMaintenance(maintenance, planning, report, indexes);
  await importBlocks(blocks, report, indexes);
  await importTrains(trains, report, indexes);
  await importSchedules(trains, blocks, report, indexes);
  const importedIndexes = await loadIndexes();
  await importFailureRisks(failureRisk, report, importedIndexes);
  await importSpares(spares, report, importedIndexes);
  await importTechnicians(technicians, report, importedIndexes);
  await importFrontendDefectReports(frontend.defectReports, report, importedIndexes);
  await importMaintenanceHistory(frontend.maintenanceHistory, report, importedIndexes);
  await importBlockRequests(frontend.blockRequests, report, importedIndexes);
  await importRecommendations(frontend.recommendations, report, importedIndexes);
  await importApprovals(frontend.approvals, report, importedIndexes);
  await importPerformance(frontend.performance, report, importedIndexes);
  await importCorridors(frontend.corridors, report, importedIndexes);
  const frontendIndexes = await loadIndexes();
  await importConflicts(frontend.conflicts, report, frontendIndexes);
  await importAlerts(frontend.alerts, report, frontendIndexes);
  await importRoles(frontend.roles, report);
  await importAdminUsers(frontend.adminUsers, report, frontendIndexes);
  await importConfiguration(frontend.configuration, report);
  await importAuditLogs(frontend.auditLogs, report);
  printSummary(report);
}

main()
  .catch((cause) => {
    console.error("Dataset import failed before completion.", cause);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
