const express = require("express");
const { listAlerts, listConflicts, listCorridors } = require("../controllers/operationsController");

const router = express.Router();

router.get("/corridors", listCorridors);
router.get("/conflicts", listConflicts);
router.get("/alerts", listAlerts);

module.exports = router;
