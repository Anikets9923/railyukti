const express = require("express");
const { decidePlan, generatePlan, getPlanning, listPlanning } = require("../controllers/planningController");
const { listMonthlyPlans, listRecommendations, listWeeklyPlans } = require("../controllers/departmentPlanningController");

const router = express.Router();

router.get("/", listPlanning);
router.get("/recommendations", listRecommendations);
router.get("/weekly", listWeeklyPlans);
router.get("/monthly", listMonthlyPlans);
router.post("/generate", generatePlan);
router.post("/:id/decision", decidePlan);
router.get("/:id", getPlanning);

module.exports = router;