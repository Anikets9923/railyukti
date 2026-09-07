require("dotenv/config");

const AppError = require("../utils/appError");

const DEFAULT_TIMEOUT_MS = 5000;
const SCORE_WEIGHTS = {
  criticality: 30,
  severity: 25,
  urgency: 20,
  overdueDays: 15,
  trafficImpact: 10,
};

const RANKS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

async function prioritizeTasks(tasks) {
  validateTaskList(tasks);

  if (isMockMode()) {
    return { results: tasks.map(buildMockResult) };
  }

  return requestExternalPriorities(tasks);
}

function isMockMode() {
  return String(process.env.MOCK_AI_MODE).toLowerCase() === "true";
}

function buildMockResult(task) {
  const priorityScore = calculateMockPriorityScore(task);

  return {
    taskId: task.taskId,
    priorityScore,
    priority: getPriorityLabel(priorityScore),
  };
}

function calculateMockPriorityScore(task) {
  const criticality = getRank(task.assetCriticality || task.criticality);
  const severity = getRank(task.severity);
  const urgency = normalizeScore(task.urgency, 0);
  const overdueDays = normalizeScore(task.overdueDays, 0, 30);
  const trafficImpact = normalizeScore(task.trafficImpact, 0);
  const failureRiskScore = normalizeScore(task.failureRiskScore, 0);

  const weightedScore =
    criticality * (SCORE_WEIGHTS.criticality / 4) +
    severity * (SCORE_WEIGHTS.severity / 4) +
    urgency * (SCORE_WEIGHTS.urgency / 100) +
    overdueDays * (SCORE_WEIGHTS.overdueDays / 30) +
    trafficImpact * (SCORE_WEIGHTS.trafficImpact / 100) +
    failureRiskScore * 0.1;

  return Math.round(Math.min(100, Math.max(0, weightedScore)));
}

function getPriorityLabel(score) {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function getRank(value) {
  const normalizedValue = String(value || "LOW").toUpperCase();
  return RANKS[normalizedValue] || RANKS.LOW;
}

function normalizeScore(value, fallback, maximum = 100) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(maximum, Math.max(0, numericValue));
}

async function requestExternalPriorities(tasks) {
  const serviceUrl = process.env.AI_SERVICE_URL;
  if (!serviceUrl) {
    throw new AppError("AI_SERVICE_URL is required when MOCK_AI_MODE is false", 503);
  }

  const controller = new AbortController();
  const timeoutMs = getTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(serviceUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tasks }),
      signal: controller.signal,
    });

    const payload = await parseResponse(response);
    validateResponse(payload);
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError("AI service request timed out", 504);
    }
    if (error instanceof AppError) throw error;
    throw new AppError(`AI service request failed: ${error.message}`, 502);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new AppError("AI service returned invalid JSON", 502);
  }

  if (!response.ok) {
    throw new AppError(`AI service returned HTTP ${response.status}`, 502, payload);
  }

  return payload;
}

function validateTaskList(tasks) {
  if (!Array.isArray(tasks)) {
    throw new AppError("AI prioritization input must be an array of tasks", 400);
  }

  for (const task of tasks) {
    if (!task || typeof task !== "object" || task.taskId === undefined) {
      throw new AppError("Each AI task must be an object with a taskId", 400);
    }
  }
}

function validateResponse(payload) {
  if (!payload || !Array.isArray(payload.results)) {
    throw new AppError("AI service returned an invalid response format", 502);
  }
}

function getTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_SERVICE_TIMEOUT_MS);
  return Number.isInteger(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_TIMEOUT_MS;
}

module.exports = {
  prioritizeTasks,
};
