"""
app.py

WHAT THIS FILE DOES:
This takes the exact same scoring logic from priority_score.py, but instead
of running once and printing a table, it stays running in the background
and answers questions whenever someone sends it data.

HOW TO RUN IT:
    uvicorn app:app --reload --port 8000

Then it will be "listening" at: http://localhost:8000

You leave this running in a terminal (like a server that never stops),
and in a DIFFERENT terminal (or from your browser, or from Postman, or
eventually from the backend team's code) you send it questions.

HOW TO TEST IT WHILE IT'S RUNNING:
Open this in your browser: http://localhost:8000/docs
FastAPI automatically builds you a testing page — no extra tools needed.
"""

from fastapi import FastAPI  # the tool that lets our code "listen" for requests
from pydantic import BaseModel  # helps us describe exactly what shape of data we expect
from typing import List, Optional

app = FastAPI()  # this line creates our "service" -- think of it as switching the machine on


# -----------------------------------------------------------------
# STEP 1: Describe the exact shape of data we expect to receive
# -----------------------------------------------------------------
# This is like writing a form with labeled fields -- it tells FastAPI
# (and anyone sending us data) exactly what's required and what type
# each field should be. If someone sends the wrong shape, FastAPI will
# automatically reject it with a clear error, instead of your code crashing.

class Task(BaseModel):
    maintenance_id: str
    asset_id: str
    days_overdue: int
    failure_risk: float
    spares_available: bool
    technician_available: bool
    duration_hours: int


class Asset(BaseModel):
    asset_id: str
    criticality: str          # "LOW" / "MEDIUM" / "HIGH"
    condition_score: float
    city: Optional[str] = None


class Defect(BaseModel):
    asset_id: str
    severity: str              # "LOW" / "MEDIUM" / "HIGH" / "CRITICAL"
    safety_related: Optional[bool] = None


class Train(BaseModel):
    train_id: str
    priority_class: str        # "NORMAL" / "HIGH" / "PREMIUM"
    assigned_asset_ids: List[str]


class ScoreRequest(BaseModel):
    tasks: List[Task]
    assets: List[Asset]
    defects: List[Defect]
    trains: List[Train]


# -----------------------------------------------------------------
# STEP 2: The exact same scoring logic from priority_score.py
# -----------------------------------------------------------------
# Nothing new here -- this is copy-pasted from your working script.

CRITICALITY_POINTS = {"LOW": 33, "MEDIUM": 66, "HIGH": 100}
SEVERITY_POINTS = {"LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}
TRAIN_PRIORITY_WEIGHT = {"NORMAL": 1, "HIGH": 1.5, "PREMIUM": 2}


def get_urgency_points(days_overdue, failure_risk):
    overdue_part = min(days_overdue / 20, 1.0) * 100
    risk_part = failure_risk * 100
    return 0.5 * overdue_part + 0.5 * risk_part


def get_overdue_points(days_overdue):
    return min(days_overdue / 20, 1.0) * 100


def get_traffic_impact_points(asset_id, trains):
    total_weight = 0
    for train in trains:
        if asset_id in train.assigned_asset_ids:
            total_weight += TRAIN_PRIORITY_WEIGHT.get(train.priority_class, 1)
    return min(total_weight * 20, 100)


def get_worst_defect_severity(asset_id, defects_by_asset):
    asset_defects = defects_by_asset.get(asset_id, [])
    if not asset_defects:
        return "LOW"
    severities_in_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    worst = "LOW"
    for d in asset_defects:
        if severities_in_order.index(d.severity) > severities_in_order.index(worst):
            worst = d.severity
    return worst


def get_priority_tier(score):
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    else:
        return "LOW"


# -----------------------------------------------------------------
# STEP 3: The actual "listening" part
# -----------------------------------------------------------------
# This is the new part. @app.post("/score") means:
# "whenever someone sends a POST request to http://localhost:8000/score,
#  run the function right below this line, using their data as `request`."

@app.post("/score")
def score_tasks(request: ScoreRequest):
    # Build lookup tables, same idea as in priority_score.py
    assets_by_id = {a.asset_id: a for a in request.assets}

    defects_by_asset = {}
    for d in request.defects:
        if d.asset_id not in defects_by_asset:
            defects_by_asset[d.asset_id] = []
        defects_by_asset[d.asset_id].append(d)

    results = []
    for task in request.tasks:
        asset = assets_by_id.get(task.asset_id)
        if asset is None:
            # If backend sends a task for an asset we don't know about,
            # skip it instead of crashing the whole request.
            continue

        criticality_pts = CRITICALITY_POINTS.get(asset.criticality, 33)
        worst_severity = get_worst_defect_severity(task.asset_id, defects_by_asset)
        severity_pts = SEVERITY_POINTS.get(worst_severity, 25)
        urgency_pts = get_urgency_points(task.days_overdue, task.failure_risk)
        overdue_pts = get_overdue_points(task.days_overdue)
        traffic_pts = get_traffic_impact_points(task.asset_id, request.trains)

        score = (
            0.30 * criticality_pts +
            0.25 * severity_pts +
            0.20 * urgency_pts +
            0.15 * overdue_pts +
            0.10 * traffic_pts
        )
        score = round(score, 1)

        results.append({
            "maintenance_id": task.maintenance_id,
            "priority_score": score,
            "priority_tier": get_priority_tier(score),
        })

    return results


# -----------------------------------------------------------------
# A simple "is this thing even alive" check -- handy for testing
# -----------------------------------------------------------------
@app.get("/")
def health_check():
    return {"status": "AI priority service is running"}
