"""
block_optimizer.py

WHAT THIS FILE DOES:
Takes your already-scored maintenance tasks (from priority_score_from_api.py)
and a list of available block windows (time slots when a section can be
taken offline for repairs), and decides which tasks go into which blocks.

Think of it like packing boxes into containers: each task (box) has a
duration (size) and a priority score (value). Each block (container) has
a limited number of hours. We want to fit in the highest-value boxes
without overflowing any container.

HOW TO RUN IT:
    python block_optimizer.py

REQUIRES:
    pip install ortools
"""

import json
from ortools.sat.python import cp_model


# -----------------------------------------------------------------
# STEP 1: Load the data
# -----------------------------------------------------------------
# For now this reads local sample files. Once we've confirmed the
# real shape of /api/blocks, this will be updated to fetch from the
# backend the same way priority_score_from_api.py does.

def load(path):
    with open(path) as f:
        return json.load(f)


tasks = load("optimizer_fixtures/sample_scored_tasks.json")
blocks = load("optimizer_fixtures/sample_blocks.json")

# Only feasible tasks can even be considered -- remember, "feasible"
# means real spares AND real technicians are available. There's no
# point trying to schedule something that can't actually happen yet.
feasible_tasks = [t for t in tasks if t["feasible"]]
infeasible_tasks = [t for t in tasks if not t["feasible"]]

# Only APPROVED blocks can be used for scheduling.
usable_blocks = [b for b in blocks if b["approval_status"] == "APPROVED"]

print(f"{len(feasible_tasks)} of {len(tasks)} tasks are feasible and eligible for scheduling")
print(f"{len(usable_blocks)} of {len(blocks)} blocks are approved and usable")
print()


# -----------------------------------------------------------------
# STEP 2: Set up the puzzle for the solver
# -----------------------------------------------------------------
# We create one "yes/no" decision for every (task, block) pair:
# "should this task go into this block?" The solver will figure out
# the best combination of yes/no answers.

model = cp_model.CpModel()
decision = {}  # decision[(i, j)] = "task i assigned to block j?"

for i, task in enumerate(feasible_tasks):
    for j, block in enumerate(usable_blocks):
        # Only even consider this pairing if the section matches --
        # a Mumbai repair can't happen during a Pune block.
        if task["section"] == block["section"]:
            decision[(i, j)] = model.NewBoolVar(f"task{i}_block{j}")


# -----------------------------------------------------------------
# STEP 3: The rules (constraints) the solver must respect
# -----------------------------------------------------------------

# RULE 1: each task can be scheduled into AT MOST one block (not zero
# or one is fine -- it just can't be double-booked into two blocks).
for i, task in enumerate(feasible_tasks):
    possible_assignments = [decision[(i, j)] for j in range(len(usable_blocks)) if (i, j) in decision]
    if possible_assignments:
        model.Add(sum(possible_assignments) <= 1)

# RULE 2: a block can't be overfilled -- the total duration of every
# task assigned to it must fit within that block's available hours.
for j, block in enumerate(usable_blocks):
    tasks_in_this_block = []
    for i, task in enumerate(feasible_tasks):
        if (i, j) in decision:
            # This adds "duration_hours IF assigned, else 0" for each task
            tasks_in_this_block.append(int(task["duration_hours"] * 10) * decision[(i, j)])
    if tasks_in_this_block:
        model.Add(sum(tasks_in_this_block) <= int(block["duration_hours"] * 10))
        # (multiplying by 10 lets us handle decimal hours like 4.5,
        # since the solver works with whole numbers internally)


# -----------------------------------------------------------------
# STEP 4: The goal -- maximize total priority captured
# -----------------------------------------------------------------
# Among all the ways we could fill the blocks without breaking the
# rules above, find the one that captures the most total priority
# score. This naturally favors scheduling high-priority tasks first.

model.Maximize(
    sum(int(feasible_tasks[i]["priority_score"] * 10) * decision[(i, j)] for (i, j) in decision)
)


# -----------------------------------------------------------------
# STEP 5: Solve it and print the results
# -----------------------------------------------------------------

solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 10.0
status = solver.Solve(model)

if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    print("No valid schedule could be found at all.")
else:
    print("=== SCHEDULED ===")
    scheduled_task_ids = set()
    for j, block in enumerate(usable_blocks):
        assigned_here = []
        for i, task in enumerate(feasible_tasks):
            if (i, j) in decision and solver.Value(decision[(i, j)]) == 1:
                assigned_here.append(task)
                scheduled_task_ids.add(task["maintenance_id"])

        if assigned_here:
            used_hours = sum(t["duration_hours"] for t in assigned_here)
            utilization = round(100 * used_hours / block["duration_hours"], 1)
            print(f"\nBlock {block['block_id']} ({block['section']}, {block['duration_hours']}h capacity, {utilization}% utilized):")
            for t in assigned_here:
                print(f"   - {t['maintenance_id']}  ({t['duration_hours']}h, priority {t['priority_score']})")

    print("\n=== NOT SCHEDULED (feasible, but no room found) ===")
    for task in feasible_tasks:
        if task["maintenance_id"] not in scheduled_task_ids:
            print(f"   - {task['maintenance_id']}  (priority {task['priority_score']}, section {task['section']})")

    print("\n=== NOT ELIGIBLE (blocked by missing spares/technicians) ===")
    for task in infeasible_tasks:
        print(f"   - {task['maintenance_id']}  (priority {task['priority_score']})")
