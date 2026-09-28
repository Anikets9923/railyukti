# 🤖 Railyukti — AI Priority & Optimization Engine

> AI-assisted maintenance prioritization and optimization for the Railyukti railway block planning platform.

**Smart India Hackathon 2026 — SIH26027**

This branch contains the **AI intelligence layer** of Railyukti.

Its primary responsibility is to analyze railway maintenance tasks, calculate their priority, classify their urgency, and provide AI-generated inputs to the overall maintenance block planning pipeline.

The AI layer works together with the backend and optimization components to answer two important questions:

```text
AI Priority Engine
"What should be done first?"

        +

Optimization Engine
"When and how should it be scheduled?"
```

---

# 🎯 Purpose

Railway maintenance teams may have many tasks competing for limited maintenance windows.

Not every task has the same:

* Asset criticality
* Defect severity
* Urgency
* Failure risk
* Train-operation impact

The AI engine converts these factors into a standardized **priority score from 0–100** and assigns a priority tier.

This allows the downstream planning system to focus on maintenance activities that require greater attention.

---

# 🧠 AI Priority Engine

The current AI service evaluates maintenance tasks using factors including:

* Asset criticality
* Defect severity
* Overdue duration
* Failure risk
* Train traffic impact

The output contains a priority score and corresponding priority tier.

```text
Maintenance Task
       │
       ▼
┌──────────────────────┐
│ Asset Criticality    │
│ Defect Severity      │
│ Overdue Duration     │
│ Failure Risk         │
│ Traffic Impact       │
└──────────┬───────────┘
           │
           ▼
    Priority Scoring
           │
           ▼
      Score: 0–100
           │
           ▼
┌──────────────────────┐
│ LOW                  │
│ MEDIUM               │
│ HIGH                 │
│ CRITICAL             │
└──────────────────────┘
```

---

# 📊 Priority Classification

The engine categorizes maintenance tasks into four priority levels:

| Tier        | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| 🟢 LOW      | Lower-priority maintenance activity                              |
| 🟡 MEDIUM   | Moderate maintenance priority                                    |
| 🟠 HIGH     | Important maintenance requiring earlier consideration            |
| 🔴 CRITICAL | High-priority maintenance requiring immediate planning attention |

The priority score is used by the planning pipeline as an input to scheduling decisions.

---

# 🔌 AI Service API

The AI engine is implemented as a **FastAPI service**.

### Service endpoint

```http
POST /score
```

The backend sends the maintenance-task information to the AI service.

Conceptually:

```text
Backend
   │
   │ Maintenance Task Data
   ▼
AI Priority Engine
   │
   │ Priority Score + Tier
   ▼
Backend
   │
   ▼
Planning / Optimization
```

The service also provides interactive API documentation through FastAPI:

```text
http://localhost:8000/docs
```

---

# 🧩 AI Service Components

```text
ai-engine/
│
├── app.py
│
├── priority_score.py
│
├── data/
│   └── sample JSON data
│
├── requirements.txt
│
└── AI_SERVICE_CONTRACT_FOR_BACKEND.md
```

### `app.py`

Runs the live FastAPI service consumed by the Railyukti backend.

### `priority_score.py`

Provides the standalone scoring implementation for local testing without running the API server.

### `data/`

Contains sample data used for local AI testing.

### `AI_SERVICE_CONTRACT_FOR_BACKEND.md`

Defines the expected communication format between the backend and AI service.

---

# ⚙️ Running the AI Service

## Prerequisites

* Python 3.x
* pip

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the service:

```bash
uvicorn app:app --reload --port 8000
```

The service runs at:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

---

# 🧪 Local Scoring Test

The scoring logic can also be tested without starting FastAPI.

```bash
python priority_score.py
```

This version reads local JSON data and prints the calculated results.

---

# 🚆 Railway Domain Context

The AI engine is designed specifically for railway maintenance planning.

Example:

```text
Asset:
Track Section A-B

Asset Criticality:
HIGH

Defect Severity:
HIGH

Overdue Duration:
32 days

Failure Risk:
HIGH

Train Traffic Impact:
HIGH

          ↓

AI Priority Score
          ↓

CRITICAL
```

The resulting priority is then passed into the planning workflow.

---

# 🔗 Integration With Railyukti

The AI branch does not operate as an isolated application.

Its position in the complete system is:

```text
                  RAILYUKTI
                     │
             Maintenance Data
                     │
                     ▼
            ┌─────────────────┐
            │ Backend         │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ AI Priority     │
            │ Engine          │
            └────────┬────────┘
                     │
             Priority Results
                     │
                     ▼
            ┌─────────────────┐
            │ Optimization /  │
            │ Planning        │
            └────────┬────────┘
                     │
                     ▼
              Optimized Plan
```

---

# 📈 Role in Optimization

The AI-generated priority is not the final schedule.

Instead:

```text
AI
 ↓
Task Priority
 ↓
Available Blocks
 ↓
Train Constraints
 ↓
Resource Constraints
 ↓
Optimization
 ↓
Final Maintenance Plan
```

This separation allows the system to distinguish between:

**AI decision support**

and

**constraint-based scheduling.**

---

# 🛡️ AI Safety Approach

The AI engine provides recommendations and priority information.

It does not independently:

* Control trains
* Operate railway infrastructure
* Approve maintenance blocks
* Execute railway operations

The intended workflow is:

```text
AI Recommendation
       ↓
Constraint Validation
       ↓
Planner Review
       ↓
Authorized Approval
```

---

# 📌 Current Scope

The AI branch currently provides the priority-scoring service and supporting local testing components.

The broader Railyukti architecture is designed to connect AI prioritization with block scheduling and optimization.

> All prototype data is synthetic and intended for demonstration purposes.

---

# 🚀 Future Extensions

Potential extensions include:

* Historical failure prediction
* Improved asset failure-risk models
* Resource-aware prioritization
* Learning from previous maintenance outcomes
* More detailed train traffic impact modelling
* Multi-objective optimization
* Optimization explainability
* Continuous model evaluation

---

# ⚠️ Disclaimer

This AI engine is part of the Railyukti prototype developed for Smart India Hackathon 2026.

It uses synthetic/demo data and is not connected to live or confidential Indian Railways operational systems.

It is intended for research, demonstration, and prototype evaluation.
