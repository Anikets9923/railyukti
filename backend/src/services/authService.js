const crypto = require("node:crypto");
const prisma = require("../database/prisma");
const AppError = require("../utils/appError");

const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

async function login({ userCode, email }) {
  if (!userCode && !email) throw new AppError("userCode or email is required", 400);
  const user = await prisma.adminUser.findFirst({
    where: { OR: [{ userCode: userCode || undefined }, { email: email || undefined }], status: "ACTIVE" },
    include: { role: true, department: true },
  });
  if (!user) throw new AppError("Demo user not found or inactive", 401);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
  return { token, tokenType: "Bearer", expiresIn: SESSION_TTL_MS / 1000, user: safeUser(user) };
}

async function getSessionUser(token) {
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  const user = await prisma.adminUser.findUnique({ where: { id: session.userId }, include: { role: true, department: true } });
  return user ? safeUser(user) : null;
}

function safeUser(user) {
  return {
    id: user.id,
    userCode: user.userCode,
    displayName: user.displayName,
    email: user.email,
    role: user.role?.roleCode,
    department: user.department?.code || null,
    isDemo: user.isDemo,
  };
}

module.exports = { getSessionUser, login };
