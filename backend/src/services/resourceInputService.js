const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const { buildPagination, parseOptionalString, parsePagination } = require("../validators/queryValidators");

const resourceDefinitions = {
  failureRisk: {
    delegate: "failureRisk",
    orderBy: { riskScore: "desc" },
    include: { asset: { select: { assetCode: true, assetType: true } }, maintenanceTask: { select: { taskCode: true } } },
  },
  spares: {
    delegate: "spareAvailability",
    orderBy: { lastUpdated: "desc" },
    include: { asset: { select: { assetCode: true, assetType: true } }, maintenanceTask: { select: { taskCode: true } } },
  },
  technicians: {
    delegate: "technicianAvailability",
    orderBy: { availableFrom: "asc" },
    include: { maintenanceTask: { select: { taskCode: true } } },
  },
};

async function listResource(type, query) {
  const definition = resourceDefinitions[type];
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const status = parseOptionalString(query.status || query.riskLevel, query.status ? "status" : "riskLevel");
  if (type === "failureRisk" && status) where.riskLevel = status.toUpperCase();
  if (type !== "failureRisk" && status) where.availabilityStatus = status.toUpperCase();

  const delegate = prisma[definition.delegate];
  const total = await delegate.count({ where });
  const items = await delegate.findMany({ where, skip, take: limit, orderBy: definition.orderBy, include: definition.include });
  return { items, pagination: buildPagination(total, page, limit) };
}

async function getResource(type, id) {
  const definition = resourceDefinitions[type];
  const item = await prisma[definition.delegate].findUnique({ where: { id }, include: definition.include });
  if (!item) throw new AppError(`${type} record not found`, 404);
  return item;
}

async function listByRelation(type, relationField, relationId) {
  const definition = resourceDefinitions[type];
  const relation = await prisma[relationField].findUnique({ where: { id: relationId }, select: { id: true } });
  if (!relation) throw new AppError(`${relationField} not found`, 404);
  return prisma[definition.delegate].findMany({ where: { [relationField === "asset" ? "assetId" : "maintenanceTaskId"]: relationId }, orderBy: definition.orderBy, include: definition.include });
}

module.exports = { getResource, listByRelation, listResource };
