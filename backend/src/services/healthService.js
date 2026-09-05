const prisma = require("../database/prisma");

async function checkHealth() {
  await prisma.$queryRaw`SELECT 1`;
}

module.exports = { checkHealth };