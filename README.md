# 🖥️ Railyukti — Frontend

> Interactive web dashboard for AI-assisted railway maintenance block planning.

**Smart India Hackathon 2026 — SIH26027**

This branch contains the **frontend application of Railyukti**.

The frontend provides the user-facing interface for viewing railway maintenance information, assets, train schedules, available maintenance blocks, generated plans, and planning analytics.

It communicates with the Railyukti backend through REST APIs.

---

# 🎯 Purpose

The frontend converts the complex railway planning pipeline into an easy-to-understand operational interface.

Instead of directly interacting with databases or AI services, users interact with:

* Dashboards
* Maintenance task views
* Asset information
* Train schedules
* Block availability
* Planning controls
* Generated maintenance plans
* Analytics and visualizations

---

# 🏗️ Frontend Architecture

```text
                    USER
                      │
                      ▼
              ┌───────────────┐
              │ React         │
              │ Application   │
              └───────┬───────┘
                      │
              API Client Layer
                      │
                      ▼
              ┌───────────────┐
              │ Railyukti     │
              │ Backend APIs  │
              └───────┬───────┘
                      │
                      ▼
             Planning / AI / DB
```

The frontend does not directly communicate with the database or AI service.

The backend acts as the central API layer.

---

# 🧩 Main Functional Areas

## 📊 Dashboard

Provides a high-level view of maintenance planning.

Typical information includes:

* Total maintenance tasks
* Pending tasks
* Critical tasks
* Overdue tasks
* Scheduled tasks
* Unscheduled tasks
* Available block windows
* Used block windows
* Block utilization
* Department-wise task distribution

---

## 🛠️ Maintenance

The maintenance interface allows users to view and manage maintenance information received from the backend.

Typical information:

* Task code
* Task type
* Description
* Severity
* Priority
* Status
* Due date
* Overdue duration
* Estimated duration
* Department
* Asset

---

# 🏭 Assets

The asset interface provides information about railway infrastructure assets.

Typical information includes:

* Asset code
* Asset type
* Department
* Section
* Criticality
* Current status
* Last maintenance
* Next maintenance

---

# 🚆 Trains & Schedules

The frontend displays train schedule information required during maintenance planning.

This allows planners to understand the relationship between:

```text
Train Movement
      +
Maintenance Requirement
      +
Block Availability
```

Train information can be used to understand potential scheduling conflicts.

---

# 🧱 Block Availability

The block interface displays available maintenance windows.

Important information includes:

* Section
* Date
* Start time
* End time
* Maximum duration
* Block status

These windows are used during the planning process.

---

# 🤖 Planning

The planning interface allows the user to provide planning parameters such as:

```text
Start Date
End Date
Departments
```

The frontend sends these parameters to:

```http
POST /api/planning/generate
```

The backend then executes the planning pipeline.

```text
Generate Plan
      ↓
Backend
      ↓
AI Priority
      ↓
Availability Analysis
      ↓
Optimization
      ↓
Generated Plan
      ↓
Frontend
```

---

# 📅 Generated Plan

After planning is completed, the frontend can display information such as:

* Section
* Date
* Start time
* End time
* Block status
* Utilization
* Priority
* Optimization score
* Scheduled maintenance tasks

The frontend is responsible for visualizing the results returned by the backend rather than independently recalculating backend-owned planning metrics.

---

# 📈 Analytics

The frontend consumes backend analytics APIs to present planning performance.

Examples include:

* Maintenance task statistics
* Department distribution
* Block utilization
* Scheduled vs unscheduled tasks
* Optimization results

Charts and visualizations make the planning output easier to understand.

---

# 🛠️ Technology Stack

### Core

* React
* TypeScript
* Vite

### UI

* Tailwind CSS

### Data Visualization

* Recharts
* Gantt / calendar-style planning views

### Communication

* REST APIs
* Environment-based backend configuration

---

# 🔌 Backend Integration

The backend API base URL is configured through an environment variable.

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The frontend should not hardcode the backend URL.

---

# 🔗 API Domains

The frontend communicates with the following backend API groups.

### Health

```http
GET /api/health
```

### Assets

```http
GET /api/assets
GET /api/assets/:id
```

### Maintenance

```http
GET /api/maintenance
GET /api/maintenance/:id
POST /api/maintenance
PUT /api/maintenance/:id
```

### Trains

```http
GET /api/trains
GET /api/trains/:id
GET /api/trains/schedule
```

### Blocks

```http
GET /api/blocks
GET /api/blocks/:id
GET /api/blocks/available
```

### Planning

```http
POST /api/planning/generate
GET /api/planning
GET /api/planning/:id
```

### Analytics

```http
GET /api/analytics/dashboard
GET /api/analytics/optimization/:id
```

---

# 📁 Frontend Structure

```text
frontend/
│
├── src/
│   │
│   ├── api/
│   │   ├── client.js
│   │   ├── assets.js
│   │   ├── maintenance.js
│   │   ├── trains.js
│   │   ├── blocks.js
│   │   ├── planning.js
│   │   └── analytics.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── maintenance/
│   │   ├── assets/
│   │   ├── planning/
│   │   ├── trains/
│   │   ├── analytics/
│   │   └── common/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── field/
│   │   ├── department/
│   │   ├── operations/
│   │   ├── officer/
│   │   └── admin/
│   │
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── .env
├── package.json
└── README.md
```

---

# 🔄 Frontend Planning Flow

```text
User Opens Dashboard
        ↓
Fetch Dashboard Analytics
        ↓
Review Maintenance Tasks
        ↓
Review Available Blocks
        ↓
Select Planning Period
        ↓
Select Departments
        ↓
Generate Plan
        ↓
Wait for Backend Processing
        ↓
Receive Generated Plan
        ↓
Display Plan
        ↓
View Analytics
```

---

# ⚡ Loading & Error Handling

The frontend handles API states such as:

```text
Loading
   ↓
Success ──────→ Display Data
   │
   └──────────→ Error Message
```

For planning generation:

```text
Generate Plan
      ↓
Button Disabled
      ↓
Loading State
      ↓
Backend Response
      ↓
Success / Error
      ↓
Refresh Planning + Dashboard
```

This prevents duplicate planning requests and keeps the displayed data synchronized with the backend.

---

# 🚀 Getting Started

## Prerequisites

* Node.js
* npm
* Running Railyukti backend

Install dependencies:

```bash
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start development server:

```bash
npm run dev
```

---

# 🏗️ Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# 🔐 Frontend Design Principle

The frontend is designed as a **decision-support interface**.

It visualizes:

```text
Data
 ↓
AI Priority
 ↓
Planning
 ↓
Optimization
 ↓
Generated Plan
 ↓
Human Review
```

It does not independently execute railway operations.

---

# ⚠️ Prototype Disclaimer

This frontend is part of the Railyukti prototype developed for Smart India Hackathon 2026.

The application uses synthetic/demo railway data and is not connected to live Indian Railways operational systems.

It is intended for demonstration and prototype evaluation.
