const prisma = require("../database/prisma");
const AppError = require("../utils/appError");

const secretPattern = /(password|secret|token|api[_-]?key|credential|private)/i;

async function list(resource) {
  const items = await getDelegate(resource).findMany({ orderBy: { createdAt: "desc" }, ...includeFor(resource) });
  return { items: items.map((item) => sanitize(resource, item)), isDemoData: true };
}

async function save(resource, id, body) {
  rejectSensitiveFields(body);
  const data = normalizePayload(resource, body);
  const delegate = getDelegate(resource);
  let item;
  if (!id) validateCreate(resource, data);
  if (id) {
    item = await delegate.update({ where: { id }, data, ...includeFor(resource) }).catch((error) => {
      if (error.code === "P2025") throw new AppError(`${resource} record not found`, 404);
      throw error;
    });
  } else {
    item = await delegate.create({ data, ...includeFor(resource) });
  }
  return sanitize(resource, item);
}

function getDelegate(resource) {
  const delegates = { users: "adminUser", roles: "role", departments: "department", sections: "section", assets: "asset", configuration: "systemConfiguration" };
  const delegate = delegates[resource];
  if (!delegate) throw new AppError("Unsupported admin resource", 400);
  return prisma[delegate];
}

function includeFor(resource) {
  if (resource === "users") return { include: { role: true, department: true } };
  if (resource === "assets") return { include: { department: true, section: true } };
  return {};
}

function normalizePayload(resource, body) {
  const value = (camel, snake = camel) => body[camel] ?? body[snake];
  if (resource === "roles") return { roleCode: value("roleCode", "role_code"), name: value("name"), description: value("description"), sourceSystem: "SYNTHETIC_ADMIN" };
  if (resource === "departments") return { code: value("code"), name: value("name"), description: value("description") || null };
  if (resource === "sections") return { code: value("code"), name: value("name"), description: value("description") || null };
  if (resource === "assets") return { assetCode: value("assetCode", "asset_code"), departmentId: value("departmentId", "department_id"), sectionId: value("sectionId", "section_id"), assetType: value("assetType", "asset_type"), criticality: value("criticality"), status: value("status") || "ACTIVE", lastMaintenance: value("lastMaintenance", "last_maintenance") || null, nextMaintenance: value("nextMaintenance", "next_maintenance") || null };
  if (resource === "configuration") return { configKey: value("configKey", "config_key"), value: value("value"), description: value("description"), environment: value("environment") || "demo", sourceSystem: "SYNTHETIC_ADMIN" };
  if (resource === "users") return { userCode: value("userCode", "user_code"), displayName: value("displayName", "display_name"), email: value("email"), roleId: value("roleId", "role_id"), departmentId: value("departmentId", "department_id") || null, status: value("status") || "ACTIVE", isDemo: true, sourceSystem: "SYNTHETIC_ADMIN" };
  throw new AppError("Unsupported admin resource", 400);
}

function validateCreate(resource, data) {
  const required = {
    users: ["userCode", "displayName", "email", "roleId"],
    roles: ["roleCode", "name", "description"],
    departments: ["code", "name"],
    sections: ["code", "name"],
    assets: ["assetCode", "departmentId", "sectionId", "assetType", "criticality"],
    configuration: ["configKey", "value", "description", "environment"],
  }[resource] || [];
  const missing = required.filter((field) => data[field] === undefined || data[field] === "");
  if (missing.length) throw new AppError(`Missing required fields: ${missing.join(", ")}`, 400);
}

function rejectSensitiveFields(body) {
  for (const key of Object.keys(body || {})) {
    if (secretPattern.test(key)) throw new AppError("Sensitive credential fields are not accepted by the demo admin API", 400);
  }
}

function sanitize(resource, item) {
  if (resource === "configuration") {
    const key = item.configKey || "";
    return { ...item, value: secretPattern.test(key) ? "[REDACTED]" : item.value };
  }
  if (resource === "users") {
    const { role, department, ...safe } = item;
    return { ...safe, role: role ? { roleCode: role.roleCode, name: role.name } : null, department: department ? { code: department.code, name: department.name } : null };
  }
  return item;
}

module.exports = { list, save };
