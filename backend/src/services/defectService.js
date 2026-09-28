const prisma = require("../database/prisma");
const AppError = require("../utils/appError");

async function createDefect(data) {
  const asset = data.assetId
    ? await prisma.asset.findUnique({ where: { id: data.assetId } })
    : await prisma.asset.findUnique({ where: { assetCode: data.assetCode } });
  if (!asset) throw new AppError("Asset not found", 400);

  if (data.departmentId && data.departmentId !== asset.departmentId) {
    throw new AppError("Asset does not belong to the selected department", 400);
  }
  if (data.sectionId && data.sectionId !== asset.sectionId) {
    throw new AppError("Asset does not belong to the selected section", 400);
  }

  const existing = await prisma.defect.findUnique({ where: { defectCode: data.defectCode } });
  if (existing) throw new AppError("Defect code already exists", 409);

  return prisma.defect.create({
    data: {
      defectCode: data.defectCode,
      assetId: asset.id,
      description: data.description,
      severity: data.severity,
      status: data.status,
      detectedAt: data.detectedAt || new Date(),
      sourceSystem: data.sourceSystem,
    },
    include: { asset: { select: { assetCode: true, assetType: true } } },
  });
}

module.exports = { createDefect };
