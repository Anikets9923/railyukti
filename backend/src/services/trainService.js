const prisma = require("../database/prisma");
const AppError = require("../utils/appError");
const {
  buildPagination,
  parseDateOnly,
  parseEnum,
  parseOptionalString,
  parsePagination,
} = require("../validators/queryValidators");
const { TrainScheduleStatus } = require("@prisma/client");

async function listTrains(query) {
  const { page, limit, skip } = parsePagination(query);
  const total = await prisma.train.count();
  const items = await prisma.train.findMany({
    skip,
    take: limit,
    orderBy: { trainNumber: "asc" },
    include: { _count: { select: { schedules: true } } },
  });
  return { items, pagination: buildPagination(total, page, limit) };
}

async function getTrainById(id) {
  const train = await prisma.train.findUnique({
    where: { id },
    include: {
      schedules: {
        orderBy: [{ date: "asc" }, { arrivalTime: "asc" }],
        include: { section: { select: { code: true, name: true } } },
      },
    },
  });
  if (!train) throw new AppError("Train not found", 404);
  return train;
}

async function listSchedules(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  const section = parseOptionalString(query.section, "section");
  const status = parseEnum(query.status, TrainScheduleStatus, "status");
  if (section) where.section = { code: section };
  if (status) where.status = status;
  if (query.date !== undefined) where.date = parseDateOnly(query.date, "date");

  const total = await prisma.trainSchedule.count({ where });
  const items = await prisma.trainSchedule.findMany({
    where,
    skip,
    take: limit,
    orderBy: [{ date: "asc" }, { arrivalTime: "asc" }],
    include: {
      train: { select: { trainNumber: true, name: true, trainType: true } },
      section: { select: { code: true, name: true } },
    },
  });
  return { items, pagination: buildPagination(total, page, limit) };
}

module.exports = { getTrainById, listSchedules, listTrains };