const datasetMapping = {
  source: {
    snapshotDate: "2026-09-05",
  },
  cityMappings: {
    Mumbai: { departmentCode: "ENG", sectionCode: "SEC-A1" },
    Pune: { departmentCode: "ENG", sectionCode: "SEC-A1" },
    Delhi: { departmentCode: "TRD", sectionCode: "SEC-B1" },
    Howrah: { departmentCode: "TRD", sectionCode: "SEC-B1" },
    Ernakulam: { departmentCode: "SNT", sectionCode: "SEC-C1" },
    Bangalore: { departmentCode: "SNT", sectionCode: "SEC-D1" },
  },
  departmentSectionMappings: {
    ENG: "SEC-A1",
    TRD: "SEC-B1",
    SNT: "SEC-C1",
  },
  assetStatusMap: {
    AVAILABLE: "ACTIVE",
    OUT_OF_SERVICE: "INACTIVE",
    MAINTENANCE_DUE: "UNDER_MAINTENANCE",
  },
  taskTypeMap: {
    Preventive: "PREVENTIVE",
    POH: "PREVENTIVE",
    Corrective: "CORRECTIVE",
    Inspection: "INSPECTION",
  },
  taskStatusMap: {
    IN_PROGRESS: "IN_PROGRESS",
    OVERDUE: "PLANNED",
    PENDING: "PLANNED",
    SCHEDULED: "PLANNED",
  },
  priorityScoreMap: {
    CRITICAL: 95,
    HIGH: 80,
    MEDIUM: 60,
    LOW: 30,
  },
  blockStatusMap: {
    APPROVED: "AVAILABLE",
    PENDING: "RESERVED",
  },
  defaults: {
    maintenanceDescription: "Imported from mock dataset",
    maintenanceSeverity: "MEDIUM",
    crewRequired: 1,
    trainActive: true,
    defectSourceSystem: "MOCK_DATASET",
  },
  demoSchedulePolicy: {
    enabled: true,
    date: "earliestBlockDateByOriginCity",
    arrivalOffsetMinutes: 60,
    status: "SCHEDULED",
    generatedDataMarker: "DEMO_GENERATED_SCHEDULE",
  },
};

module.exports = datasetMapping;
