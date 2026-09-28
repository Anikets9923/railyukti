# RailYukti Frontend API Endpoints

Generated from the source in `railyukti-frontend` and compared with the sibling backend at `D:\projects\railyukti\backend`.

## 1. Base URL and API configuration

### Frontend transport

- Frontend root: `D:\projects\railyukti frontend\railyukti-frontend`.
- Base URL: `import.meta.env.VITE_API_BASE_URL`, with one trailing slash removed in [src/api/client.js](src/api/client.js#L1).
- Current configured value: `https://implementing-bingo-unsubscribe-drag.trycloudflare.com` in [.env](.env#L1).
- Every request is sent by the single `fetch` call in [src/api/client.js](src/api/client.js#L18-L31).
- The frontend has no Axios, React Query, GraphQL, WebSocket, EventSource, or other HTTP client dependency.
- Supported client methods are `GET`, `POST`, `PUT`, and `DELETE`; no frontend API module currently uses `PATCH` or `DELETE`.
- Query parameters are not serialized by the client. The `options` argument only reaches `headers` and `signal`; callers currently pass no query string.

### Headers and authentication

The client sends:

```http
Accept: application/json
Content-Type: application/json   # only when a truthy body is supplied
Authorization: Bearer <token>    # only when setAuthToken(token) has a non-empty token
```

`setAuthToken(null)` is called during demo login and logout in [src/auth/AuthContext.jsx](src/auth/AuthContext.jsx#L10-L18). Login is local demo-user selection, not an HTTP request. Therefore current frontend requests normally have no `Authorization` header. The backend also has no authentication middleware in `D:\projects\railyukti\backend\src\app.js`.

### Response and error handling

The client parses JSON when the response content type includes `application/json`, otherwise text. Non-2xx responses become `ApiError` objects containing `status` and `details`.

The backend uses this envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

defined in `D:\projects\railyukti\backend\src\utils\apiResponse.js`. This is important because most frontend hooks currently pass the entire response into `collection()`, which only accepts a top-level array or top-level `items`; backend responses put collections under `data.items`.

## 2. Complete frontend API endpoint table

Status meanings: `Used` means a live hook invokes the service function; `Defined, unused` means the API method exists but no live caller invokes it; `Throws, no request` means the method is called but intentionally raises before network I/O; `Backend route` means the sibling backend has a semantically corresponding route after considering its `/api` prefix.

| Module | Method | Endpoint | Purpose | Request Data | Frontend File | Backend Status |
|---|---|---|---|---|---|---|
| Analytics | GET | `${VITE_API_BASE_URL}/analytics/overview` | Load divisional summary and trend analytics | No query parameters | [src/api/analytics.js](src/api/analytics.js#L3-L6); [src/hooks/useDivisionalWorkspace.js](src/hooks/useDivisionalWorkspace.js#L15-L21) | Missing. Backend exposes `GET /api/analytics/dashboard`, not `/analytics/overview`; also missing `/api` in the frontend path. |
| Analytics | GET | `${VITE_API_BASE_URL}/analytics/performance` | Load department performance | No query parameters | [src/api/analytics.js](src/api/analytics.js#L3-L6); [src/hooks/useDivisionalWorkspace.js](src/hooks/useDivisionalWorkspace.js#L15-L21) | Missing. No backend performance route. |
| Assets | GET | `${VITE_API_BASE_URL}/assets` | List assets for department, field, and planner views | No frontend query parameters. Backend supports `page`, `limit`, `department`, `section`, `criticality`, `status`. | [src/api/assets.js](src/api/assets.js#L3-L6); [src/hooks/useDepartmentWorkspace.js](src/hooks/useDepartmentWorkspace.js#L13-L23); [src/hooks/useFieldWorkspace.js](src/hooks/useFieldWorkspace.js#L9-L34) | Semantically implemented as `GET /api/assets`; runtime path mismatch because frontend omits `/api`. Response envelope mismatch. |
| Assets | GET | `${VITE_API_BASE_URL}/assets/{assetId}` | Load one asset detail | Path parameter `assetId` | [src/api/assets.js](src/api/assets.js#L4-L6) | Semantically implemented as `GET /api/assets/:id`, but unused by frontend and missing `/api` at runtime. |
| Blocks | GET | `${VITE_API_BASE_URL}/blocks` | List block windows/requests for department, operations, and planner views | No frontend query parameters. Backend supports `page`, `limit`, `section`, `status`, `date`. | [src/api/blocks.js](src/api/blocks.js#L3-L7); [src/hooks/useBlockPlanner.js](src/hooks/useBlockPlanner.js#L12-L24); [src/hooks/useDepartmentWorkspace.js](src/hooks/useDepartmentWorkspace.js#L13-L23); [src/hooks/useOperationsWorkspace.js](src/hooks/useOperationsWorkspace.js#L10-L16) | Semantically implemented as `GET /api/blocks`; runtime path mismatch and response envelope mismatch. |
| Blocks | POST | `${VITE_API_BASE_URL}/blocks` | Create a department block request | JSON payload: `{ corridor, window, requestedFor, impact, department }` from [DepartmentBlocksPage.jsx](src/pages/department/DepartmentBlocksPage.jsx#L8-L12) | [src/api/blocks.js](src/api/blocks.js#L4-L7); [src/hooks/useDepartmentWorkspace.js](src/hooks/useDepartmentWorkspace.js#L22-L23) | Missing. Backend block routes are read-only (`GET /api/blocks`, `/available`, `/:id`). |
| Blocks | PUT | `${VITE_API_BASE_URL}/blocks/{blockId}` | Update a block request/window | JSON `payload`; no live caller | [src/api/blocks.js](src/api/blocks.js#L5-L7) | Missing. Backend has no block `PUT` route. |
| Maintenance | GET | `${VITE_API_BASE_URL}/maintenance` | List maintenance tasks | No frontend query parameters. Backend supports `page`, `limit`, `department`, `section`, `status`, `severity`, `taskType`, `priority`, `date`. | [src/api/maintenance.js](src/api/maintenance.js#L3-L8); [src/hooks/useBlockPlanner.js](src/hooks/useBlockPlanner.js#L12-L24); [src/hooks/useDepartmentWorkspace.js](src/hooks/useDepartmentWorkspace.js#L13-L23); [src/hooks/useFieldWorkspace.js](src/hooks/useFieldWorkspace.js#L9-L34) | Semantically implemented as `GET /api/maintenance`; runtime path mismatch and response envelope mismatch. |
| Maintenance | GET | `${VITE_API_BASE_URL}/maintenance/{taskId}` | Load one maintenance task detail | Path parameter `taskId`; no live caller | [src/api/maintenance.js](src/api/maintenance.js#L4-L8) | Semantically implemented as `GET /api/maintenance/:id`, but unused and missing `/api` at runtime. |
| Maintenance | POST | `${VITE_API_BASE_URL}/maintenance` | Create a maintenance task | JSON `payload`; no live caller | [src/api/maintenance.js](src/api/maintenance.js#L5-L8) | Semantically implemented as `POST /api/maintenance`, but unused and missing `/api` at runtime. Backend requires task fields such as `taskCode`, `assetId`, `departmentId`, `sectionId`, `taskType`, `description`, `severity`, `dueDate`, `estimatedDuration`, and `crewRequired`. |
| Maintenance | PUT | `${VITE_API_BASE_URL}/maintenance/{taskId}` | Update field task status | JSON `{ status: nextStatus }`; field UI supplies display values such as `Assigned`, `In progress`, or `Completed` | [src/api/maintenance.js](src/api/maintenance.js#L6-L8); [src/hooks/useFieldWorkspace.js](src/hooks/useFieldWorkspace.js#L33-L34); [FieldHomePage.jsx](src/pages/field/FieldHomePage.jsx#L19-L21); [FieldTasksPage.jsx](src/pages/field/FieldTasksPage.jsx#L12-L13) | Semantically implemented as `PUT /api/maintenance/:id`; runtime path mismatch. Potential enum mismatch because backend validates Prisma enum values while UI uses title-case display statuses. |
| Planning | GET | `${VITE_API_BASE_URL}/planning/recommendations` | Load AI maintenance recommendations | No frontend query parameters | [src/api/planning.js](src/api/planning.js#L3-L7); [src/hooks/useDepartmentWorkspace.js](src/hooks/useDepartmentWorkspace.js#L13-L23) | Missing. Backend exposes planning list/generate/detail only. |
| Planning | GET | `${VITE_API_BASE_URL}/planning/weekly` | Load weekly plan data | No frontend query parameters | [src/api/planning.js](src/api/planning.js#L4-L7); [src/hooks/useBlockPlanner.js](src/hooks/useBlockPlanner.js#L12-L24); [src/hooks/useDepartmentWorkspace.js](src/hooks/useDepartmentWorkspace.js#L13-L23); [src/hooks/useDivisionalWorkspace.js](src/hooks/useDivisionalWorkspace.js#L15-L21) | Missing. Backend has `GET /api/planning` for block-plan listing, not `/weekly`; frontend also omits `/api`. |
| Planning | GET | `${VITE_API_BASE_URL}/planning/monthly` | Load monthly plan data | No frontend query parameters | [src/api/planning.js](src/api/planning.js#L4-L7); [src/hooks/useDivisionalWorkspace.js](src/hooks/useDivisionalWorkspace.js#L15-L21) | Missing. No backend monthly route. |
| Planning | POST | No path defined: `planningApi.generateOptimizedPlan()` throws before HTTP | Generate an optimized AI block plan | `BlockPlannerPage` computes filters `{ from, to, sections, departments, priority, status }`, but no payload is sent | [src/api/planning.js](src/api/planning.js#L7-L7); [src/hooks/useBlockPlanner.js](src/hooks/useBlockPlanner.js#L22-L24) | Contract missing in frontend. Backend implements `POST /api/planning/generate` and requires `{ startDate, endDate, departments }`; this is not currently called. |
| Trains | GET | `${VITE_API_BASE_URL}/trains` | List trains | No frontend query parameters. Backend supports `page`, `limit`. | [src/api/trains.js](src/api/trains.js#L3-L6) | Semantically implemented as `GET /api/trains`, but unused and missing `/api` at runtime. |
| Trains | GET | `${VITE_API_BASE_URL}/trains/timetable` | Load train timetable/schedules for planner and operations | No frontend query parameters. Backend route is `/api/trains/schedule`, supporting `page`, `limit`, `section`, `status`, `date`. | [src/api/trains.js](src/api/trains.js#L4-L6); [src/hooks/useBlockPlanner.js](src/hooks/useBlockPlanner.js#L12-L24); [src/hooks/useOperationsWorkspace.js](src/hooks/useOperationsWorkspace.js#L10-L16) | Missing exact route. Backend has semantically related `/api/trains/schedule`; path name mismatch and missing `/api`. |

### Actual request count

- 16 distinct HTTP endpoint contracts are defined in `src/api`.
- 11 distinct contracts are invoked by live workspace code.
- 5 service methods are defined but unused: asset detail, block update, maintenance detail, maintenance create, and train list.
- The plan-generation method is called by the planner but makes no request because it throws an `ApiError`.
- No frontend `PATCH` or `DELETE` endpoint exists.

## 3. APIs grouped by frontend page or module

### Department planner

Routes are available to department-planner users for `ENGINEERING`, `TRD`, and `S&T` in [src/auth/roles.js](src/auth/roles.js#L1-L12) and [src/routes/routeConfig.js](src/routes/routeConfig.js#L28-L34).

- Department dashboard, maintenance, assets, AI recommendations, and plan pages use `GET /maintenance`, `GET /assets`, `GET /blocks`, `GET /planning/recommendations`, and `GET /planning/weekly` through `useDepartmentWorkspace`.
- Block requests use `POST /blocks` with `{ corridor, window, requestedFor, impact, department }`.
- The block planner route also uses `GET /maintenance`, `GET /blocks`, `GET /trains/timetable`, and `GET /planning/weekly` through `useBlockPlanner`.
- Plan generation is a local simulation when the base URL is absent; with the current base URL configured, it fails at the undefined frontend generation contract.

### Field supervisor

- Field dashboard, tasks, assets, and history use `GET /maintenance` and `GET /assets`, then use `PUT /maintenance/{taskId}` for task status changes.
- Maintenance history remains local mock data even on the live path.
- Defect reporting always calls `fieldMockService.submitDefect()` and has no HTTP endpoint.

### Operations planner

- Operations dashboard, timetable, corridor, blocks, and conflicts use `GET /trains/timetable` and `GET /blocks`.
- Corridor, conflict, and alert data are empty on a successful live response and are only populated by the operations mock fallback.

### Divisional officer

- Divisional dashboard, weekly plan, monthly plan, approvals, performance, and analytics use `GET /analytics/overview`, `GET /analytics/performance`, `GET /planning/weekly`, and `GET /planning/monthly`.
- Approvals are incorrectly populated from the weekly response; there is no approval endpoint.
- Approval actions throw because `actOnPlan()` has no backend contract in the frontend.

### Department officer

- Dashboard, requests, approvals, and performance are entirely backed by `departmentOfficerMockService`.
- Request decisions call the local `decide(id, action)` function; no HTTP method or path exists.

### Admin

- Dashboard, users, roles, departments, sections, assets, configuration, and audit logs are entirely backed by `adminMockService`.
- The local `save(resource, payload)` returns a generated demo id; no admin CRUD API exists in the frontend.

## 4. APIs grouped by user role

| Frontend role | Departments represented | Live API requirements | Mock-only or missing requirements |
|---|---|---|---|
| `FIELD_SUPERVISOR` | `TRD` demo user | Maintenance list, asset list, maintenance update | Defect submission and maintenance history; failure risk, spares, and technician detail are not consumed. |
| `DEPARTMENT_PLANNER` | `ENGINEERING`, `TRD`, `S&T` | Maintenance list, asset list, block list/create, recommendations, weekly plan; block planner also needs timetable | Block creation has no backend route. Recommendations and weekly endpoints are absent. |
| `DEPARTMENT_OFFICER` | `ENGINEERING` demo user | None | Requests, decisions, performance, and approvals are mock-only. |
| `OPERATIONS_PLANNER` | `OPERATING` | Train timetable and block-window list | Backend uses `/trains/schedule`, not `/trains/timetable`. Corridors, conflicts, and alerts are mock-only. |
| `DIVISIONAL_OFFICER` | `DIVISIONAL` | Analytics overview/performance and weekly/monthly plans | Backend has dashboard analytics and generic planning list, but not the frontend paths. Approval actions have no contract. |
| `ADMIN` | `ADMIN` | None | User, role, department, section, asset administration, configuration, audit logs, and health panels are mock-only. |

The frontend uses local role/permission checks; it does not send role or department headers, query parameters, or tokens to the backend.

## 5. Request and response examples

### Frontend list call as currently constructed

```http
GET https://implementing-bingo-unsubscribe-drag.trycloudflare.com/maintenance
Accept: application/json
```

The intended backend URL is currently `GET https://implementing-bingo-unsubscribe-drag.trycloudflare.com/api/maintenance` because the Express app mounts maintenance routes at `/api/maintenance`.

### Backend maintenance list response

```json
{
  "success": true,
  "message": "Maintenance tasks retrieved successfully",
  "data": {
    "items": [
      {
        "id": "...",
        "taskCode": "MNT-0001",
        "status": "PLANNED",
        "severity": "CRITICAL",
        "priorityScore": 92,
        "asset": { "assetCode": "...", "assetType": "...", "criticality": "CRITICAL" },
        "department": { "code": "ENG", "name": "Engineering" },
        "section": { "code": "...", "name": "..." },
        "_count": { "scheduledTasks": 0 }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

The frontend currently expects either `response` to be an array or `response.items` to be an array. It does not unwrap `response.data`, so the backend response becomes an empty collection in `collection()`.

### Department block request currently sent

```http
POST ${VITE_API_BASE_URL}/blocks
Accept: application/json
Content-Type: application/json

{
  "corridor": "ALD-CNB",
  "window": "22:40-00:10",
  "requestedFor": "OHE mast inspection",
  "impact": "2 train paths",
  "department": "TRD"
}
```

There is no corresponding backend `POST /api/blocks` controller or request schema. The current call therefore cannot be fulfilled by the sibling backend.

### Backend plan generation contract that is not wired to the frontend

```http
POST ${VITE_API_BASE_URL}/api/planning/generate
Content-Type: application/json

{
  "startDate": "2026-09-07",
  "endDate": "2026-09-13",
  "departments": ["ENG", "TRD", "SNT"]
}
```

The backend returns `{ success, message, data }`, where `data` includes `dateRange`, `departments`, `tasksConsidered`, `assetsConsidered`, `trainSchedulesConsidered`, `blockWindowsConsidered`, `tasksScheduled`, `plansCreated`, and `plans`. The frontend planner currently creates UI filters using `ENGINEERING` and `S&T`, does not map them to backend `ENG` and `SNT`, and sends no body because its generation method throws.

## 6. Frontend APIs missing from the backend

The following frontend contracts have no exact backend route:

| Frontend contract | Impact |
|---|---|
| `GET /analytics/overview` | Divisional dashboard summary/trends cannot load from the backend. Closest route is `GET /api/analytics/dashboard`, but its data shape differs. |
| `GET /analytics/performance` | Divisional performance has no backend route. |
| `POST /blocks` | Department block-request submission has no backend route. |
| `PUT /blocks/{blockId}` | Block updates have no backend route. |
| `GET /planning/recommendations` | AI recommendations have no backend route. |
| `GET /planning/weekly` | Weekly planning has no backend route. Closest route is generic `GET /api/planning`. |
| `GET /planning/monthly` | Monthly planning has no backend route. |
| `GET /trains/timetable` | Closest route is `GET /api/trains/schedule`; path and response contract must be aligned. |
| Plan-generation frontend contract | Backend `POST /api/planning/generate` exists, but frontend does not define or call it. |
| Field defect submission | `fieldMockService.submitDefect()` has no frontend API method or backend route. |
| Department officer request/decision APIs | `departmentOfficerMockService` has no frontend API method or backend route. |
| Divisional plan approval API | `actOnPlan()` throws; no frontend path or backend route exists. |
| Admin APIs | Admin users, roles, departments, sections, asset registry, configuration, audit logs, and health are all mock-only; no corresponding admin route is mounted. |

All frontend URLs also omit the backend `/api` prefix. Thus even semantically matching paths will 404 against the current Express app unless the configured proxy/tunnel adds that prefix externally; no such rewrite is present in the frontend configuration.

## 7. Backend APIs not currently used by the frontend

Backend routes are mounted in [backend/src/app.js](../railyukti/backend/src/app.js#L5-L27). The following implemented routes are not called by any frontend API module or hook:

| Backend route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Backend health check |
| `/api/assets/:id/failure-risk` | GET | Failure-risk records for an asset |
| `/api/assets/:id/spares` | GET | Spare records for an asset |
| `/api/maintenance/:id/failure-risk` | GET | Failure-risk records for a maintenance task |
| `/api/maintenance/:id/spares` | GET | Spare records for a maintenance task |
| `/api/maintenance/:id/technician-availability` | GET | Technician availability for a maintenance task |
| `/api/trains/schedule` | GET | Train schedules; closest backend equivalent to frontend timetable call |
| `/api/blocks/available` | GET | Available block windows only |
| `/api/planning` | GET | Paginated block-plan list |
| `/api/planning/:id` | GET | Block-plan detail |
| `/api/planning/generate` | POST | Generate and persist an optimized plan |
| `/api/analytics/dashboard` | GET | Dashboard analytics |
| `/api/analytics/optimization/:id` | GET | Optimization metrics for one block plan |
| `/api/failure-risk` and `/api/failure-risk/:id` | GET | Failure-risk list/detail |
| `/api/spares` and `/api/spares/:id` | GET | Spare availability list/detail |
| `/api/technicians/availability` and `/api/technicians/availability/:id` | GET | Technician availability list/detail |

These are 18 route patterns grouped above. Counting every method/path pattern registered by the backend, the backend exposes 34 route patterns including the two implemented asset/maintenance/trains/block/planning/analytics CRUD or relation families and the health endpoint.

## 8. Mock APIs and hardcoded data that need backend integration

These are not HTTP requests. They are local promises that simulate backend behavior:

| Mock area | Functions/data | Current consumers | Integration needed |
|---|---|---|---|
| Authentication | `loginAsDemo`, local storage session, `DEMO_USERS` | Login and protected routes | Login, refresh/session, logout, role/department authorization, and token persistence. |
| Admin | `getUsers`, `getRoles`, `getDepartments`, `getSections`, `getAssets`, `getConfiguration`, `getAuditLogs`, `getHealth`, `save` | All admin pages | Admin CRUD, configuration, audit, and service health endpoints. |
| Field | `getTasks`, `getAssets`, `getHistory`, `submitDefect` | Field pages | Defect creation, maintenance history, and field-specific task/asset contracts. |
| Department planner | Department task/assets/blocks/recommendations/plan fixtures and `createBlock` | Department planner pages | Department-scoped block request, recommendation, plan, task, and asset APIs. |
| Department officer | Requests, performance, `decide` | Department officer pages | Request list, approval decision, and department performance endpoints. |
| Divisional officer | Summary, departments, weekly/monthly plans, approvals, performance, analytics, `actOnPlan` | Officer pages | Dashboard analytics, planning horizons, approval actions, and performance API. |
| Operations | Trains, blocks, corridors, conflicts, alerts | Operations pages | Timetable, available corridors, conflicts, and operational alert API. |
| Block planner | Tasks, windows, trains, generated plan, explanation | Planner page | Wire filters to backend generation and normalize persisted plan data. |

The live hooks have mixed fallback behavior: department and field workspaces fall back to mock data after a request error; operations falls back for all data; the planner retains an error; divisional data retains an error without mock fallback when the base URL is configured. This can make an unavailable backend appear partially functional.

## 9. Potential integration issues and recommendations

1. **Fix the base path first.** Either set `VITE_API_BASE_URL` to a URL that includes `/api`, or add `/api` to every frontend service path. The backend mounts every business route below `/api`.
2. **Unwrap the backend response envelope.** Change the frontend collection and scalar mapping to read `payload.data`, or change the backend contract consistently. Current `collection()` calls will return empty arrays for backend paginated responses.
3. **Align endpoint names.** Map timetable to `/trains/schedule`, overview to `/analytics/dashboard`, and weekly/monthly/recommendations to explicitly implemented backend routes or remove those frontend calls until contracts exist.
4. **Implement block-request persistence.** The frontend sends a human-readable block-request object, while the backend currently models block windows as read-only. Define a request resource or extend the block controller before enabling `POST /blocks`.
5. **Wire plan generation explicitly.** Implement `planningApi.generateOptimizedPlan(payload)` to call `POST /api/planning/generate`. Map frontend departments `ENGINEERING`, `TRD`, `S&T` to backend department codes `ENG`, `TRD`, `SNT`, and map date filters to `startDate`/`endDate`.
6. **Normalize backend status values.** Backend validators use Prisma enum values such as uppercase `PLANNED`, `IN_PROGRESS`, and `COMPLETED`, while field UI sends title-case display labels. Add a frontend/backend mapping layer.
7. **Add query serialization.** The backend supports useful filters and pagination, but the frontend client currently ignores query options. Serialize `page`, `limit`, department, date, status, severity, and section filters with `URLSearchParams`.
8. **Define authentication before production use.** Demo sessions deliberately clear the bearer token. Add login and refresh endpoints, protect backend routes, and send role/department claims through the authenticated session rather than trusting local UI permissions.
9. **Add resource-input consumers.** The backend already exposes failure-risk, spare, and technician availability APIs and uses them in plan generation. Add frontend API modules and UI states if those decision inputs are intended to be visible.
10. **Avoid silent mock substitution.** Preserve the source/error indicator, but make fallback behavior explicit per screen and distinguish an empty backend response from unavailable backend data.
11. **Add contract tests.** Test each service path against the Express app, including envelope unwrapping, enum values, required fields, and error statuses. The backend integration tests already exercise many routes and can be used as the contract baseline.

## Summary

| Metric | Count | Notes |
|---|---:|---|
| Unique frontend HTTP endpoint contracts | 16 | Service methods with a concrete path/method. |
| Live-invoked frontend contracts | 11 | Includes repeated calls to shared list endpoints only once. |
| Defined but unused frontend contracts | 5 | Asset detail, block update, maintenance detail/create, train list. |
| Frontend method called but no request made | 1 | Optimized plan generation throws before `fetch`. |
| Backend route patterns discovered | 34 | Express routes mounted in `backend/src/app.js`. |
| Exact frontend/backend path matches at runtime | 0 | Frontend omits the backend `/api` prefix. |
| Semantic matches after accounting for `/api` | 8 | Assets list/detail, blocks list, maintenance list/detail/create/update, and trains list; some are unused or only contract-level matches. |
| Frontend contracts with no backend route | 8 concrete paths | Analytics, block writes, planning recommendation/horizons, and timetable path; plus generation contract not wired. |
| Mock-only feature areas | 8 | Auth, admin, field history/defects, department officer, divisional approvals, operations secondary data, and multiple planning views. |
| Unverified backend status | 0 for sibling repo | A backend repository is accessible and was inspected; runtime tunnel availability was not tested. |
