const express = require("express");
const { generatePlan, getPlanning, listPlanning } = require("../controllers/planningController");

const router = express.Router();

router.get("/", listPlanning);
router.post("/generate", generatePlan);
router.get("/:id", getPlanning);

module.exports = router;