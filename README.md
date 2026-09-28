# 🚆 Railyukti

### AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations

> **Smart India Hackathon 2026 — Ministry of Railways**

Railyukti is an **AI-assisted decision-support system** designed to improve railway maintenance block planning by coordinating maintenance requirements, train operations, corridor availability, and resource constraints.

The system helps railway planners identify **what maintenance should be prioritized and when it can be safely scheduled**, while considering operational constraints and minimizing disruption to train services.

---

## 📌 Problem Statement

Railway maintenance activities are carried out by multiple departments such as:

* Engineering (ENG)
* Traction Distribution (TRD)
* Signal & Telecom (S&T)

Maintenance requirements, asset conditions, train schedules, and available maintenance windows need to be coordinated before a block can be planned.

When these activities are planned independently, it can lead to:

* Conflicting maintenance requests
* Under-utilized block windows
* Difficulty coordinating multiple departments
* Increased impact on train operations
* Delays in completing critical maintenance
* Reduced availability of railway assets

The challenge is to create an intelligent system that can coordinate these requirements and generate an optimized maintenance plan.

---

# 💡 Our Solution — Railyukti

Railyukti provides an integrated planning workflow that combines:

**Maintenance Requirements + Asset Conditions + Train Operations + Block Availability + Resource Constraints**

to generate an optimized maintenance block plan.

The system follows two major intelligence stages:

### 🧠 AI Priority Intelligence

Determines which maintenance activities should receive higher priority based on factors such as:

* Asset criticality
* Defect severity
* Urgency
* Overdue duration
* Failure risk
* Train traffic impact

### ⚙️ Optimization Intelligence

Uses operational and resource constraints to determine suitable maintenance windows while reducing conflicts with train operations.

### 👨‍💼 Human-in-the-Loop

Railyukti is designed as a **decision-support system**.

The generated plan can be reviewed and approved by authorized railway personnel before implementation.

---

# 🔄 System Workflow

```text
Maintenance & Asset Data
          │
          ▼
   Data Integration
          │
          ▼
   AI Priority Analysis
          │
          ▼
Traffic & Availability Analysis
          │
          ▼
   Constraint Optimization
          │
          ▼
  Optimized Block Plan
          │
          ▼
 Visualization & Analytics
          │
          ▼
Human Review & Approval
```

---

# 🏗️ System Architecture

```text
 ┌─────────────────────────────────────────┐
 │           Railway Data Sources          │
 │                                         │
 │ TMS │ SMMS │ TDMS │ COA │ Maintenance   │
 └───────────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Data Integration &     │
        │ Normalization Layer    │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ AI Priority Engine     │
        │                        │
        │ Criticality            │
        │ Severity               │
        │ Urgency                │
        │ Risk                   │
        │ Traffic Impact         │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Optimization Engine    │
        │                        │
        │ Time Constraints       │
        │ Train Conflicts        │
        │ Block Availability     │
        │ Resources              │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Optimized Maintenance  │
        │ Block Plan             │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Planning Dashboard &   │
        │ Analytics               │
        └────────────────────────┘
```

---

# ✨ Key Features

### 🔹 Multi-Department Coordination

Brings maintenance requirements from different railway departments into a unified planning process.

### 🔹 AI-Based Maintenance Prioritization

Helps identify maintenance activities that require earlier attention based on operational and asset-related factors.

### 🔹 Intelligent Block Planning

Considers available maintenance windows and operational constraints while generating plans.

### 🔹 Train Operation Awareness

Considers train schedules and corridor availability to reduce conflicts between maintenance and train movement.

### 🔹 Resource-Aware Planning

Planning can consider available maintenance resources and operational constraints.

### 🔹 Conflict Reduction

Identifies potential scheduling conflicts before finalizing a maintenance plan.

### 🔹 Plan Visualization

Provides an intuitive view of maintenance activities and their scheduled windows.

### 🔹 Analytics & Monitoring

Provides insights into maintenance workload, scheduling, block utilization, and planning performance.

### 🔹 Explainable Decisions

The system is designed to provide understandable reasons behind maintenance prioritization and scheduling decisions.

---

# 🧠 Intelligence Behind Railyukti

