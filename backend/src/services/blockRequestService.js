const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const mapping = require("../../seed/dataset-mapping");

function resolveDepartmentCode(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "ENGINEERING") return "ENG";
  if (normalized === "S&T" || normalized === "SIGNAL AND TELECOM") return "SNT";
  return normalized;
}

async function createBlockRequest(input) {
  const departmentCode = resolveDepartmentCode(input.department);
  const department = await prisma.department.findUnique({ where: { code: departmentCode } });
  const sectionCode = mapping.departmentSectionMappings[departmentCode];
  const section = sectionCode ? await prisma.section.findUnique({ where: { code: sectionCode } }) : null;
  if (!department || !section) throw new AppError("Department mapping could not be resolved", 400);

  const requestCode = `REQ-${Date.now().toString(36).toUpperCase()}`;
  const request = await prisma.blockRequest.create({
    data: {
      requestCode,
      departmentId: department.id,
      sectionId: section.id,
      corridorCode: input.corridorCode,
      requestedWindow: input.requestedWindow,
      requestedFor: input.requestedFor,
      impact: input.impact,
      requestedByRole: "DEPARTMENT_PLANNER",
      status: "PENDING",
      sourceSystem: "SYNTHETIC_FRONTEND_REQUEST",
    },
    include: { department: true, section: true },
  });
  return { ...request, requestStatus: "PENDING_REVIEW" };
}

async function updateBlockRequest(id, input) {
  const existing = await prisma.blockRequest.findUnique({ where: { id }, include: { department: true, section: true } });
  if (!existing) throw new AppError("Block request not found", 404);
  if (input.status && ["APPROVED", "COMPLETED"].includes(String(input.status).toUpperCase())) {
    throw new AppError("A pending request cannot be approved through this endpoint", 400);
  }
  const data = { ...input };
  delete data.department;
  if (data.status) data.status = String(data.status).toUpperCase() === "PENDING_REVIEW" ? "PENDING" : String(data.status).toUpperCase();
  const updated = await prisma.blockRequest.update({ where: { id }, data, include: { department: true, section: true } });
  return { ...updated, requestStatus: updated.status === "PENDING" ? "PENDING_REVIEW" : updated.status };
}

module.exports = { createBlockRequest, updateBlockRequest };
