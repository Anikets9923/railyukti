# Frontend API Documentation

All responses use the existing format:

```json
{ "success": true, "message": "...", "data": {} }
```

## Failure Risk

### `GET /api/failure-risk`

Lists failure-risk records. Supports `page`, `limit`, and `riskLevel` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### `GET /api/failure-risk/:id`

Returns one failure-risk record by Prisma ID.

### `GET /api/assets/:id/failure-risk`

Returns failure-risk records for an asset.

### `GET /api/maintenance/:id/failure-risk`

Returns failure-risk records for a maintenance task.

Example item:

```json
{
  "failureRiskCode": "FR-0001",
  "riskScore": 87,
  "riskLevel": "HIGH",
  "failureProbability": 0.78,
  "impactScore": 5,
  "daysToExpectedFailure": 12
}
```

## Spare Availability

### `GET /api/spares`

Lists spare records. Supports `page`, `limit`, and `status` (`AVAILABLE`, `PARTIAL`, `NOT_AVAILABLE`).

### `GET /api/spares/:id`

Returns one spare-availability record by Prisma ID.

### `GET /api/assets/:id/spares`

Returns spare records for an asset.

### `GET /api/maintenance/:id/spares`

Returns spare records for a maintenance task.

## Technician Availability

### `GET /api/technicians/availability`

Lists technician availability records. Supports `page`, `limit`, and `status` (`AVAILABLE`, `PARTIAL`, `UNAVAILABLE`).

### `GET /api/technicians/availability/:id`

Returns one technician availability record by Prisma ID.

### `GET /api/maintenance/:id/technician-availability`

Returns technician availability records for a maintenance task.

## Planning

`POST /api/planning/generate` now collects failure risk, spare availability, and technician availability for each candidate maintenance task. Failure risk is passed to the AI adapter as additional priority features. Spare and technician values are used as prototype feasibility constraints. The mock AI and prototype optimizer remain active; these are synthetic decision-support inputs, not railway operational control.

Errors use the existing centralized response format and return `400`, `404`, or `5xx` status codes as appropriate.