Railyukti separates the planning problem into two complementary questions:

### **1. What should be done first?**

The AI priority layer evaluates maintenance requirements using relevant operational and asset factors.

```text
Asset Criticality
       +
Defect Severity
       +
Urgency / Overdue Status
       +
Failure Risk
       +
Traffic Impact
       ↓
Maintenance Priority
```

### **2. When should it be done?**

The optimization layer considers:

* Available block windows
* Train movements
* Maintenance duration
* Department requirements
* Operational constraints
* Resource availability

The result is a more coordinated maintenance schedule.

---

# 📊 Expected Benefits

Railyukti aims to support railway planners in:

* Improving asset availability
* Prioritizing critical maintenance
* Better utilization of available block windows
* Reducing scheduling conflicts
* Coordinating multiple departments
* Reducing unnecessary operational disruption
* Improving maintenance planning visibility
* Supporting faster planning decisions

---

# 🖥️ Prototype

The Railyukti prototype demonstrates an integrated planning workflow through a centralized interface.

The prototype includes capabilities for:

* Maintenance monitoring
* Asset information
* Train and schedule information
* Block availability
* Maintenance planning
* Optimized plan visualization
* Planning analytics

The prototype uses **synthetic/mock data** to demonstrate the system workflow.

> **Important:** The prototype does not use live Indian Railways operational data.

---

# 🛠️ Technology Overview

| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| Frontend      | React, TypeScript, Vite                          |
| UI            | Tailwind CSS                                     |
| Visualization | Recharts / Gantt-style planning views            |
| Backend       | Node.js, Express                                 |
| Database      | PostgreSQL                                       |
| ORM           | Prisma                                           |
| AI Service    | Python, FastAPI                                  |
| Optimization  | Constraint-based optimization / OR-Tools concept |
| Development   | Git, GitHub, Postman, Docker                     |

---

# 📁 Repository Structure

```text
Railyukti/
│
├── frontend/          # User interface
│
├── backend/           # Core application and data services
│
├── ai/                # AI intelligence layer
│
├── dataset/           # Synthetic prototype data
│
├── docs/              # Project documentation
│
└── README.md          # Project overview
```

Detailed implementation documentation is maintained separately within the respective project areas.

---

# 🔐 Safety & Operational Approach

Railyukti is designed as an **AI-assisted decision-support system**, not an autonomous railway control system.

The system does not directly control railway infrastructure, train movement, signalling, or real-world block authorization.

Final maintenance and operational decisions remain with **authorized railway personnel**.

---

# 🧪 Prototype Data

The prototype uses synthetic data representing railway operational scenarios such as:

* Railway assets
* Maintenance activities
* Defects
* Train schedules
* Block windows
* Planning information
* Analytics

This allows the complete planning workflow to be demonstrated without exposing or depending on confidential railway operational data.

---

# 🚀 Future Scope

The system can be extended with:

* Integration with authorized railway information systems
* More advanced AI-based risk prediction
* Real-time operational data
* Dynamic rescheduling
* Predictive maintenance
* Advanced multi-department optimization
* Resource and crew optimization
* Historical planning intelligence
* More detailed explainability
* Enterprise-level authentication and authorization

---

# 🎯 Project Vision

> **“From fragmented maintenance requests to intelligent, coordinated and availability-focused railway planning.”**

Railyukti aims to provide railway planners with a unified intelligence layer that helps them make better-informed maintenance planning decisions while considering the realities of train operations.

---

# 🏆 Smart India Hackathon 2026

**Problem Statement:**
**AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**

**Organization:** Ministry of Railways

**Project:** Railyukti

---

# 👥 Team

**Railyukti — SIH 2026 Team**

A collaborative project combining:

* Full-stack development
* Artificial Intelligence
* Optimization
* Data engineering
* UI/UX
* Railway-domain problem solving

---

## ⚠️ Disclaimer

Railyukti is a **prototype developed for Smart India Hackathon 2026**.

The system is demonstrated using synthetic/mock data and is intended for research, demonstration, and decision-support purposes.

It should not be considered a production railway control or authorization system.

---

⭐ **Railyukti — Making Railway Maintenance Planning Smarter, More Coordinated, and More Availability-Focused.**
