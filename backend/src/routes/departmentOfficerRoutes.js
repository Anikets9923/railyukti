const express = require("express");
const controller = require("../controllers/departmentOfficerController");

const router = express.Router();

router.get("/requests", controller.listRequests);
router.get("/requests/:id", controller.getRequest);
router.post("/requests/:id/decision", controller.decideRequest);
router.get("/performance", controller.listPerformance);

module.exports = router;
