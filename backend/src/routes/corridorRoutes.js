const express = require("express");
const { listCorridors } = require("../controllers/operationsController");

const router = express.Router();
router.get("/", listCorridors);
module.exports = router;
