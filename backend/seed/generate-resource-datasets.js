const fs = require("node:fs");
const path = require("node:path");

const datasetDirectory = path.resolve(__dirname, "../../dataset");
const assets = JSON.parse(fs.readFileSync(path.join(datasetDirectory, "assets.json"), "utf8"));
const maintenance = JSON.parse(fs.readFileSync(path.join(datasetDirectory, "maintenance.json"), "utf8"));
const cityMappings = {
  Mumbai: { departmentCode: "ENG", sectionCode: "SEC-A1", warehouse: "WH-MUM-01", skill: "TRACK_MAINTENANCE" },
  Pune: { departmentCode: "ENG", sectionCode: "SEC-A1", warehouse: "WH-PUN-01", skill: "TRACK_MAINTENANCE" },
  Delhi: { departmentCode: "TRD", sectionCode: "SEC-B1", warehouse: "WH-DEL-01", skill: "TRACTION_POWER" },
  Howrah: { departmentCode: "TRD", sectionCode: "SEC-B1", warehouse: "WH-HWH-01", skill: "TRACTION_POWER" },
  Ernakulam: { departmentCode: "SNT", sectionCode: "SEC-C1", warehouse: "WH-ERN-01", skill: "SIGNAL_TELECOM" },
  Bangalore: { departmentCode: "SNT", sectionCode: "SEC-D1", warehouse: "WH-BLR-01", skill: "SIGNAL_TELECOM" },
};
const assetById = new Map(assets.map((asset) => [asset.asset_id, asset]));
const assetIds = [...assetById.keys()];
const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const spareStatuses = ["AVAILABLE", "PARTIAL", "NOT_AVAILABLE"];
const parts = ["SP-BRAKE", "SP-DOOR", "SP-HVAC", "SP-WHEEL", "SP-ELECTRICAL", "SP-SIGNAL"];
const partNames = ["Brake Assembly", "Door Actuator", "HVAC Module", "Wheel Set", "Electrical Relay", "Signal Interface"];

function iso(day, hour, minute) {
  return `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
}

function recordForMaintenance(task, index) {
  const asset = assetById.get(task.asset_id);
  const riskScore = [87, 64, 96, 42, 78][index % 5];
  const riskLevel = riskScore >= 90 ? "CRITICAL" : riskScore >= 75 ? "HIGH" : riskScore >= 50 ? "MEDIUM" : "LOW";
  const statusIndex = index % 3;
  const required = 1 + (index % 3);
  const available = statusIndex === 0 ? required + 1 : statusIndex === 1 ? Math.max(0, required - 1) : 0;
  const availabilityStatus = statusIndex === 0 ? "AVAILABLE" : statusIndex === 1 ? "PARTIAL" : "NOT_AVAILABLE";
  const mapping = cityMappings[asset.city];

  return {
    failureRisk: {
      failure_risk_id: `FR-${String(index + 1).padStart(4, "0")}`,
      asset_id: task.asset_id,
      maintenance_id: task.maintenance_id,
      risk_score: riskScore,
      risk_level: riskLevel,
      failure_probability: Number((riskScore / 100).toFixed(2)),
      impact_score: 1 + (index % 5),
      days_to_expected_failure: 5 + (index % 28),
      risk_factors: index % 2 === 0 ? ["Repeated defect", "Maintenance overdue"] : ["High asset criticality", "Maintenance due"],
      calculated_at: "2026-09-05T10:00:00Z",
    },
    spare: {
      spare_availability_id: `SPA-${String(index + 1).padStart(4, "0")}`,
      maintenance_id: task.maintenance_id,
      asset_id: task.asset_id,
      spare_part_code: `${parts[index % parts.length]}-${String((index % 6) + 1).padStart(3, "0")}`,
      spare_part_name: partNames[index % partNames.length],
      required_quantity: required,
      available_quantity: available,
      availability_status: availabilityStatus,
      availability_score: availabilityStatus === "AVAILABLE" ? 100 : availabilityStatus === "PARTIAL" ? 50 : 0,
      warehouse: mapping.warehouse,
      last_updated: "2026-09-05T09:30:00Z",
    },
    technician: {
      technician_availability_id: `TA-${String(index + 1).padStart(4, "0")}`,
      technician_id: `TECH-${String((index % 18) + 1).padStart(3, "0")}`,
      maintenance_id: task.maintenance_id,
      department_code: mapping.departmentCode,
      section_code: mapping.sectionCode,
      skill: mapping.skill,
      required_technicians: required,
      available_technicians: available,
      availability_status: availabilityStatus === "NOT_AVAILABLE" ? "UNAVAILABLE" : availabilityStatus,
      availability_score: availabilityStatus === "AVAILABLE" ? 100 : availabilityStatus === "PARTIAL" ? 50 : 0,
      available_from: iso(7 + (index % 7), 7, 0),
      available_until: iso(7 + (index % 7), 15, 0),
    },
  };
}

const generated = maintenance.map(recordForMaintenance);
fs.writeFileSync(path.join(datasetDirectory, "failure_risk.json"), `${JSON.stringify(generated.map((item) => item.failureRisk), null, 2)}\n`);
fs.writeFileSync(path.join(datasetDirectory, "spares_available.json"), `${JSON.stringify(generated.map((item) => item.spare), null, 2)}\n`);
fs.writeFileSync(path.join(datasetDirectory, "technician_available.json"), `${JSON.stringify(generated.map((item) => item.technician), null, 2)}\n`);
console.log(JSON.stringify({ assets: assets.length, maintenance: maintenance.length, failureRisk: generated.length, spares: generated.length, technicians: generated.length }, null, 2));
