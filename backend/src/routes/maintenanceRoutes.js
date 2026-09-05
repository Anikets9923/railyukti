const express = require("express");
const {
  createMaintenance,
  getMaintenance,
  listMaintenance,
  updateMaintenance,
} = require("../controllers/maintenanceController");

const router = express.Router();

router.get("/", listMaintenance);
router.get("/:id", getMaintenance);
router.post("/", createMaintenance);
router.put("/:id", updateMaintenance);

module.exports = router;