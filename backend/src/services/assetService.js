const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const {
  buildPagination,
  parseEnum,
  parsePagination,
  parseOptionalString,
} = require("../validators/queryValidators");
const { AssetCriticality, AssetStatus } = require("@prisma/client");

async function listAssets(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const department = parseOptionalString(query.department, "department");
  const section = parseOptionalString(query.section, "section");
  const criticality = parseEnum(query.criticality, AssetCriticality, "criticality");
  const status = parseEnum(query.status, AssetStatus, "status");

  if (department) where.department = { code: department };
  if (section) where.section = { code: section };
  if (criticality) where.criticality = criticality;
  if (status) where.status = status;

  const [total, items] = await prisma.$transaction([
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where,
      skip,
      take: limit,
      orderBy: { assetCode: "asc" },
      include: {
        department: { select: { code: true, name: true } },
        section: { select: { code: true, name: true } },
        _count: { select: { defects: true, maintenanceTasks: true } },
      },
    }),
  ]);

  return { items, pagination: buildPagination(total, page, limit) };
}

async function getAssetById(id) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      department: { select: { code: true, name: true } },
      section: { select: { code: true, name: true } },
      defects: { orderBy: { detectedAt: "desc" } },
      maintenanceTasks: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!asset) throw new AppError("Asset not found", 404);
  return asset;
}

module.exports = { getAssetById, listAssets };