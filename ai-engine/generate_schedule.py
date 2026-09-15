"""
generate_schedule.py

WHAT THIS FILE DOES:
This is the full pipeline, start to finish:
1. Fetch real maintenance tasks, assets, failure-risk, spares, and
   technician data from your locally-running backend.
2. Score every task (same formula as priority_score_from_api.py).
3. Fetch real block windows from the backend.
4. Run the OR-Tools optimizer to decide which tasks go into which
   blocks, respecting section matching, capacity, and feasibility.
5. Print the final schedule.

This combines priority_score_from_api.py and block_optimizer.py into
one real, end-to-end run against live local data.

HOW TO RUN IT:
    python generate_schedule.py

REQUIRES:
    pip install requests ortools
"""

import os
import requests
from ortools.sat.python import cp_model


# Reads from an environment variable if one is set, otherwise falls
# back to your own local backend. This means you never have to edit
# this file before pushing -- anyone running this can point it
# elsewhere just by setting BACKEND_URL before running the script,
# e.g.:
#     BACKEND_URL="https://their-tunnel-link.trycloudflare.com" python generate_schedule.py
BACKEND_BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:5050")


# -----------------------------------------------------------------
# STEP 1: Fetch every page of a paginated endpoint
# -----------------------------------------------------------------

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

print("Fetching block windows...")
raw_blocks = fetch_all_pages("/api/blocks")
print(f"  Got {len(raw_blocks)} blocks")

try:
    raw_trains = fetch_all_pages("/api/trains")
except Exception:
    raw_trains = []


# -----------------------------------------------------------------
# STEP 2: Build lookup tables
# -----------------------------------------------------------------

failure_risk_by_task = {fr["maintenanceTask"]["taskCode"]: fr for fr in raw_failure_risk}
spares_by_task = {sp["maintenanceTask"]["taskCode"]: sp for sp in raw_spares}
technicians_by_task = {t["maintenanceTask"]["taskCode"]: t for t in raw_technicians}
assets_by_id = {a["assetCode"]: a for a in raw_assets}

trains = []
for tr in raw_trains:
    trains.append({
        "priority_class": tr.get("priorityClass", "NORMAL"),
        "assigned_asset_ids": tr.get("assignedAssetIds", []),
    })


# -----------------------------------------------------------------
# STEP 3: Assemble each task with real data, including its section
# -----------------------------------------------------------------

tasks = []
for t in raw_tasks:
    task_code = t["taskCode"]
    asset_code = t["asset"]["assetCode"]

    fr = failure_risk_by_task.get(task_code)
    sp = spares_by_task.get(task_code)
    tech = technicians_by_task.get(task_code)

    failure_risk = fr["failureProbability"] if fr else 0.5
    spares_available = (sp["availabilityStatus"] != "NOT_AVAILABLE") if sp else True
    technician_available = (tech["availableTechnicians"] >= tech["requiredTechnicians"]) if tech else True

    tasks.append({
        "maintenance_id": task_code,
        "asset_id": asset_code,
        "section": t["section"]["code"],   # NEW: needed to match tasks to blocks
        "days_overdue": t["overdueDays"],
        "duration_hours": round(t["estimatedDuration"] / 60, 2),
        "severity": t["severity"],
        "failure_risk": failure_risk,
        "spares_available": spares_available,
        "technician_available": technician_available,
    })


# -----------------------------------------------------------------
# STEP 4: Assemble real blocks
# -----------------------------------------------------------------

blocks = []
for i, b in enumerate(raw_blocks):
    blocks.append({
        "block_id": f"BLK-{i+1:04d}",
        "section": b["section"]["code"],
        "duration_hours": round(b["maxDuration"] / 60, 2),
        "approval_status": "APPROVED" if b["status"] == "AVAILABLE" else b["status"],
    })


# -----------------------------------------------------------------
# STEP 5: The scoring formula -- unchanged
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


scored_tasks = []
for task in tasks:
    asset = assets_by_id.get(task["asset_id"])
    if asset is None:
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

    scored_tasks.append({
        "maintenance_id": task["maintenance_id"],
        "section": task["section"],
        "duration_hours": task["duration_hours"],
        "priority_score": score,
        "priority_tier": get_priority_tier(score),
        "feasible": task["spares_available"] and task["technician_available"],
    })

print(f"\nScored {len(scored_tasks)} tasks.")


# -----------------------------------------------------------------
# STEP 6: Run the optimizer on real scored tasks + real blocks
# -----------------------------------------------------------------

feasible_tasks = [t for t in scored_tasks if t["feasible"]]
usable_blocks = [b for b in blocks if b["approval_status"] == "APPROVED"]

print(f"{len(feasible_tasks)} of {len(scored_tasks)} tasks are feasible and eligible for scheduling")
print(f"{len(usable_blocks)} of {len(blocks)} blocks are approved and usable\n")

model = cp_model.CpModel()
decision = {}

for i, task in enumerate(feasible_tasks):
    for j, block in enumerate(usable_blocks):
        if task["section"] == block["section"]:
            decision[(i, j)] = model.NewBoolVar(f"task{i}_block{j}")

for i, task in enumerate(feasible_tasks):
    possible = [decision[(i, j)] for j in range(len(usable_blocks)) if (i, j) in decision]
    if possible:
        model.Add(sum(possible) <= 1)

for j, block in enumerate(usable_blocks):
    terms = []
    for i, task in enumerate(feasible_tasks):
        if (i, j) in decision:
            terms.append(int(task["duration_hours"] * 100) * decision[(i, j)])
    if terms:
        model.Add(sum(terms) <= int(block["duration_hours"] * 100))

model.Maximize(
    sum(int(feasible_tasks[i]["priority_score"] * 10) * decision[(i, j)] for (i, j) in decision)
)

solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 15.0
status = solver.Solve(model)

if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    print("No valid schedule could be found.")
else:
    scheduled_ids = set()
    print("=== SCHEDULED ===")
    for j, block in enumerate(usable_blocks):
        assigned = [feasible_tasks[i] for i in range(len(feasible_tasks)) if (i, j) in decision and solver.Value(decision[(i, j)]) == 1]
        if assigned:
            used = sum(t["duration_hours"] for t in assigned)
            util = round(100 * used / block["duration_hours"], 1) if block["duration_hours"] else 0
            print(f"\nBlock {block['block_id']} ({block['section']}, {block['duration_hours']}h, {util}% utilized):")
            for t in assigned:
                print(f"   - {t['maintenance_id']} ({t['duration_hours']}h, priority {t['priority_score']}, {t['priority_tier']})")
                scheduled_ids.add(t["maintenance_id"])

    unscheduled = [t for t in feasible_tasks if t["maintenance_id"] not in scheduled_ids]
    print(f"\n=== FEASIBLE BUT NOT SCHEDULED ({len(unscheduled)}) ===")
    for t in sorted(unscheduled, key=lambda x: -x["priority_score"])[:10]:
        print(f"   - {t['maintenance_id']} (priority {t['priority_score']}, section {t['section']})")

    infeasible = [t for t in scored_tasks if not t["feasible"]]
    print(f"\n=== NOT ELIGIBLE - missing spares/technicians ({len(infeasible)}) ===")
    for t in sorted(infeasible, key=lambda x: -x["priority_score"])[:10]:
        print(f"   - {t['maintenance_id']} (priority {t['priority_score']})")
