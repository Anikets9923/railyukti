"""
priority_score.py

WHAT THIS SCRIPT DOES:
It reads your railway data (assets, maintenance tasks, defects, trains)
and gives every maintenance task a "priority score" from 0 to 100 --
like a hospital triage system, but for broken train parts.

HOW TO RUN IT:
    python priority_score.py

That's it. No servers, no internet, no other teammates needed.
It just reads the JSON files in the data/ folder and prints results.
"""

import json  # this is a built-in Python tool for reading .json files -- no installation needed


# -----------------------------------------------------------------
# STEP 1: Load the data files
# -----------------------------------------------------------------
# json.load() reads a file and turns it into a Python list of dictionaries,
# which is just Python's way of representing the same JSON you already have.

def load_json(filepath):
    with open(filepath, "r") as f:
        return json.load(f)


assets = load_json("data/assets_sample.json")
maintenance_tasks = load_json("data/maintenance_sample.json")
defects = load_json("data/defects_sample.json")
trains = load_json("data/trains_sample.json")


# -----------------------------------------------------------------
# STEP 2: Turn lists into "lookup tables" (dictionaries) by asset_id
# -----------------------------------------------------------------
# Right now, assets/defects/trains are just lists. To quickly find
# "what do we know about AST-0057?" we build a dictionary where the
# key is the asset_id -- like an index in a phonebook.

assets_by_id = {a["asset_id"]: a for a in assets}

# An asset can have MORE THAN ONE defect, so this is a dictionary of LISTS.
defects_by_asset = {}
for d in defects:
    asset_id = d["asset_id"]
    if asset_id not in defects_by_asset:
        defects_by_asset[asset_id] = []
    defects_by_asset[asset_id].append(d)


# -----------------------------------------------------------------
# STEP 3: The scoring rules
# -----------------------------------------------------------------
# These dictionaries just convert words into numbers, so we can do math with them.
# Think of it like a school grading scale: A=90, B=80, etc.

CRITICALITY_POINTS = {"LOW": 33, "MEDIUM": 66, "HIGH": 100}
SEVERITY_POINTS = {"LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}
TRAIN_PRIORITY_WEIGHT = {"NORMAL": 1, "HIGH": 1.5, "PREMIUM": 2}


def get_urgency_points(days_overdue, failure_risk):
    """
    Urgency = a mix of how many days overdue it is, and how likely it is to fail.
    We cap "days overdue" at 20 days -- past that, it can't get any MORE urgent
    for scoring purposes (it's already maxed out).
    """
    overdue_part = min(days_overdue / 20, 1.0) * 100   # scaled to 0-100
    risk_part = failure_risk * 100                      # failure_risk is already 0-1, so x100 makes it 0-100
    return 0.5 * overdue_part + 0.5 * risk_part


def get_overdue_points(days_overdue):
    """How overdue is this task, on its own, scaled 0-100."""
    return min(days_overdue / 20, 1.0) * 100


def get_traffic_impact_points(asset_id):
    """
    If lots of important trains depend on this asset, delaying its repair
    is riskier. We look through every train, check if it needs this asset,
    and add up how "important" those trains are.
    """
    total_weight = 0
    for train in trains:
        if asset_id in train["assigned_asset_ids"]:
            total_weight += TRAIN_PRIORITY_WEIGHT.get(train["priority_class"], 1)
    return min(total_weight * 20, 100)   # scale it and cap at 100


def get_worst_defect_severity(asset_id):
    """
    An asset might have several defects. For scoring, we care about the
    WORST one (highest severity) -- a train isn't "half broken", the
    worst problem is the one that matters most.
    """
    asset_defects = defects_by_asset.get(asset_id, [])
    if not asset_defects:
        return "LOW"  # no defect on file -> assume low severity
    severities_in_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    worst = "LOW"
    for d in asset_defects:
        if severities_in_order.index(d["severity"]) > severities_in_order.index(worst):
            worst = d["severity"]
    return worst


def compute_priority_score(task):
    """
    This is the main formula. It combines 5 ingredients, each with a
    different "weight" (importance) -- exactly matching the percentages
    from the project README: 30% + 25% + 20% + 15% + 10% = 100%.
    """
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
    """Turns the number into a human-friendly label."""
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    else:
        return "LOW"


# -----------------------------------------------------------------
# STEP 4: Run the scoring on every task, and print a sorted report
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

# Sort so the most urgent task shows up first (highest score at the top).
results.sort(key=lambda r: r["priority_score"], reverse=True)

print(f"{'Maintenance ID':<16}{'Asset':<10}{'Score':<8}{'Tier'}")
print("-" * 45)
for r in results:
    print(f"{r['maintenance_id']:<16}{r['asset_id']:<10}{r['priority_score']:<8}{r['priority_tier']}")
