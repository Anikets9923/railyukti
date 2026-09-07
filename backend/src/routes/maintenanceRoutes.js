const express = require("express");
const {
  createMaintenance,
  getMaintenance,
  listMaintenance,
  updateMaintenance,
} = require("../controllers/maintenanceController");
const { maintenanceFailureRisk, maintenanceSpares, maintenanceTechnicians } = require("../controllers/resourceInputController");

const router = express.Router();

router.get("/", listMaintenance);
router.get("/:id/failure-risk", maintenanceFailureRisk);
router.get("/:id/spares", maintenanceSpares);
router.get("/:id/technician-availability", maintenanceTechnicians);
router.get("/:id", getMaintenance);
router.post("/", createMaintenance);
router.put("/:id", updateMaintenance);

module.exports = router;