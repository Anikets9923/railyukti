# ⚙️ Railyukti — Backend

> Central API, planning orchestration, database and integration layer for the Railyukti railway maintenance planning platform.

**Smart India Hackathon 2026 — SIH26027**

This branch contains the **backend system of Railyukti**.

The backend acts as the central integration layer between the frontend, PostgreSQL database, AI Priority Engine, and planning/optimization pipeline.

---

# 🎯 Purpose

The backend is responsible for managing and coordinating the core railway planning data.

It provides APIs for:

* Assets
* Maintenance tasks
* Trains
* Train schedules
* Block windows
* Planning
* Generated plans
* Analytics

It also orchestrates the planning workflow between the database, AI service, availability information, and optimization layer.

---

# 🏗️ Backend Architecture

```text
                    FRONTEND
                       │
                       │ REST API
                       ▼
              ┌──────────────────┐
              │  Node.js +       │
              │  Express.js      │
              └────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
     PostgreSQL    AI Service   Optimization
       + Prisma      FastAPI       Engine
          │            │            │
          └────────────┼────────────┘
                       ▼
                Generated Plan
                       │
                       ▼
                 Frontend
```

---

# 🧩 Backend Responsibilities

## 1. API Layer

Provides REST endpoints for frontend applications.

## 2. Data Layer

Uses PostgreSQL and Prisma to store and retrieve planning information.

## 3. Planning Orchestration

Coordinates:

```text
Maintenance
    ↓
AI Priority
    ↓
Available Blocks
    ↓
Train Constraints
    ↓
Optimization
    ↓
Generated Plan
```

## 4. Analytics

Provides dashboard and optimization-related metrics.

---

# 🛠️ Technology Stack

### Runtime

* Node.js

### Framework

* Express.js

### Database

* PostgreSQL

### ORM

* Prisma

### API

* REST

### Supporting Services

* Python/FastAPI AI service
* Optimization service

---

# 🗄️ Database Model

The backend uses a relational PostgreSQL model.

```text
Department
    │
    ▼
  Section
    │
    ├──────── Asset
    │            │
    │            ├── Defect
    │            │
    │            └── Maintenance Task
    │
    └──────── Train
                  │
                  └── Train Schedule

Maintenance Task
        │
        ▼
 Scheduled Task
        │
        ▼
    Block Plan
```

### Core entities

* Department
* Section
* Asset
* Defect
* Maintenance Task
* Train
* Train Schedule
* Block Window
* Block Plan
* Scheduled Task

---

# 🔌 REST API

## Health

```http
GET /api/health
```

Used to verify that the backend service is running.

---

## Assets

```http
GET /api/assets
GET /api/assets/:id
```

Provides infrastructure asset information.

Example data:

```text
Asset Code
Asset Type
Department
Section
Criticality
Status
Last Maintenance
Next Maintenance
```

---

# 🛠️ Maintenance APIs

```http
GET    /api/maintenance
GET    /api/maintenance/:id
POST   /api/maintenance
PUT    /api/maintenance/:id
```

Maintenance records include information such as:

* Task code
* Task type
* Description
* Severity
* Priority score
* Status
* Due date
* Overdue days
* Estimated duration
* Department
* Asset

---

# 🚆 Train APIs

```http
GET /api/trains
GET /api/trains/:id
GET /api/trains/schedule
```

Train schedule information is required when evaluating maintenance block availability and possible scheduling conflicts.

---

# 🧱 Block APIs

```http
GET /api/blocks
GET /api/blocks/:id
GET /api/blocks/available
```

Block information includes the maintenance windows available for planning.

---

# 🤖 Planning APIs

### Generate Plan

```http
POST /api/planning/generate
```

Example request:

```json
{
  "start_date": "2026-09-07",
  "end_date": "2026-09-13",
  "departments": [
    "ENG",
    "TRD",
    "SNT"
  ]
}
```

The planning endpoint coordinates the planning pipeline.

```text
POST /planning/generate
          │
          ▼
Maintenance Tasks
          │
          ▼
AI Priority
          │
          ▼
Available Blocks
          │
          ▼
Train Constraints
          │
          ▼
Optimization
          │
          ▼
Generated Plan
          │
          ▼
Database
```

### Retrieve Plans

```http
GET /api/planning
GET /api/planning/:id
```

---

# 📊 Analytics APIs

Dashboard:

```http
GET /api/analytics/dashboard
```

Optimization details:

```http
GET /api/analytics/optimization/:id
```

Dashboard analytics can include:

* Total maintenance tasks
* Pending tasks
* Critical tasks
* Overdue tasks
* Scheduled tasks
* Unscheduled tasks
* Total block windows
* Used block windows
* Average block utilization
* Department-wise task counts

