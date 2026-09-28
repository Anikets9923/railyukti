const express = require("express");
const { getDashboard, getOptimization, getPerformance } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/overview", getDashboard);
router.get("/performance", getPerformance);
router.get("/optimization/:id", getOptimization);

module.exports = router;