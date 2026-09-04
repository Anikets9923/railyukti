# 🚆 AI-Powered Automatic Block Planning System

> **Smart, coordinated and data-driven maintenance block planning for Indian Railways**

**SIH 2026 — Problem Statement: SIH26027**

---

## 📌 Overview

Maintenance of fixed railway infrastructure is currently handled across multiple departments such as **Engineering, Traction Distribution (TRD), and Signal & Telecom (S&T)**.

Maintenance requests, defects, overdue tasks, train schedules, and available maintenance corridors originate from different systems. Because these activities are not always planned through a single coordinated intelligence layer, maintenance blocks may be underutilized, duplicated, or scheduled inefficiently.

Our project proposes an **AI-powered Automatic Block Planning System** that integrates maintenance requirements with railway corridor availability and train schedules to generate optimized maintenance block plans.

The system prioritizes maintenance activities based on **criticality, urgency, severity, and impact on asset availability**, and then uses an optimization engine to coordinate activities across departments.

---

## 🎯 Problem Statement

The existing maintenance block planning process involves decentralized planning across:

* Engineering
* Traction Distribution (TRD)
* Signal & Telecom (S&T)
* Railway Operations

Maintenance data is maintained separately, while train timetable and corridor availability information is handled through operational systems.

This can result in:

* Inefficient block utilization
* Poor coordination between departments
* Unnecessary asset downtime
* Scheduling conflicts
* Underutilized maintenance windows
* Increased impact on train operations

---

## 💡 Our Solution

We are building a centralized **AI-powered decision-support and automatic planning platform** that:

1. Integrates maintenance and defect data from multiple departments.
2. Analyzes asset criticality and maintenance urgency.
3. Considers train timetable and corridor availability.
4. Identifies compatible maintenance activities across departments.
5. Generates optimized maintenance blocks.
6. Produces weekly and monthly maintenance plans.
7. Provides explainable recommendations and optimization analytics.

### Core Concept

```text
Maintenance Data
       +
Train Timetable
       +
Corridor Availability
       +
Goods Train Forecast
       ↓
┌───────────────────────┐
│  AI Priority Engine   │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ Optimization Engine   │
│   Constraint Solver   │
└───────────┬───────────┘
            ↓
     Optimized Block Plan
            ↓
     Railway Dashboard
```

---

## 🧠 Key Features

### 1. Multi-Department Data Integration

The platform is designed to integrate data representing:

* **TMS** — Track/Engineering maintenance
* **SMMS** — Signal & Telecom maintenance
* **TDMS** — Traction Distribution maintenance
* **COA** — Train and corridor operational information

For the prototype, these systems are represented through **synthetic/mock datasets and API-ready interfaces**.

---

### 2. AI-Based Maintenance Prioritization

Each maintenance task receives a priority score based on factors such as:

* Asset criticality
* Defect severity
* Maintenance urgency
* Overdue duration
* Train traffic impact
* Potential asset availability impact

Example:

```text
Asset Criticality      → 30%
Defect Severity        → 25%
Urgency                → 20%
Overdue Duration       → 15%
Traffic Impact         → 10%
```

The resulting score helps classify tasks as:

```text
🔴 Critical
🟠 High
🟡 Medium
🟢 Low
```

---

### 3. Multi-Department Block Coordination

The system identifies maintenance activities that can potentially be performed during the same corridor block.

Example:

```text
Engineering → 10:00–12:00
S&T         → 10:30–11:30
TRD         → 11:00–13:00
```

Instead of treating these as independent requests, the optimizer can generate:

```text
Combined Block
10:00 ───────────────── 13:00

Engineering + S&T + TRD
```

This improves utilization of maintenance windows and reduces unnecessary separate blocks.

---

### 4. Constraint-Based Optimization

The optimization engine considers constraints such as:

* Train movements
* Available block windows
* Maintenance duration
* Crew availability
* Department compatibility
* Section/location
* Task priority
* Block duration limits
* Scheduling conflicts

The objective is to find a schedule that balances:

```text
Minimum downtime
        +
Minimum train disruption
        +
Maximum block utilization
        +
Maximum maintenance coverage
        +
Minimum unnecessary blocks
```

---

### 5. Weekly & Monthly Planning

The platform supports multiple planning horizons:

* Daily operational planning
* Weekly maintenance planning
* Monthly maintenance planning

This allows planners to handle both urgent defects and planned maintenance.

---

### 6. Explainable Recommendations

Instead of only generating a schedule, the system explains why a task or block was selected.

Example:

```text
BLOCK #104
Section: A-B
Time: 10:00–13:00

Why selected?

✓ 3 compatible maintenance activities
✓ High-priority defect included
✓ No protected train conflict
✓ Required resources available
✓ High block utilization
```

---

## 🏗️ System Architecture

