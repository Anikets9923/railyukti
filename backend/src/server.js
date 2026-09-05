require("dotenv/config");

const app = require("./app");
const prisma = require("./database/prisma");

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down server.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));