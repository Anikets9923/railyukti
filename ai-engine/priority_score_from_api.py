"""
priority_score_from_api.py  (final version)

WHAT THIS FILE DOES:
Fetches real data from the backend's live API and computes a priority
score (0-100) + tier for every maintenance task, using REAL failure
risk, spare availability, and technician availability -- no more
estimates or assumptions.

WHAT CHANGED FROM THE PREVIOUS VERSION:
Backend built three new dedicated endpoints:
    /api/failure-risk
    /api/spares
    /api/technicians/availability
Previously we had to estimate/assume these three values because they
didn't exist anywhere. Now we fetch the real thing.

HOW TO RUN IT:
    python priority_score_from_api.py
"""

import os
import requests

BACKEND_BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:5050")
# ⚠️ This tunnel link expires whenever backend restarts their server --
# ask for a fresh one if you get a connection error when running this.


# -----------------------------------------------------------------
# STEP 1: Fetch every page of a paginated endpoint
# -----------------------------------------------------------------
# The real API only gives ~20-100 results per request. This function
# keeps asking for "the next page" until there are none left.

def fetch_all_pages(endpoint_path):
    all_items = []
    page = 1
    while True:
        url = f"{BACKEND_BASE_URL}{endpoint_path}?page={page}&limit=100"
        response = requests.get(url)
        response.raise_for_status()
        body = response.json()
        items = body["data"]["items"]
        all_items.extend(items)
        total_pages = body["data"]["pagination"]["totalPages"]
        if page >= total_pages:
            break
        page += 1
    return all_items


print("Fetching maintenance tasks...")
raw_tasks = fetch_all_pages("/api/maintenance")
print(f"  Got {len(raw_tasks)} tasks")

print("Fetching assets...")
raw_assets = fetch_all_pages("/api/assets")
print(f"  Got {len(raw_assets)} assets")

print("Fetching failure risk records...")
raw_failure_risk = fetch_all_pages("/api/failure-risk")
print(f"  Got {len(raw_failure_risk)} failure risk records")

print("Fetching spare availability records...")
raw_spares = fetch_all_pages("/api/spares")
print(f"  Got {len(raw_spares)} spare records")

print("Fetching technician availability records...")
raw_technicians = fetch_all_pages("/api/technicians/availability")
print(f"  Got {len(raw_technicians)} technician records")

# Trains endpoint hasn't been tested against real data yet -- if it
# fails, we don't want that to crash the whole script, since traffic
# impact is only 10% of the score.
try:
    raw_trains = fetch_all_pages("/api/trains")
except Exception as e:
    print(f"  Could not fetch trains ({e}) -- traffic impact will be 0 for everything")
    raw_trains = []


# -----------------------------------------------------------------
# STEP 2: Build lookup tables, all keyed by taskCode
# -----------------------------------------------------------------
# failure-risk, spares, and technicians all link back to a task via
# a nested maintenanceTask.taskCode field -- that's our shared key.

failure_risk_by_task = {}
for fr in raw_failure_risk:
    task_code = fr["maintenanceTask"]["taskCode"]
    failure_risk_by_task[task_code] = fr

spares_by_task = {}
for sp in raw_spares:
    task_code = sp["maintenanceTask"]["taskCode"]
    spares_by_task[task_code] = sp

technicians_by_task = {}
for tech in raw_technicians:
    task_code = tech["maintenanceTask"]["taskCode"]
    technicians_by_task[task_code] = tech

assets_by_id = {a["assetCode"]: a for a in raw_assets}

trains = []
for tr in raw_trains:
    trains.append({
        "priority_class": tr.get("priorityClass", "NORMAL"),
        "assigned_asset_ids": tr.get("assignedAssetIds", []),
    })


# -----------------------------------------------------------------
# STEP 3: Assemble each task using REAL data
# -----------------------------------------------------------------

tasks = []
for t in raw_tasks:
    task_code = t["taskCode"]
    asset_code = t["asset"]["assetCode"]

    fr = failure_risk_by_task.get(task_code)
    sp = spares_by_task.get(task_code)
    tech = technicians_by_task.get(task_code)

    # Real failure_risk when we have a record for this task. Some tasks
    # might not have one yet, so we fall back to a neutral 0.5 only in
    # that specific case (not for everything, like before).
    failure_risk = fr["failureProbability"] if fr else 0.5

    # Per backend's rule: NOT_AVAILABLE = not feasible, anything else
    # (AVAILABLE or PARTIAL) counts as available for now.
    spares_available = (sp["availabilityStatus"] != "NOT_AVAILABLE") if sp else True

    # Per backend's rule: feasible only if we have enough technicians.
    technician_available = (tech["availableTechnicians"] >= tech["requiredTechnicians"]) if tech else True

    tasks.append({
        "maintenance_id": task_code,
        "asset_id": asset_code,
        "days_overdue": t["overdueDays"],
        "duration_hours": round(t["estimatedDuration"] / 60, 1),
        "severity": t["severity"],
        "failure_risk": failure_risk,
        "spares_available": spares_available,
        "technician_available": technician_available,
        "risk_factors": fr["riskFactors"] if fr else [],  # saved for later "why selected" explanations
    })


# -----------------------------------------------------------------
# STEP 4: The scoring formula -- unchanged from every earlier version
# -----------------------------------------------------------------

CRITICALITY_POINTS = {"LOW": 33, "MEDIUM": 66, "HIGH": 100, "CRITICAL": 100}
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
# STEP 5: Run it, including a new "feasible" flag
# -----------------------------------------------------------------
# feasible = can this task even be scheduled right now, separate from
# how urgent it is. A task can be CRITICAL priority but NOT feasible
# (e.g. no spare parts) -- the optimizer will need this later to avoid
# scheduling something that can't actually happen yet.

results = []
skipped = 0
for task in tasks:
    asset = assets_by_id.get(task["asset_id"])
    if asset is None:
        skipped += 1
        continue

    criticality_pts = CRITICALITY_POINTS.get(asset["criticality"], 33)
    severity_pts = SEVERITY_POINTS.get(task["severity"], 25)
    urgency_pts = get_urgency_points(task["days_overdue"], task["failure_risk"])
    overdue_pts = get_overdue_points(task["days_overdue"])
    traffic_pts = get_traffic_impact_points(task["asset_id"])

    score = round(
        0.30 * criticality_pts +
        0.25 * severity_pts +
        0.20 * urgency_pts +
        0.15 * overdue_pts +
        0.10 * traffic_pts, 1
    )

    feasible = task["spares_available"] and task["technician_available"]

    results.append({
        "maintenance_id": task["maintenance_id"],
        "asset_id": task["asset_id"],
        "priority_score": score,
        "priority_tier": get_priority_tier(score),
        "feasible": feasible,
    })

results.sort(key=lambda r: r["priority_score"], reverse=True)

print()
print(f"{'Maintenance ID':<18}{'Asset':<10}{'Score':<8}{'Tier':<10}{'Feasible?'}")
print("-" * 60)
for r in results[:15]:
    print(f"{r['maintenance_id']:<18}{r['asset_id']:<10}{r['priority_score']:<8}{r['priority_tier']:<10}{r['feasible']}")

if skipped:
    print(f"\n({skipped} tasks skipped -- asset not found in assets list)")
