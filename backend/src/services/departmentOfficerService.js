const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const { buildPagination, parseOptionalString, parsePagination } = require("../validators/queryValidators");

async function listRequests(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const department = parseOptionalString(query.department, "department");
  const status = parseOptionalString(query.status, "status");
  if (department) where.department = { code: department.toUpperCase() };
  if (status) where.status = status.toUpperCase() === "PENDING_REVIEW" ? "PENDING" : status.toUpperCase();
  const total = await prisma.blockRequest.count({ where });
  const items = await prisma.blockRequest.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { code: true, name: true } },
      section: { select: { code: true, name: true } },
      blockWindow: true,
      approvals: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return { items: items.map(normalizeRequest), pagination: buildPagination(total, page, limit) };
}

async function getRequest(id) {
  const request = await prisma.blockRequest.findUnique({
    where: { id },
    include: { department: true, section: true, blockWindow: true, approvals: { orderBy: { createdAt: "desc" } } },
  });
  if (!request) throw new AppError("Department request not found", 404);
  return normalizeRequest(request);
}

async function decideRequest(id, input) {
  const request = await prisma.blockRequest.findUnique({ where: { id } });
  if (!request) throw new AppError("Department request not found", 404);
  if (["APPROVED", "REJECTED", "CANCELLED"].includes(request.status)) {
    throw new AppError(`Request is already ${request.status}`, 400);
  }

  const approvalCode = `APR-API-${request.requestCode}`;
  const approval = await prisma.approvalRequest.upsert({
    where: { approvalCode },
    create: {
      approvalCode,
      blockRequestId: request.id,
      departmentId: request.departmentId,
      requestedByRole: input.requestedByRole,
      requestedAction: "BLOCK_REQUEST",
      status: input.status,
      decisionNote: input.decisionNote,
      decidedAt: new Date(),
      sourceSystem: "SYNTHETIC_DEPARTMENT_OFFICER",
    },
    update: {
      status: input.status,
      decisionNote: input.decisionNote,
      decidedAt: new Date(),
    },
  });
  const updated = await prisma.blockRequest.update({
    where: { id: request.id },
    data: { status: input.status, decisionNote: input.decisionNote },
    include: { department: { select: { code: true, name: true } }, section: { select: { code: true, name: true } }, approvals: true },
  });
  return { request: normalizeRequest(updated), approval };
}

async function listPerformance(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const department = parseOptionalString(query.department, "department");
  const periodType = parseOptionalString(query.periodType, "periodType");
  if (department) where.department = { code: department.toUpperCase() };
  if (periodType) where.periodType = periodType.toUpperCase();
  const total = await prisma.departmentPerformance.count({ where });
  const items = await prisma.departmentPerformance.findMany({
    where,
    skip,
    take: limit,
    orderBy: [{ periodStart: "desc" }, { department: { code: "asc" } }],
    include: { department: { select: { code: true, name: true } } },
  });
  return { items, pagination: buildPagination(total, page, limit) };
}

function normalizeRequest(request) {
  return {
    ...request,
    requestStatus: request.status === "PENDING" ? "PENDING_REVIEW" : request.status,
  };
}

module.exports = { decideRequest, getRequest, listPerformance, listRequests };
