require("dotenv/config");

const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const assetRoutes = require("./routes/assetRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const trainRoutes = require("./routes/trainRoutes");
const blockWindowRoutes = require("./routes/blockWindowRoutes");
const planningRoutes = require("./routes/planningRoutes");
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

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;