const express = require("express");
const controller = require("../controllers/adminController");

const router = express.Router();
for (const resource of controller.resources) {
  router.get(`/${resource}`, controller.listResource(resource));
  router.post(`/${resource}`, controller.saveResource(resource));
  router.put(`/${resource}/:id`, controller.saveResource(resource));
}
router.get("/audit-logs", controller.listAuditLogs);

module.exports = router;