---

# 🔄 Planning Service

The planning workflow is the main backend orchestration process.

```text
1. Retrieve maintenance tasks
             ↓
2. Analyze task information
             ↓
3. Request AI priority scores
             ↓
4. Retrieve available block windows
             ↓
5. Retrieve train schedule constraints
             ↓
6. Identify compatible tasks
             ↓
7. Run optimization
             ↓
8. Validate generated schedule
             ↓
9. Create block plan
             ↓
10. Save scheduled tasks
             ↓
11. Return generated plan
```

---

# 🤖 AI Integration

The backend communicates with the separate AI Priority Engine.

```text
Backend
   │
   │ Maintenance task data
   ▼
FastAPI AI Service
   │
   │ Score + Tier
   ▼
Backend
   │
   ▼
Planning Pipeline
```

The AI service runs separately from the Node.js backend.

Example environment configuration:

```env
AI_SERVICE_URL=http://localhost:8000
```

---

# ⚙️ Optimization Integration

The backend also acts as the integration point for the optimization layer.

Conceptually:

```text
Maintenance Data
      +
AI Priority
      +
Train Schedule
      +
Block Windows
      +
Resources
      ↓
Optimization
      ↓
Feasible Maintenance Plan
```

The generated result is persisted by the backend and exposed to the frontend through the planning APIs.

---

# 📦 API Response Format

Successful API responses follow a common structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error responses follow:

```json
{
  "success": false,
  "message": "Error message"
}
```

This consistent response structure allows the frontend to handle API results uniformly.

---

# 📁 Backend Structure

```text
backend/
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── utils/
│
├── prisma/
│   └── schema.prisma
│
├── seed/
│
├── tests/
│
├── .env
├── package.json
└── README.md
```

### Controllers

Handle incoming API requests.

### Routes

Define REST API endpoints.

### Services

Contain planning and business logic.

### Middleware

Handles common request processing and validation.

### Prisma

Provides database access through the Prisma ORM.

### Tests

Contains backend service/API tests.

---

# 🧪 Testing

Backend functionality can be tested through the project test suite.

Example:

```bash
npm test
```

API endpoints can also be tested using tools such as:

* Postman
* REST clients
* Frontend application

Health check:

```http
GET /api/health
```

---

# 🚀 Getting Started

## Prerequisites

Install:

* Node.js
* npm
* PostgreSQL
* Git

Optional:

* Docker
* Postman

---

## Install dependencies

```bash
npm install
```

---

## Configure environment

Create `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/rail_planning"
PORT=5000
AI_SERVICE_URL="http://localhost:8000"
OPTIMIZATION_SERVICE_URL="http://localhost:8001"
```

---

## Database Migration

Run:

```bash
npx prisma migrate dev
```

---

## Seed Prototype Data

```bash
npm run seed
```

---

## Start Development Server

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

API base path:

```text
http://localhost:5000/api
```

---

# 🔗 Integration With Frontend

The frontend communicates with the backend using:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The backend therefore acts as the single API gateway for the frontend.

```text
React Frontend
      │
      ▼
Express Backend
      │
 ┌────┼─────────────┐
 ▼    ▼             ▼
DB    AI        Optimization
```

---

# 🧪 Prototype Data

The backend uses synthetic railway data because the prototype does not have access to live production TMS, SMMS, TDMS, or COA databases.

The prototype can contain:

* Departments
* Sections
* Assets
* Defects
* Maintenance tasks
* Trains
* Train schedules
* Block windows
* Planning data
* Analytics data
* Department resources

This data allows the complete planning workflow to be demonstrated.

---

# 🔐 Backend Safety Approach

The backend is responsible for planning and decision support.

It does not directly control:

* Train movements
* Railway signalling
* Track infrastructure
* Electrical infrastructure
* Operational railway systems

The backend generates planning information for review by authorized users.

---

# 🎯 Backend Role in Railyukti

The backend is the **central orchestration layer**.

```text
             FRONTEND
                 │
                 ▼
          ┌─────────────┐
          │   BACKEND   │
          └──────┬──────┘
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
    DATABASE     AI    OPTIMIZATION
       │         │         │
       └─────────┼─────────┘
                 ▼
          GENERATED PLAN
                 │
                 ▼
             FRONTEND
```

Its primary responsibility is to make the different Railyukti components work together as one planning system.

---

# ⚠️ Disclaimer

This backend is part of the Railyukti prototype developed for Smart India Hackathon 2026.

The data used by the system is synthetic/demo data and does not represent confidential or production Indian Railways data.

The backend is intended for demonstration, research, and prototype evaluation and is not intended for direct deployment in live railway operations.
