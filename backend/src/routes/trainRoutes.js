const express = require("express");
const { getTrain, listTrainSchedules, listTrains } = require("../controllers/trainController");

const router = express.Router();

router.get("/", listTrains);
router.get("/schedule", listTrainSchedules);
router.get("/timetable", listTrainSchedules);
router.get("/:id", getTrain);

module.exports = router;