```text
                    ┌──────────────┐
                    │     TMS      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     SMMS     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     TDMS     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     COA      │
                    └──────┬───────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Data Integration     │
                │ & Normalization     │
                └──────────┬──────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    ┌─────────────────┐        ┌─────────────────┐
    │ AI Priority     │        │ Traffic &       │
    │ Engine          │        │ Availability    │
    └────────┬────────┘        └────────┬────────┘
             │                          │
             └────────────┬─────────────┘
                          ▼
                ┌─────────────────────┐
                │ Optimization Engine │
                │   OR-Tools / CP-SAT │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Optimized Block Plan│
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Web Dashboard       │
                │ Gantt + Analytics   │
                └─────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Recharts
* Gantt/Calendar visualization

### Backend

* Node.js
* Express.js
* REST APIs

### Database

* PostgreSQL
* Prisma ORM

### AI / Optimization

* Python
* FastAPI
* Scikit-learn
* Google OR-Tools
* Constraint Programming / CP-SAT

### Development

* Git & GitHub
* Postman
* Docker

---

## 📂 Project Structure

```text
project-root/
│
├── frontend/
│   ├── src/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── seed/
│   └── ...
│
├── ai-engine/
│   ├── models/
│   ├── services/
│   └── ...
│
├── optimization-engine/
│   ├── solver/
│   ├── constraints/
│   └── ...
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── generators/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── optimization.md
│
├── simulation/
│
└── README.md
```

---

## 🗄️ Core Data Model

The prototype uses a relational data model.

```text
Department
    │
    ▼
Asset
    │
    ├──── Defect
    │
    └──── Maintenance Task
                 │
                 ▼
            Scheduled Task
                 │
                 ▼
             Block Plan
                 │
                 ▼
              Section
                 │
                 ▼
               Train
```

### Main Entities

* Departments
* Sections
* Assets
* Defects
* Maintenance Tasks
* Trains
* Train Schedules
* Block Windows
* Block Plans
* Scheduled Tasks

---

## 🔌 Backend API

Example API structure:

```text
GET    /api/assets
GET    /api/assets/:id

GET    /api/maintenance
GET    /api/maintenance/:id
POST   /api/maintenance
PUT    /api/maintenance/:id

GET    /api/trains
GET    /api/trains/schedule

GET    /api/blocks
GET    /api/blocks/available

POST   /api/planning/generate
GET    /api/planning
GET    /api/planning/:id

GET    /api/analytics/dashboard
GET    /api/analytics/optimization/:id
```

---

## 🔄 Planning Workflow

```text
1. Collect maintenance data
             ↓
2. Validate & normalize data
             ↓
3. Analyze defects and assets
             ↓
4. Calculate maintenance priority
             ↓
5. Analyze train/corridor availability
             ↓
6. Identify compatible maintenance tasks
             ↓
7. Run optimization
             ↓
8. Validate constraints
             ↓
9. Generate block plan
             ↓
10. Save & visualize results
```

---

## 📊 Expected Prototype Metrics

The prototype will compare manual/baseline scheduling with AI-optimized scheduling using measurable simulation metrics such as:

* Number of maintenance blocks
* Block utilization
* Maintenance tasks completed
* Critical tasks completed
* Scheduling conflicts
* Asset downtime
* Estimated asset availability
* Train disruption impact

> **Note:** Prototype improvement values are generated from simulated datasets and should not be interpreted as actual Indian Railways operational statistics.

---

## 🔐 Safety & Operational Approach

The system is designed as an **AI-powered decision-support and planning system**, not as an autonomous railway control system.

Generated plans should be:

```text
AI Generated
     ↓
Constraint Validation
     ↓
Human Review
     ↓
Approval
     ↓
Operational Execution
```

Final operational authority remains with authorized railway personnel.

---

## 🚀 Getting Started

### Prerequisites

Install:

* Node.js
* Python 3.x
* PostgreSQL
* Git
* Docker (optional)

### Clone Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/rail_planning"
PORT=5000
AI_SERVICE_URL="http://localhost:8000"
OPTIMIZATION_SERVICE_URL="http://localhost:8001"
```

Run database migration:

```bash
npx prisma migrate dev
```

Seed prototype data:

```bash
npm run seed
```

Start backend:

```bash
npm run dev
```

---

## 🧪 Prototype Data

Because the production TMS, SMMS, TDMS and COA systems are not publicly accessible, this prototype uses **synthetic data designed to represent their relevant data structures**.

The simulation includes:

* Railway sections
* Infrastructure assets
* Defects
* Maintenance requests
* Train schedules
* Goods train forecasts
* Block availability
* Department resources

This allows the optimization system to be demonstrated without requiring access to operational railway infrastructure.

---

## 👥 Team

### Team: `[YOUR TEAM NAME]`

**Team Size:** 6

| Role                     | Responsibility                             |
| ------------------------ | ------------------------------------------ |
| Team Lead / Product      | Architecture, integration & coordination   |
| AI/ML Engineer           | Maintenance priority & AI models           |
| Optimization Engineer    | Block scheduling & constraint optimization |
| Backend Engineer         | APIs, services & database                  |
| Frontend Engineer        | Dashboard & planning interface             |
| Data/Simulation Engineer | Synthetic data, simulation & analytics     |

---

## 🎯 Project Objective

Our objective is to transform decentralized maintenance block planning into a **coordinated, data-driven and optimization-based planning process**.

### Our vision:

> **Plan smarter. Coordinate better. Minimize downtime. Maximize infrastructure availability.**

---

## 📌 SIH 2026

**Smart India Hackathon 2026**

**Problem Statement:** SIH26027

**Domain:** Transportation / Railway Infrastructure

**Solution:** AI-Powered Automatic Block Planning and Multi-Department Maintenance Scheduling

---

## ⚠️ Disclaimer

This repository contains a **prototype developed for Smart India Hackathon 2026**.

The railway data used by the prototype is simulated and does not represent confidential, operational, or production Indian Railways data.

The system is intended for demonstration and research purposes and is **not intended for direct deployment in live railway operations**.
