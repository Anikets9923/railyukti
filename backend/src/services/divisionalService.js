const prisma = require("../database/prisma");
const AppError = require("../utils/appError");

async function listApprovals(query) {
  const where = {};
  if (query.status) where.status = String(query.status).trim().toUpperCase();
  const approvals = await prisma.approvalRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { code: true, name: true } },
      blockPlan: { include: { section: { select: { code: true, name: true } }, scheduledTasks: true } },
      blockRequest: { include: { section: { select: { code: true, name: true } } } },
    },
  });
  return { items: approvals };
}

async function decidePlan(id, input) {
  const plan = await prisma.blockPlan.findUnique({ where: { id } });
  if (!plan) throw new AppError("Block plan not found", 404);
  const status = String(input.action || input.decision || "").toUpperCase();
  const approved = ["APPROVE", "APPROVED"].includes(status);
  const rejected = ["REJECT", "REJECTED"].includes(status);
  if (!approved && !rejected) throw new AppError("action must be APPROVE or REJECT", 400);

  const approval = await prisma.approvalRequest.upsert({
    where: { approvalCode: `PLAN-APR-${plan.id}` },
    create: {
      approvalCode: `PLAN-APR-${plan.id}`,
      blockPlanId: plan.id,
      requestedByRole: input.requestedByRole || "DIVISIONAL_OFFICER",
      requestedAction: "BLOCK_PLAN",
      status: approved ? "APPROVED" : "REJECTED",
      decisionNote: input.decisionNote || input.note || null,
      decidedAt: new Date(),
      sourceSystem: "SYNTHETIC_DIVISIONAL_DECISION",
    },
    update: {
      status: approved ? "APPROVED" : "REJECTED",
      decisionNote: input.decisionNote || input.note || null,
      decidedAt: new Date(),
    },
  });
  const updatedPlan = await prisma.blockPlan.update({
    where: { id: plan.id },
    data: { status: approved ? "APPROVED" : "CANCELLED" },
  });
  return { plan: updatedPlan, approval };
}

module.exports = { decidePlan, listApprovals };
