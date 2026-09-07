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
};

async function readJson(fileName) {
  const content = await fs.readFile(path.join(datasetDirectory, fileName), "utf8");
  return JSON.parse(content);
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
  const date = new Date(`${String(value).replace(" ", "T")}Z`);
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

  return {
    departments: new Map(departments.map((item) => [item.code, item])),
    sections: new Map(sections.map((item) => [item.code, item])),
    assets: new Map(assets.map((item) => [item.assetCode, item])),
    trains: new Map(trains.map((item) => [item.trainNumber, item])),
    maintenance: new Map(maintenance.map((item) => [item.taskCode, item])),
  };
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

function printMap(title, map) {
  console.log(title);
  if (!map.size) console.log("- none");
  for (const [key, count] of map) console.log(`- ${key}: ${count}`);
}

function printSummary(report) {
  console.log("\nDATASET IMPORT SUMMARY\n");
  for (const [label, key] of [["Assets", "assets"], ["Defects", "defects"], ["Maintenance", "maintenance"], ["Trains", "trains"], ["Schedules", "schedules"], ["Block Windows", "blocks"], ["Failure Risk", "failureRisk"], ["Spare Availability", "spares"], ["Technician Availability", "technicians"]]) {
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
  await readJson(sourceFiles.analytics);
  await readJson(sourceFiles.readme);

  const report = createReport({ assets, defects, maintenance, trains, blocks, failureRisk, spares, technicians });
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
