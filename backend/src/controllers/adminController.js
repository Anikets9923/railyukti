const asyncHandler = require("../middleware/asyncHandler");
const adminService = require("../services/adminService");
const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const { sendSuccess } = require("../utils/apiResponse");

const resources = ["users", "roles", "departments", "sections", "assets", "configuration"];

function listResource(resource) {
  return asyncHandler(async (request, response) => sendSuccess(response, `${resource} retrieved successfully`, await adminService.list(resource)));
}

function saveResource(resource) {
  return asyncHandler(async (request, response) => {
    const result = await adminService.save(resource, request.params.id, request.body || {});
    return sendSuccess(response, `${resource} saved successfully`, result, request.params.id ? 200 : 201);
  });
}

const listAuditLogs = asyncHandler(async (request, response) => {
  const items = await prisma.auditLog.findMany({ orderBy: { occurredAt: "desc" }, include: { actorUser: { select: { userCode: true, displayName: true } } } });
  return sendSuccess(response, "Audit logs retrieved successfully", { items, isDemoData: true });
});

module.exports = { listAuditLogs, listResource, resources, saveResource };
