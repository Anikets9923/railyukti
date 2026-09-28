const express = require("express");
const { decidePlan, listApprovals } = require("../controllers/divisionalController");

const router = express.Router();

router.get("/approvals", listApprovals);

module.exports = router;
