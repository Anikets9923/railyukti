const express = require("express");
const controller = require("../controllers/resourceInputController");

const failureRiskRouter = express.Router();
failureRiskRouter.get("/", controller.listFailureRisk);
failureRiskRouter.get("/:id", controller.getFailureRisk);

const sparesRouter = express.Router();
sparesRouter.get("/", controller.listSpares);
sparesRouter.get("/:id", controller.getSpare);

const technicianRouter = express.Router();
technicianRouter.get("/availability", controller.listTechnicians);
technicianRouter.get("/availability/:id", controller.getTechnician);

module.exports = { failureRiskRouter, sparesRouter, technicianRouter };
