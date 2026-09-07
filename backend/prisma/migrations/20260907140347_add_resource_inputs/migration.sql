-- CreateTable
CREATE TABLE "FailureRisk" (
    "id" TEXT NOT NULL,
    "failureRiskCode" VARCHAR(50) NOT NULL,
    "assetId" TEXT NOT NULL,
    "maintenanceTaskId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" "DefectSeverity" NOT NULL,
    "failureProbability" DOUBLE PRECISION NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "daysToExpectedFailure" INTEGER NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailureRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpareAvailability" (
    "id" TEXT NOT NULL,
    "spareAvailabilityCode" VARCHAR(50) NOT NULL,
    "maintenanceTaskId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sparePartCode" VARCHAR(50) NOT NULL,
    "sparePartName" VARCHAR(120) NOT NULL,
    "requiredQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "availabilityStatus" VARCHAR(20) NOT NULL,
    "availabilityScore" INTEGER NOT NULL,
    "warehouse" VARCHAR(50) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpareAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianAvailability" (
    "id" TEXT NOT NULL,
    "technicianAvailabilityCode" VARCHAR(50) NOT NULL,
    "technicianId" VARCHAR(50) NOT NULL,
    "maintenanceTaskId" TEXT NOT NULL,
    "departmentCode" VARCHAR(20) NOT NULL,
    "sectionCode" VARCHAR(30) NOT NULL,
    "skill" VARCHAR(80) NOT NULL,
    "requiredTechnicians" INTEGER NOT NULL,
    "availableTechnicians" INTEGER NOT NULL,
    "availabilityStatus" VARCHAR(20) NOT NULL,
    "availabilityScore" INTEGER NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FailureRisk_failureRiskCode_key" ON "FailureRisk"("failureRiskCode");

-- CreateIndex
CREATE INDEX "FailureRisk_assetId_idx" ON "FailureRisk"("assetId");

-- CreateIndex
CREATE INDEX "FailureRisk_maintenanceTaskId_idx" ON "FailureRisk"("maintenanceTaskId");

-- CreateIndex
CREATE INDEX "FailureRisk_riskLevel_riskScore_idx" ON "FailureRisk"("riskLevel", "riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "SpareAvailability_spareAvailabilityCode_key" ON "SpareAvailability"("spareAvailabilityCode");

-- CreateIndex
CREATE INDEX "SpareAvailability_maintenanceTaskId_idx" ON "SpareAvailability"("maintenanceTaskId");

-- CreateIndex
CREATE INDEX "SpareAvailability_assetId_idx" ON "SpareAvailability"("assetId");

-- CreateIndex
CREATE INDEX "SpareAvailability_availabilityStatus_idx" ON "SpareAvailability"("availabilityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianAvailability_technicianAvailabilityCode_key" ON "TechnicianAvailability"("technicianAvailabilityCode");

-- CreateIndex
CREATE INDEX "TechnicianAvailability_maintenanceTaskId_idx" ON "TechnicianAvailability"("maintenanceTaskId");

-- CreateIndex
CREATE INDEX "TechnicianAvailability_availabilityStatus_idx" ON "TechnicianAvailability"("availabilityStatus");

-- CreateIndex
CREATE INDEX "TechnicianAvailability_departmentCode_sectionCode_idx" ON "TechnicianAvailability"("departmentCode", "sectionCode");

-- AddForeignKey
ALTER TABLE "FailureRisk" ADD CONSTRAINT "FailureRisk_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailureRisk" ADD CONSTRAINT "FailureRisk_maintenanceTaskId_fkey" FOREIGN KEY ("maintenanceTaskId") REFERENCES "MaintenanceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpareAvailability" ADD CONSTRAINT "SpareAvailability_maintenanceTaskId_fkey" FOREIGN KEY ("maintenanceTaskId") REFERENCES "MaintenanceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpareAvailability" ADD CONSTRAINT "SpareAvailability_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianAvailability" ADD CONSTRAINT "TechnicianAvailability_maintenanceTaskId_fkey" FOREIGN KEY ("maintenanceTaskId") REFERENCES "MaintenanceTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
