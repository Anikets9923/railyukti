require("dotenv/config");

const {
  AssetCriticality,
  AssetStatus,
  DefectSeverity,
  DefectStatus,
  MaintenanceTaskType,
  MaintenanceTaskStatus,
  TrainScheduleStatus,
  BlockWindowStatus,
  PrismaClient,
} = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const planningStart = new Date(Date.UTC(2026, 8, 6));

function planningDate(dayOffset) {
  return new Date(planningStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}

function time(hour, minute) {
  return new Date(Date.UTC(1970, 0, 1, hour, minute));
}

function timestamp(dayOffset, hour, minute) {
  return new Date(Date.UTC(2026, 8, 6 + dayOffset, hour, minute));
}

async function seed() {
  await prisma.$transaction(async (transaction) => {
    await transaction.scheduledTask.deleteMany();
    await transaction.blockPlan.deleteMany();
    await transaction.trainSchedule.deleteMany();
    await transaction.blockWindow.deleteMany();
    await transaction.maintenanceTask.deleteMany();
    await transaction.defect.deleteMany();
    await transaction.asset.deleteMany();
    await transaction.train.deleteMany();
    await transaction.section.deleteMany();
    await transaction.department.deleteMany();

    const departments = {};
    for (const department of [
      {
        code: "ENG",
        name: "Engineering",
        description: "Synthetic track and civil maintenance department.",
      },
      {
        code: "TRD",
        name: "Traction Distribution",
        description: "Synthetic traction power maintenance department.",
      },
      {
        code: "SNT",
        name: "Signal and Telecom",
        description: "Synthetic signalling and telecommunications department.",
      },
    ]) {
      departments[department.code] = await transaction.department.create({
        data: department,
      });
    }

    const sections = {};
    for (const section of [
      {
        code: "SEC-A1",
        name: "Aravali Yard - East Loop",
        description: "Fictional double-line section used for prototype planning.",
      },
      {
        code: "SEC-B1",
        name: "Bharatpur - Central Junction",
        description: "Fictional mixed-traffic section used for prototype planning.",
      },
      {
        code: "SEC-C1",
        name: "Chambal - Riverside Block",
        description: "Fictional bridge and approach section used for prototype planning.",
      },
      {
        code: "SEC-D1",
        name: "Dhaulagiri - Industrial Spur",
        description: "Fictional industrial spur used for prototype planning.",
      },
    ]) {
      sections[section.code] = await transaction.section.create({ data: section });
    }

    const assets = {};
    const assetData = [
      ["ENG-TRK-001", "ENG", "SEC-A1", "Main line track panel", AssetCriticality.CRITICAL, AssetStatus.ACTIVE, 0, 35],
      ["ENG-TRK-002", "ENG", "SEC-B1", "Turnout assembly", AssetCriticality.HIGH, AssetStatus.ACTIVE, -80, 20],
      ["ENG-BRG-001", "ENG", "SEC-C1", "Bridge expansion joint", AssetCriticality.HIGH, AssetStatus.UNDER_MAINTENANCE, -120, 10],
      ["TRD-OHE-001", "TRD", "SEC-A1", "Section insulator", AssetCriticality.HIGH, AssetStatus.ACTIVE, -45, 25],
      ["TRD-FDR-002", "TRD", "SEC-B1", "Traction feeder breaker", AssetCriticality.CRITICAL, AssetStatus.ACTIVE, -150, 5],
      ["TRD-PSI-001", "TRD", "SEC-D1", "Auxiliary power switch", AssetCriticality.MEDIUM, AssetStatus.ACTIVE, -20, 50],
      ["SNT-AXL-001", "SNT", "SEC-A1", "Axle counter evaluator", AssetCriticality.CRITICAL, AssetStatus.ACTIVE, -65, 15],
      ["SNT-SIG-004", "SNT", "SEC-B1", "Home signal controller", AssetCriticality.HIGH, AssetStatus.ACTIVE, -30, 30],
      ["SNT-TEL-002", "SNT", "SEC-D1", "Emergency communication cabinet", AssetCriticality.MEDIUM, AssetStatus.ACTIVE, -10, 60],
    ];

    for (const [assetCode, departmentCode, sectionCode, assetType, criticality, status, lastOffset, nextOffset] of assetData) {
      assets[assetCode] = await transaction.asset.create({
        data: {
          assetCode,
          departmentId: departments[departmentCode].id,
          sectionId: sections[sectionCode].id,
          assetType,
          criticality,
          status,
          lastMaintenance: planningDate(lastOffset),
          nextMaintenance: planningDate(nextOffset),
        },
      });
    }

    const defects = [
      ["DEF-ENG-001", "ENG-TRK-001", "Gauge variance detected on a short synthetic track segment.", DefectSeverity.CRITICAL, DefectStatus.OPEN, 0],
      ["DEF-ENG-002", "ENG-TRK-002", "Turnout detection is intermittent during simulated route setting.", DefectSeverity.HIGH, DefectStatus.IN_PROGRESS, -2],
      ["DEF-ENG-003", "ENG-BRG-001", "Expansion joint movement exceeds the fictional inspection threshold.", DefectSeverity.HIGH, DefectStatus.OPEN, -4],
      ["DEF-TRD-001", "TRD-OHE-001", "Insulator contamination causes a simulated low insulation reading.", DefectSeverity.MEDIUM, DefectStatus.OPEN, -1],
      ["DEF-TRD-002", "TRD-FDR-002", "Feeder breaker trip test is overdue in the synthetic register.", DefectSeverity.CRITICAL, DefectStatus.OPEN, -8],
      ["DEF-SNT-001", "SNT-AXL-001", "Evaluator channel reports a simulated axle count mismatch.", DefectSeverity.CRITICAL, DefectStatus.IN_PROGRESS, -3],
      ["DEF-SNT-002", "SNT-SIG-004", "Signal controller cabinet fan alarm remains active.", DefectSeverity.HIGH, DefectStatus.OPEN, -2],
      ["DEF-SNT-003", "SNT-TEL-002", "Backup battery capacity is below the synthetic service threshold.", DefectSeverity.LOW, DefectStatus.RESOLVED, -12],
    ];

    for (const [defectCode, assetCode, description, severity, status, detectedOffset] of defects) {
      await transaction.defect.create({
        data: {
          defectCode,
          assetId: assets[assetCode].id,
          description,
          severity,
          status,
          detectedAt: timestamp(detectedOffset, 9, 15),
          resolvedAt: status === DefectStatus.RESOLVED ? timestamp(-2, 16, 30) : null,
          sourceSystem: assetCode.startsWith("ENG") ? "SYNTHETIC_TMS" : assetCode.startsWith("TRD") ? "SYNTHETIC_TDMS" : "SYNTHETIC_SMMS",
        },
      });
    }

    const tasks = [
      ["TASK-ENG-001", "ENG-TRK-001", "ENG", "SEC-A1", MaintenanceTaskType.EMERGENCY, "Correct gauge variance and verify the track panel before the next planning cycle.", DefectSeverity.CRITICAL, 98, MaintenanceTaskStatus.PLANNED, -3, 120, 4],
      ["TASK-ENG-002", "ENG-TRK-002", "ENG", "SEC-B1", MaintenanceTaskType.CORRECTIVE, "Inspect and adjust turnout detection linkage.", DefectSeverity.HIGH, 84, MaintenanceTaskStatus.PLANNED, -1, 90, 3],
      ["TASK-ENG-003", "ENG-BRG-001", "ENG", "SEC-C1", MaintenanceTaskType.PREVENTIVE, "Replace bridge expansion joint fasteners and complete measurement checks.", DefectSeverity.HIGH, 78, MaintenanceTaskStatus.PLANNED, 1, 180, 5],
      ["TASK-TRD-001", "TRD-OHE-001", "TRD", "SEC-A1", MaintenanceTaskType.CORRECTIVE, "Clean and test the section insulator under an isolated block.", DefectSeverity.MEDIUM, 62, MaintenanceTaskStatus.PLANNED, -1, 75, 2],
      ["TASK-TRD-002", "TRD-FDR-002", "TRD", "SEC-B1", MaintenanceTaskType.EMERGENCY, "Perform feeder breaker trip test and replace the simulated relay module.", DefectSeverity.CRITICAL, 96, MaintenanceTaskStatus.PLANNED, -6, 120, 4],
      ["TASK-TRD-003", "TRD-PSI-001", "TRD", "SEC-D1", MaintenanceTaskType.INSPECTION, "Inspect auxiliary power switch contacts and record thermal readings.", DefectSeverity.LOW, 35, MaintenanceTaskStatus.PLANNED, 3, 60, 2],
      ["TASK-SNT-001", "SNT-AXL-001", "SNT", "SEC-A1", MaintenanceTaskType.EMERGENCY, "Diagnose axle counter mismatch and perform evaluator channel reset.", DefectSeverity.CRITICAL, 94, MaintenanceTaskStatus.PLANNED, -2, 90, 3],
      ["TASK-SNT-002", "SNT-SIG-004", "SNT", "SEC-B1", MaintenanceTaskType.CORRECTIVE, "Replace cabinet fan and validate home signal controller telemetry.", DefectSeverity.HIGH, 80, MaintenanceTaskStatus.PLANNED, 0, 75, 2],
      ["TASK-SNT-003", "SNT-TEL-002", "SNT", "SEC-D1", MaintenanceTaskType.PREVENTIVE, "Complete backup battery discharge test and terminal cleaning.", DefectSeverity.LOW, 30, MaintenanceTaskStatus.PLANNED, 4, 90, 2],
      ["TASK-ENG-004", "ENG-TRK-001", "ENG", "SEC-A1", MaintenanceTaskType.INSPECTION, "Measure adjacent rail profile while the track panel is already blocked.", DefectSeverity.MEDIUM, 68, MaintenanceTaskStatus.PLANNED, 2, 60, 2],
      ["TASK-TRD-004", "TRD-OHE-001", "TRD", "SEC-A1", MaintenanceTaskType.INSPECTION, "Inspect nearby catenary fittings during the same access window.", DefectSeverity.MEDIUM, 66, MaintenanceTaskStatus.PLANNED, 2, 60, 2],
    ];

    for (const [taskCode, assetCode, departmentCode, sectionCode, taskType, description, severity, priorityScore, status, dueOffset, estimatedDuration, crewRequired] of tasks) {
      await transaction.maintenanceTask.create({
        data: {
          taskCode,
          assetId: assets[assetCode].id,
          departmentId: departments[departmentCode].id,
          sectionId: sections[sectionCode].id,
          taskType,
          description,
          severity,
          priorityScore,
          status,
          dueDate: planningDate(dueOffset),
          overdueDays: Math.max(0, -dueOffset),
          estimatedDuration,
          crewRequired,
        },
      });
    }

    const trains = {};
    for (const train of [
      ["SYN-101", "Aravali Morning Service", "Passenger"],
      ["SYN-202", "Bharatpur Intercity", "Passenger"],
      ["SYN-303", "Chambal Materials Special", "Freight"],
      ["SYN-404", "Dhaulagiri Night Service", "Passenger"],
    ]) {
      trains[train[0]] = await transaction.train.create({
        data: { trainNumber: train[0], name: train[1], trainType: train[2] },
      });
    }

    const schedules = [
      ["SYN-101", "SEC-A1", 0, 6, 30, 6, 45],
      ["SYN-202", "SEC-A1", 0, 9, 30, 9, 50],
      ["SYN-303", "SEC-A1", 0, 13, 0, 13, 30],
      ["SYN-404", "SEC-A1", 0, 18, 15, 18, 35],
      ["SYN-101", "SEC-B1", 0, 7, 45, 8, 0],
      ["SYN-202", "SEC-B1", 0, 11, 0, 11, 20],
      ["SYN-303", "SEC-B1", 0, 15, 30, 16, 0],
      ["SYN-404", "SEC-B1", 0, 20, 10, 20, 30],
      ["SYN-303", "SEC-C1", 1, 8, 30, 8, 50],
      ["SYN-101", "SEC-C1", 1, 12, 15, 12, 35],
      ["SYN-202", "SEC-D1", 1, 10, 0, 10, 20],
      ["SYN-404", "SEC-D1", 1, 17, 45, 18, 5],
    ];

    for (const [trainNumber, sectionCode, dayOffset, arrivalHour, arrivalMinute, departureHour, departureMinute] of schedules) {
      await transaction.trainSchedule.create({
        data: {
          trainId: trains[trainNumber].id,
          sectionId: sections[sectionCode].id,
          date: planningDate(dayOffset),
          arrivalTime: time(arrivalHour, arrivalMinute),
          departureTime: time(departureHour, departureMinute),
          status: TrainScheduleStatus.SCHEDULED,
        },
      });
    }

    const blockWindows = [
      ["SEC-A1", 0, 7, 0, 9, 15, 135, BlockWindowStatus.AVAILABLE],
      ["SEC-A1", 0, 10, 0, 12, 30, 150, BlockWindowStatus.AVAILABLE],
      ["SEC-A1", 0, 14, 0, 17, 30, 210, BlockWindowStatus.AVAILABLE],
      ["SEC-A1", 0, 18, 0, 19, 0, 60, BlockWindowStatus.UNAVAILABLE],
      ["SEC-B1", 0, 6, 30, 7, 30, 60, BlockWindowStatus.AVAILABLE],
      ["SEC-B1", 0, 8, 30, 10, 30, 120, BlockWindowStatus.AVAILABLE],
      ["SEC-B1", 0, 12, 0, 15, 0, 180, BlockWindowStatus.AVAILABLE],
      ["SEC-B1", 0, 16, 30, 20, 0, 210, BlockWindowStatus.UNAVAILABLE],
      ["SEC-C1", 1, 6, 0, 8, 0, 120, BlockWindowStatus.AVAILABLE],
      ["SEC-C1", 1, 9, 15, 12, 0, 165, BlockWindowStatus.AVAILABLE],
      ["SEC-D1", 1, 7, 0, 9, 30, 150, BlockWindowStatus.AVAILABLE],
      ["SEC-D1", 1, 11, 0, 17, 0, 360, BlockWindowStatus.UNAVAILABLE],
      ["SEC-D1", 1, 18, 30, 21, 0, 150, BlockWindowStatus.AVAILABLE],
    ];

    for (const [sectionCode, dayOffset, startHour, startMinute, endHour, endMinute, maxDuration, status] of blockWindows) {
      await transaction.blockWindow.create({
        data: {
          sectionId: sections[sectionCode].id,
          date: planningDate(dayOffset),
          startTime: time(startHour, startMinute),
          endTime: time(endHour, endMinute),
          maxDuration,
          status,
        },
      });
    }
  });

  const counts = [];
  counts.push(await prisma.department.count());
  counts.push(await prisma.section.count());
  counts.push(await prisma.asset.count());
  counts.push(await prisma.defect.count());
  counts.push(await prisma.maintenanceTask.count());
  counts.push(await prisma.train.count());
  counts.push(await prisma.trainSchedule.count());
  counts.push(await prisma.blockWindow.count());

  console.log("Synthetic railway planning data seeded successfully.");
  console.table({
    departments: counts[0],
    sections: counts[1],
    assets: counts[2],
    defects: counts[3],
    maintenanceTasks: counts[4],
    trains: counts[5],
    trainSchedules: counts[6],
    blockWindows: counts[7],
    blockPlans: await prisma.blockPlan.count(),
    scheduledTasks: await prisma.scheduledTask.count(),
  });
}

seed()
  .catch((error) => {
    console.error("Synthetic seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
