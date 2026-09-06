# Dataset Import

## Source and command

The importer reads the root-level `../dataset/` directory relative to `backend/`. Override the source directory with `DATASET_PATH`.

```bash
npm run db:import-dataset
```

`npm run seed:dataset` remains available as an alias. The importer is additive and idempotent. It never resets, deletes, or truncates application data.

The source counts are:

- Assets: 60
- Defects: 120
- Maintenance: 90
- Trains: 36
- Blocks: 30
- Planning reference records: 60
- Analytics snapshot: 1

## Central mapping configuration

All synthetic relationships are defined in [seed/dataset-mapping.js](../seed/dataset-mapping.js).

| City | Department | Section |
|---|---|---|
| Mumbai | ENG | SEC-A1 |
| Pune | ENG | SEC-A1 |
| Delhi | TRD | SEC-B1 |
| Howrah | TRD | SEC-B1 |
| Ernakulam | SNT | SEC-C1 |
| Bangalore | SNT | SEC-D1 |

This is deterministic synthetic demo ownership, not real railway operational information. The importer does not infer departments from asset type or claim that these departments are operationally correct.

## Field mapping

### Assets

- `asset_id` -> `Asset.assetCode`
- `asset_type` -> `Asset.assetType`
- `criticality` -> `Asset.criticality`
- `availability_status` -> `Asset.status`
- `city` -> centralized city mapping for `departmentId` and `sectionId`
- latest valid `last_maintenance_date` for the asset -> `lastMaintenance`
- earliest valid `due_date` for the asset -> `nextMaintenance`

Asset status mapping:

- `AVAILABLE` -> `ACTIVE`
- `OUT_OF_SERVICE` -> `INACTIVE`
- `MAINTENANCE_DUE` -> `UNDER_MAINTENANCE`

### Defects

- `defect_id` -> `Defect.defectCode`
- `asset_id` -> `Asset.id` resolved by `Asset.assetCode`
- `reported_date` -> `detectedAt`
- `severity` -> `Defect.severity`
- `status` -> `Defect.status`
- `description` -> `Defect.description`
- deterministic `MOCK_DATASET` -> `sourceSystem`

### Maintenance tasks

- `maintenance_id` -> `MaintenanceTask.taskCode`
- `asset_id` -> `Asset.id`
- `city` -> centralized department and section mapping
- `schedule_type` -> `taskType`
- `priority` -> `priorityScore` using `CRITICAL=95`, `HIGH=80`, `MEDIUM=60`, `LOW=30`
- matching `planning.priority_score` -> priority-score override
- `due_date` -> `dueDate`
- `days_overdue` -> `overdueDays`
- `duration_hours * 60` -> `estimatedDuration`

Priority is not treated as severity. The source has no severity field, but Prisma requires one, so the importer uses and logs the neutral deterministic fallback:

```text
MaintenanceTask.severity = MEDIUM
```

Other deterministic required defaults:

```text
MaintenanceTask.description = "Imported from mock dataset"
MaintenanceTask.crewRequired = 1
```

Task type mapping:

- `Preventive` -> `PREVENTIVE`
- `POH` -> `PREVENTIVE`
- `Corrective` -> `CORRECTIVE`
- `Inspection` -> `INSPECTION`

Task status mapping:

- `IN_PROGRESS` -> `IN_PROGRESS`
- `OVERDUE` -> `PLANNED`
- `PENDING` -> `PLANNED`
- `SCHEDULED` -> `PLANNED`

### Block windows

- `city` -> centralized section mapping
- `start_datetime` date -> `BlockWindow.date`
- `start_datetime` time -> `startTime`
- `duration_hours * 60` -> `maxDuration`
- start time plus duration -> `endTime`
- `APPROVED` -> `AVAILABLE`
- `PENDING` -> `RESERVED`

`block_id` is retained only in importer logging. Since the Prisma model has no source identifier field, idempotency uses:

```text
sectionId + date + startTime + endTime
```

### Trains and generated demo schedules

Train mapping:

- `train_number` -> `Train.trainNumber`
- `train_name` -> `Train.name`
- `train_type` -> `Train.trainType`
- missing active flag -> deterministic `active=true`

The source does not contain complete schedule data. The importer therefore generates explicitly synthetic schedules using this policy:

```text
DEMO_GENERATED_SCHEDULE = true
schedule date = earliest block date for the train origin city
section = origin city mapping
arrival time = source scheduled_departure + 60 minutes
status = SCHEDULED
```

These schedules are demo data only and must not be presented as real Indian Railways timetables. `assigned_asset_ids` is ignored because the existing Prisma schema has no train-to-asset relationship.

Schedule idempotency uses:

```text
trainId + sectionId + date + arrivalTime + departureTime
```

### Planning and analytics

`planning.json` is used only for priority-score overrides. It is not converted to `BlockPlan` records because it lacks safe block start/end and section relationships.

`analytics.json` is not imported into operational tables because it is a derived snapshot.

## Reporting

The importer prints source, imported, updated, skipped, and failed counts for assets, defects, maintenance tasks, trains, schedules, and block windows. It also prints:

- generated defaults and counts
- generated demo data and counts
- skipped reasons
- warnings and errors
- reference-only files

Invalid records are reported with source filename, record number, field, value, and reason.

## Expected counts

On a clean prototype database containing the existing 3 departments and 4 sections, the import should add:

```text
Assets: 60
Defects: 120
Maintenance tasks: 90
Trains: 36
Train schedules: 36
Block windows: 30
```

Existing application records are preserved. Current prototype data may make final totals higher. Repeating the command updates the same source records and creates no duplicates.

## Limitations

- City-to-department and city-to-section relationships are synthetic demo mappings.
- Generated train schedules are not source schedules or real operational data.
- No train-to-asset relationship is created.
- No Prisma schema changes are required.
- Planning and analytics source files remain non-operational reference data.
