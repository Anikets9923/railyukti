const express = require("express");
const { getDashboard, getOptimization } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/optimization/:id", getOptimization);

module.exports = router;