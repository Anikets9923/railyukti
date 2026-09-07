"""
priority_score_from_api_v2.py

WHAT CHANGED FROM priority_score_from_api.py:
Now that we've seen the REAL backend responses, several things needed
fixing that we couldn't have known before:

1. Responses are wrapped: {"success": true, "data": {"items": [...],
   "pagination": {...}}} -- not a plain list like our test data was.
2. Responses are PAGINATED -- one request only gives you a slice
   (e.g. 20 of 102 tasks). We now loop through every page automatically.
3. Field names are different from what we assumed (see the mapping
   table below).
4. Three fields our formula needs (failure_risk, spares_available,
   technician_available) DON'T EXIST in the real data yet. We use
   clearly-marked placeholder values for these until backend confirms
   where this data actually lives -- search "PLACEHOLDER" in this file.

HOW TO RUN IT:
    python priority_score_from_api_v2.py
"""

import requests


# -----------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------
BACKEND_BASE_URL = "https://charger-went-vpn-permalink.trycloudflare.com"

# ⚠️ This tunnel URL changes every time backend restarts their tunnel.
# If this stops working with a connection error, ask them for the new one.


# -----------------------------------------------------------------
# STEP 1: Fetch ALL pages of a paginated endpoint, not just the first
# -----------------------------------------------------------------
# The real API only gives you a "page" at a time (like 20 results per
# page). This function keeps asking for "the next page" until there
# are no more pages left, and combines everything into one big list.

def fetch_all_pages(endpoint_path):
    all_items = []
    page = 1
    while True:
        url = f"{BACKEND_BASE_URL}{endpoint_path}?page={page}&limit=100"
        response = requests.get(url)
        response.raise_for_status()
        body = response.json()

        # The real data isn't at the top level -- it's nested inside
        # body["data"]["items"], so we reach in and grab it.
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

# NOTE: trains endpoint not tested against real data yet -- field names
# below (assignedAssetIds, priorityClass) are a best guess based on the
# pattern from assets/maintenance. Confirm with backend once tested.
try:
    print("Fetching trains...")
    raw_trains = fetch_all_pages("/api/trains")
    print(f"  Got {len(raw_trains)} trains")
except Exception as e:
    print(f"  Could not fetch trains ({e}) -- traffic impact will be scored as 0 for everything")
    raw_trains = []


# -----------------------------------------------------------------
# STEP 2: Translate the real field names into the names our formula uses
# -----------------------------------------------------------------
# This is the important part -- rather than rewriting the whole scoring
# formula, we just translate the incoming data into the same shape we
# had before. This keeps the scoring logic itself unchanged and trusted.

FIELD_MAPPING_NOTES = """
    maintenance_id      <- taskCode              (renamed)
    asset_id            <- asset.assetCode        (was nested)
    days_overdue        <- overdueDays             (renamed)
    duration_hours      <- estimatedDuration / 60  (was in minutes)
    severity            <- severity                (already on the task directly -- no defects endpoint needed!)
    criticality         <- asset.criticality       (already on the task, nested)

    ESTIMATED (backend confirmed these fields don't exist in their database --
    we're not waiting on a schema change, so we approximate instead):

    failure_risk        <- derived from severity + days_overdue (see estimate_failure_risk())
                            NOT a real prediction -- a reasonable stand-in so tasks
                            aren't all scored identically. Swap for real data if/when
                            backend adds it.
    spares_available     <- True (assumed -- no data available to check this)
    technician_available <- True (assumed -- no data available to check this)
"""

SEVERITY_TO_RISK = {"LOW": 0.2, "MEDIUM": 0.45, "HIGH": 0.7, "CRITICAL": 0.9}


def estimate_failure_risk(severity, days_overdue):
    """
    We don't have a real failure_risk from backend, so we build a rough
    stand-in from two things we DO have: how bad the defect is, and how
    overdue it's gotten. This isn't a real prediction model -- it's a
    reasonable approximation so scoring isn't flat across every task.
    """
    severity_component = SEVERITY_TO_RISK.get(severity, 0.4)
    overdue_component = min(days_overdue / 20, 1.0)
    return round(0.6 * severity_component + 0.4 * overdue_component, 3)


tasks = []
for t in raw_tasks:
    severity = t["severity"]
    days_overdue = t["overdueDays"]
    tasks.append({
        "maintenance_id": t["taskCode"],
        "asset_id": t["asset"]["assetCode"],
        "days_overdue": days_overdue,
        "duration_hours": round(t["estimatedDuration"] / 60, 1),
        "severity": severity,
        "failure_risk": estimate_failure_risk(severity, days_overdue),  # ESTIMATED, see note above
        "spares_available": True,        # ASSUMED -- no data available
        "technician_available": True,    # ASSUMED -- no data available
    })

assets_by_id = {}
for a in raw_assets:
    assets_by_id[a["assetCode"]] = {
        "asset_id": a["assetCode"],
        "criticality": a["criticality"],
    }

trains = []
for tr in raw_trains:
    trains.append({
        "priority_class": tr.get("priorityClass", "NORMAL"),
        "assigned_asset_ids": tr.get("assignedAssetIds", []),
    })


# -----------------------------------------------------------------
# STEP 3: The scoring formula -- UNCHANGED from before
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
# STEP 4: Run it and print results
# -----------------------------------------------------------------

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

    results.append({
        "maintenance_id": task["maintenance_id"],
        "asset_id": task["asset_id"],
        "priority_score": score,
        "priority_tier": get_priority_tier(score),
    })

results.sort(key=lambda r: r["priority_score"], reverse=True)

print()
print("⚠️  NOTE: failure_risk is ESTIMATED from severity+overdue (backend doesn't store this field).")
print("   spares_available/technician_available are ASSUMED true (no data source for these yet).")
print("   Scores below are a reasonable approximation, not final ground truth.")
print()
print(f"{'Maintenance ID':<20}{'Asset':<12}{'Score':<8}{'Tier'}")
print("-" * 55)
for r in results[:15]:  # just show top 15 so it's readable
    print(f"{r['maintenance_id']:<20}{r['asset_id']:<12}{r['priority_score']:<8}{r['priority_tier']}")

if skipped:
    print(f"\n({skipped} tasks skipped -- asset not found in assets list)")