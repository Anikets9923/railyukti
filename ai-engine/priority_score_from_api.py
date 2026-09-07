"""
priority_score_from_api.py

WHAT CHANGED FROM THE ORIGINAL priority_score.py:
Before: this script opened local .json files on your computer.
Now: this script sends a request over the network to the backend's
     server, and asks it for the data instead.

WHY: the backend team wants your service to pull data from their
     already-built API, rather than them having to package and send
     you a custom JSON payload every time.

HOW TO RUN IT:
    python priority_score_from_api.py

IMPORTANT: the backend server must actually be running first, at
whatever address BACKEND_BASE_URL below points to -- otherwise this
script has nothing to ask and will show a connection error.
"""

import requests  # a tool for sending "questions" (HTTP requests) to another running program


# -----------------------------------------------------------------
# CONFIGURATION -- change this one line depending on what you're testing against
# -----------------------------------------------------------------
# For testing against our pretend backend (mock_backend.py), leave as-is.
# Once the REAL backend gives you their actual running address, change
# only this line -- nothing else in the file needs to change.

BACKEND_BASE_URL = "http://localhost:5000"


# -----------------------------------------------------------------
# STEP 1: Fetch data from the backend's endpoints instead of local files
# -----------------------------------------------------------------
# requests.get(url) sends a "GET" request -- think of GET as simply
# asking a question ("what assets do you have?") without changing
# anything on the other end. .json() converts their answer into a
# Python list of dictionaries, same shape as before.

def fetch(endpoint_path):
    url = BACKEND_BASE_URL + endpoint_path
    response = requests.get(url)
    response.raise_for_status()  # if something went wrong (e.g. 404, 500), stop here with a clear error
    return response.json()


assets = fetch("/api/assets")
maintenance_tasks = fetch("/api/maintenance")
defects = fetch("/api/defects")   # NOTE: confirm with backend this endpoint actually exists on their real server
trains = fetch("/api/trains")


# -----------------------------------------------------------------
# STEP 2: Everything below this line is EXACTLY THE SAME as before
# -----------------------------------------------------------------
# This is the whole point of separating "how we get the data" from
# "what we do with the data" -- only the fetching changed, the scoring
# logic didn't need to change at all.

assets_by_id = {a["asset_id"]: a for a in assets}

defects_by_asset = {}
for d in defects:
    asset_id = d["asset_id"]
    if asset_id not in defects_by_asset:
        defects_by_asset[asset_id] = []
    defects_by_asset[asset_id].append(d)

CRITICALITY_POINTS = {"LOW": 33, "MEDIUM": 66, "HIGH": 100}
SEVERITY_POINTS = {"LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}
TRAIN_PRIORITY_WEIGHT = {"NORMAL": 1, "HIGH": 1.5, "PREMIUM": 2}


def get_urgency_points(days_overdue, failure_risk):
    overdue_part = min(days_overdue / 20, 1.0) * 100
    risk_part = failure_risk * 100
    return 0.5 * overdue_part + 0.5 * risk_part


def get_overdue_points(days_overdue):
    return min(days_overdue / 20, 1.0) * 100


def get_traffic_impact_points(asset_id):
    total_weight = 0
    for train in trains:
        if asset_id in train["assigned_asset_ids"]:
            total_weight += TRAIN_PRIORITY_WEIGHT.get(train["priority_class"], 1)
    return min(total_weight * 20, 100)


def get_worst_defect_severity(asset_id):
    asset_defects = defects_by_asset.get(asset_id, [])
    if not asset_defects:
        return "LOW"
    severities_in_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    worst = "LOW"
    for d in asset_defects:
        if severities_in_order.index(d["severity"]) > severities_in_order.index(worst):
            worst = d["severity"]
    return worst


def compute_priority_score(task):
    asset = assets_by_id[task["asset_id"]]
    criticality_pts = CRITICALITY_POINTS.get(asset["criticality"], 33)
    worst_severity = get_worst_defect_severity(task["asset_id"])
    severity_pts = SEVERITY_POINTS.get(worst_severity, 25)
    urgency_pts = get_urgency_points(task["days_overdue"], task["failure_risk"])
    overdue_pts = get_overdue_points(task["days_overdue"])
    traffic_pts = get_traffic_impact_points(task["asset_id"])

    score = (
        0.30 * criticality_pts +
        0.25 * severity_pts +
        0.20 * urgency_pts +
        0.15 * overdue_pts +
        0.10 * traffic_pts
    )
    return round(score, 1)


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
# STEP 3: Run it and print results -- identical to before
# -----------------------------------------------------------------

results = []
for task in maintenance_tasks:
    score = compute_priority_score(task)
    tier = get_priority_tier(score)
    results.append({
        "maintenance_id": task["maintenance_id"],
        "asset_id": task["asset_id"],
        "priority_score": score,
        "priority_tier": tier,
    })

results.sort(key=lambda r: r["priority_score"], reverse=True)

print(f"{'Maintenance ID':<16}{'Asset':<10}{'Score':<8}{'Tier'}")
print("-" * 45)
for r in results:
    print(f"{r['maintenance_id']:<16}{r['asset_id']:<10}{r['priority_score']:<8}{r['priority_tier']}")
