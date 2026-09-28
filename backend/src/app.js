require("dotenv/config");

const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const assetRoutes = require("./routes/assetRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const trainRoutes = require("./routes/trainRoutes");
const blockWindowRoutes = require("./routes/blockWindowRoutes");
const planningRoutes = require("./routes/planningRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { failureRiskRouter, sparesRouter, technicianRouter } = require("./routes/resourceInputRoutes");
const defectController = require("./controllers/defectController");
const departmentOfficerRoutes = require("./routes/departmentOfficerRoutes");
const divisionalRoutes = require("./routes/divisionalRoutes");
const operationsRoutes = require("./routes/operationsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const corridorRoutes = require("./routes/corridorRoutes");
const notFoundHandler = require("./middleware/notFoundHandler");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", healthRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/blocks", blockWindowRoutes);
app.use("/api/planning", planningRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/failure-risk", failureRiskRouter);
app.use("/api/spares", sparesRouter);
app.use("/api/technicians", technicianRouter);
app.use("/api/department-officer", departmentOfficerRoutes);
app.use("/api/divisional", divisionalRoutes);
app.use("/api/operations", operationsRoutes);
app.use("/api/corridors", corridorRoutes);
app.use("/api/admin", adminRoutes);
app.post("/api/defects", defectController.createDefect);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;