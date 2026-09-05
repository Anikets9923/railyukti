const express = require("express");
const { getPlanning, listPlanning } = require("../controllers/planningController");

const router = express.Router();

router.get("/", listPlanning);
router.get("/:id", getPlanning);

module.exports = router;