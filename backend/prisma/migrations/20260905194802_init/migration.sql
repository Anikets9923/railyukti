-- CreateEnum
CREATE TYPE "AssetCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MaintenanceTaskType" AS ENUM ('INSPECTION', 'PREVENTIVE', 'CORRECTIVE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MaintenanceTaskStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrainScheduleStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BlockWindowStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'UNAVAILABLE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BlockPlanStatus" AS ENUM ('DRAFT', 'OPTIMIZED', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduledTaskStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetCode" VARCHAR(50) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "assetType" VARCHAR(100) NOT NULL,
    "criticality" "AssetCriticality" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastMaintenance" DATE,
    "nextMaintenance" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "defectCode" VARCHAR(50) NOT NULL,
    "assetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "sourceSystem" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTask" (
    "id" TEXT NOT NULL,
    "taskCode" VARCHAR(50) NOT NULL,
    "assetId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "taskType" "MaintenanceTaskType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "priorityScore" DOUBLE PRECISION,
    "status" "MaintenanceTaskStatus" NOT NULL DEFAULT 'PLANNED',
    "dueDate" DATE NOT NULL,
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "estimatedDuration" INTEGER NOT NULL,
    "crewRequired" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Train" (
    "id" TEXT NOT NULL,
    "trainNumber" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "trainType" VARCHAR(50),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Train_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainSchedule" (
    "id" TEXT NOT NULL,
    "trainId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "arrivalTime" TIME(0) NOT NULL,
    "departureTime" TIME(0) NOT NULL,
    "status" "TrainScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockWindow" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "maxDuration" INTEGER NOT NULL,
    "status" "BlockWindowStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockPlan" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "status" "BlockPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "utilization" DOUBLE PRECISION,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "optimizationScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL,
    "maintenanceTaskId" TEXT NOT NULL,
    "blockPlanId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledTaskStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Section_code_key" ON "Section"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "Asset"("assetCode");

-- CreateIndex
CREATE INDEX "Asset_departmentId_idx" ON "Asset"("departmentId");

-- CreateIndex
CREATE INDEX "Asset_sectionId_idx" ON "Asset"("sectionId");

-- CreateIndex
CREATE INDEX "Asset_criticality_status_idx" ON "Asset"("criticality", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Defect_defectCode_key" ON "Defect"("defectCode");

-- CreateIndex
CREATE INDEX "Defect_assetId_idx" ON "Defect"("assetId");

-- CreateIndex
CREATE INDEX "Defect_status_severity_idx" ON "Defect"("status", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceTask_taskCode_key" ON "MaintenanceTask"("taskCode");

-- CreateIndex
CREATE INDEX "MaintenanceTask_assetId_idx" ON "MaintenanceTask"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceTask_departmentId_idx" ON "MaintenanceTask"("departmentId");

-- CreateIndex
CREATE INDEX "MaintenanceTask_sectionId_idx" ON "MaintenanceTask"("sectionId");

-- CreateIndex
CREATE INDEX "MaintenanceTask_status_dueDate_idx" ON "MaintenanceTask"("status", "dueDate");

-- CreateIndex
CREATE INDEX "MaintenanceTask_priorityScore_idx" ON "MaintenanceTask"("priorityScore");

-- CreateIndex
CREATE UNIQUE INDEX "Train_trainNumber_key" ON "Train"("trainNumber");

-- CreateIndex
CREATE INDEX "TrainSchedule_trainId_idx" ON "TrainSchedule"("trainId");

-- CreateIndex
CREATE INDEX "TrainSchedule_sectionId_date_idx" ON "TrainSchedule"("sectionId", "date");

-- CreateIndex
CREATE INDEX "TrainSchedule_date_status_idx" ON "TrainSchedule"("date", "status");

-- CreateIndex
CREATE INDEX "BlockWindow_sectionId_date_idx" ON "BlockWindow"("sectionId", "date");

-- CreateIndex
CREATE INDEX "BlockWindow_date_status_idx" ON "BlockWindow"("date", "status");

-- CreateIndex
CREATE INDEX "BlockPlan_sectionId_date_idx" ON "BlockPlan"("sectionId", "date");

-- CreateIndex
CREATE INDEX "BlockPlan_date_status_idx" ON "BlockPlan"("date", "status");

-- CreateIndex
CREATE INDEX "BlockPlan_priority_idx" ON "BlockPlan"("priority");

-- CreateIndex
CREATE INDEX "ScheduledTask_maintenanceTaskId_idx" ON "ScheduledTask"("maintenanceTaskId");

-- CreateIndex
CREATE INDEX "ScheduledTask_blockPlanId_idx" ON "ScheduledTask"("blockPlanId");

-- CreateIndex
CREATE INDEX "ScheduledTask_startTime_endTime_idx" ON "ScheduledTask"("startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTask_maintenanceTaskId_blockPlanId_key" ON "ScheduledTask"("maintenanceTaskId", "blockPlanId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainSchedule" ADD CONSTRAINT "TrainSchedule_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainSchedule" ADD CONSTRAINT "TrainSchedule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockWindow" ADD CONSTRAINT "BlockWindow_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockPlan" ADD CONSTRAINT "BlockPlan_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_maintenanceTaskId_fkey" FOREIGN KEY ("maintenanceTaskId") REFERENCES "MaintenanceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_blockPlanId_fkey" FOREIGN KEY ("blockPlanId") REFERENCES "BlockPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
