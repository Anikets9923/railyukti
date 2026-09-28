-- CreateEnum
CREATE TYPE "BlockRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('OPEN', 'ACCEPTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlanningPeriodType" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "OperationalConflictStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "OperationalAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AdminUserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "MaintenanceHistory" (
    "id" TEXT NOT NULL,
    "historyCode" VARCHAR(50) NOT NULL,
    "assetId" TEXT NOT NULL,
    "maintenanceTaskId" TEXT,
    "eventType" VARCHAR(40) NOT NULL,
    "summary" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "performedBy" VARCHAR(80) NOT NULL,
    "notes" TEXT,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_DATA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockRequest" (
    "id" TEXT NOT NULL,
    "requestCode" VARCHAR(50) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "blockWindowId" TEXT,
    "corridorCode" VARCHAR(50) NOT NULL,
    "requestedWindow" VARCHAR(60) NOT NULL,
    "requestedFor" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "requestedByRole" VARCHAR(50) NOT NULL,
    "status" "BlockRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decisionNote" TEXT,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_DATA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "recommendationCode" VARCHAR(50) NOT NULL,
    "maintenanceTaskId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "rationale" TEXT NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "recommendedDate" DATE,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "approvalCode" VARCHAR(50) NOT NULL,
    "blockPlanId" TEXT,
    "blockRequestId" TEXT,
    "departmentId" TEXT,
    "requestedByRole" VARCHAR(50) NOT NULL,
    "requestedAction" VARCHAR(40) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_DATA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentPerformance" (
    "id" TEXT NOT NULL,
    "performanceCode" VARCHAR(60) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "periodType" "PlanningPeriodType" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "totalTasks" INTEGER NOT NULL,
    "completedTasks" INTEGER NOT NULL,
    "overdueTasks" INTEGER NOT NULL,
    "scheduledTasks" INTEGER NOT NULL,
    "assetAvailabilityScore" DOUBLE PRECISION NOT NULL,
    "blockUtilization" DOUBLE PRECISION NOT NULL,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_ANALYTICS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Corridor" (
    "id" TEXT NOT NULL,
    "corridorCode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "sectionId" TEXT,
    "status" VARCHAR(30) NOT NULL,
    "description" TEXT NOT NULL,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_OPERATIONS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Corridor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalConflict" (
    "id" TEXT NOT NULL,
    "conflictCode" VARCHAR(50) NOT NULL,
    "trainScheduleId" TEXT,
    "blockWindowId" TEXT,
    "corridorId" TEXT,
    "conflictType" VARCHAR(50) NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "status" "OperationalConflictStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_OPERATIONS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalAlert" (
    "id" TEXT NOT NULL,
    "alertCode" VARCHAR(50) NOT NULL,
    "conflictId" TEXT,
    "corridorId" TEXT,
    "severity" "DefectSeverity" NOT NULL,
    "status" "OperationalAlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" VARCHAR(160) NOT NULL,
    "message" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_OPERATIONS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "roleCode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "userCode" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "roleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "status" "AdminUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfiguration" (
    "id" TEXT NOT NULL,
    "configKey" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "environment" VARCHAR(30) NOT NULL,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "auditCode" VARCHAR(60) NOT NULL,
    "actorUserId" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "resourceType" VARCHAR(50) NOT NULL,
    "resourceId" TEXT,
    "details" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sourceSystem" VARCHAR(40) NOT NULL DEFAULT 'SYNTHETIC_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceHistory_historyCode_key" ON "MaintenanceHistory"("historyCode");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_assetId_completedAt_idx" ON "MaintenanceHistory"("assetId", "completedAt");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_maintenanceTaskId_idx" ON "MaintenanceHistory"("maintenanceTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockRequest_requestCode_key" ON "BlockRequest"("requestCode");

-- CreateIndex
CREATE INDEX "BlockRequest_departmentId_status_idx" ON "BlockRequest"("departmentId", "status");

-- CreateIndex
CREATE INDEX "BlockRequest_sectionId_createdAt_idx" ON "BlockRequest"("sectionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_recommendationCode_key" ON "Recommendation"("recommendationCode");

-- CreateIndex
CREATE INDEX "Recommendation_departmentId_status_idx" ON "Recommendation"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_maintenanceTaskId_idx" ON "Recommendation"("maintenanceTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRequest_approvalCode_key" ON "ApprovalRequest"("approvalCode");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_createdAt_idx" ON "ApprovalRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_blockPlanId_idx" ON "ApprovalRequest"("blockPlanId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_blockRequestId_idx" ON "ApprovalRequest"("blockRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentPerformance_performanceCode_key" ON "DepartmentPerformance"("performanceCode");

-- CreateIndex
CREATE INDEX "DepartmentPerformance_periodType_periodStart_idx" ON "DepartmentPerformance"("periodType", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentPerformance_departmentId_periodType_periodStart_p_key" ON "DepartmentPerformance"("departmentId", "periodType", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Corridor_corridorCode_key" ON "Corridor"("corridorCode");

-- CreateIndex
CREATE INDEX "Corridor_sectionId_status_idx" ON "Corridor"("sectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalConflict_conflictCode_key" ON "OperationalConflict"("conflictCode");

-- CreateIndex
CREATE INDEX "OperationalConflict_status_severity_idx" ON "OperationalConflict"("status", "severity");

-- CreateIndex
CREATE INDEX "OperationalConflict_trainScheduleId_idx" ON "OperationalConflict"("trainScheduleId");

-- CreateIndex
CREATE INDEX "OperationalConflict_blockWindowId_idx" ON "OperationalConflict"("blockWindowId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalAlert_alertCode_key" ON "OperationalAlert"("alertCode");

-- CreateIndex
CREATE INDEX "OperationalAlert_status_severity_idx" ON "OperationalAlert"("status", "severity");

-- CreateIndex
CREATE INDEX "OperationalAlert_conflictId_idx" ON "OperationalAlert"("conflictId");

-- CreateIndex
CREATE INDEX "OperationalAlert_corridorId_idx" ON "OperationalAlert"("corridorId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleCode_key" ON "Role"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_userCode_key" ON "AdminUser"("userCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_roleId_idx" ON "AdminUser"("roleId");

-- CreateIndex
CREATE INDEX "AdminUser_departmentId_idx" ON "AdminUser"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfiguration_configKey_key" ON "SystemConfiguration"("configKey");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_auditCode_key" ON "AuditLog"("auditCode");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- AddForeignKey
ALTER TABLE "MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_maintenanceTaskId_fkey" FOREIGN KEY ("maintenanceTaskId") REFERENCES "MaintenanceTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRequest" ADD CONSTRAINT "BlockRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRequest" ADD CONSTRAINT "BlockRequest_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRequest" ADD CONSTRAINT "BlockRequest_blockWindowId_fkey" FOREIGN KEY ("blockWindowId") REFERENCES "BlockWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_maintenanceTaskId_fkey" FOREIGN KEY ("maintenanceTaskId") REFERENCES "MaintenanceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_blockPlanId_fkey" FOREIGN KEY ("blockPlanId") REFERENCES "BlockPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_blockRequestId_fkey" FOREIGN KEY ("blockRequestId") REFERENCES "BlockRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentPerformance" ADD CONSTRAINT "DepartmentPerformance_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corridor" ADD CONSTRAINT "Corridor_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalConflict" ADD CONSTRAINT "OperationalConflict_trainScheduleId_fkey" FOREIGN KEY ("trainScheduleId") REFERENCES "TrainSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalConflict" ADD CONSTRAINT "OperationalConflict_blockWindowId_fkey" FOREIGN KEY ("blockWindowId") REFERENCES "BlockWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalConflict" ADD CONSTRAINT "OperationalConflict_corridorId_fkey" FOREIGN KEY ("corridorId") REFERENCES "Corridor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalAlert" ADD CONSTRAINT "OperationalAlert_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "OperationalConflict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalAlert" ADD CONSTRAINT "OperationalAlert_corridorId_fkey" FOREIGN KEY ("corridorId") REFERENCES "Corridor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
