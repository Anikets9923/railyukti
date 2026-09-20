"""
ai_priority_service.py

WHAT THIS FILE DOES:
This is the REAL live service backend actually calls -- matching the
exact contract found in backend's own src/services/ai.service.js and
src/services/planningService.js.

Backend sends a batch of tasks with pre-computed fields (urgency,
trafficImpact, failure risk, spares, technicians already attached).
We score each one and return priorityScore + a tier label.

IMPORTANT: backend does its OWN block scheduling/optimization after
this (see buildAssignments() in planningService.js) -- this service's
only job is priority scoring, nothing else.

HOW TO RUN IT:
    uvicorn ai_priority_service:app --port 8000

Then set, in backend's .env:
    AI_SERVICE_URL="http://localhost:8000"
    MOCK_AI_MODE=false
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()


# -----------------------------------------------------------------
# Match backend's exact request shape
# -----------------------------------------------------------------

class Task(BaseModel):
    taskId: str
    assetCriticality: Optional[str] = "LOW"
    severity: Optional[str] = "LOW"
    urgency: Optional[float] = 0
    overdueDays: Optional[float] = 0
    trafficImpact: Optional[float] = 0
    failureRiskScore: Optional[float] = 0        # 0-100 scale
    failureProbability: Optional[float] = 0        # 0-1 scale
    impactScore: Optional[float] = 0
    daysToExpectedFailure: Optional[float] = 0
    spareAvailability: Optional[str] = None
    availableQuantity: Optional[int] = None
    requiredQuantity: Optional[int] = None
    technicianAvailability: Optional[str] = None
    availableTechnicians: Optional[int] = None
    requiredTechnicians: Optional[int] = None


class ScoreRequest(BaseModel):
    tasks: List[Task]


# -----------------------------------------------------------------
# Scoring formula -- same weights as the project README (30/25/20/15/10),
# but using the real fields backend actually provides.
# -----------------------------------------------------------------

CRITICALITY_POINTS = {"LOW": 33, "MEDIUM": 66, "HIGH": 100, "CRITICAL": 100}
SEVERITY_POINTS = {"LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}


def get_priority_label(score):
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    else:
        return "LOW"


@app.post("/")
def score_tasks(request: ScoreRequest):
    results = []

    for task in request.tasks:
        criticality_pts = CRITICALITY_POINTS.get(task.assetCriticality, 33)
        severity_pts = SEVERITY_POINTS.get(task.severity, 25)

        # Urgency: blend real failure_probability (0-1) with how overdue
        # it is (capped at 20 days), same logic as our earlier formula --
        # but now using the REAL failureProbability backend already gives us.
        overdue_part = min((task.overdueDays or 0) / 20, 1.0) * 100
        risk_part = (task.failureProbability or 0) * 100
        urgency_pts = 0.5 * overdue_part + 0.5 * risk_part

        overdue_pts = min((task.overdueDays or 0) / 20, 1.0) * 100

        # trafficImpact already comes pre-scaled 0-100 from backend.
        traffic_pts = task.trafficImpact or 0

        score = round(
            0.30 * criticality_pts +
            0.25 * severity_pts +
            0.20 * urgency_pts +
            0.15 * overdue_pts +
            0.10 * traffic_pts, 1
        )
        score = min(100, max(0, score))

        results.append({
            "taskId": task.taskId,
            "priorityScore": score,
            "priority": get_priority_label(score),
        })

    return {"results": results}


@app.get("/")
def health_check():
    return {"status": "AI priority service running, matching backend's real contract"}
