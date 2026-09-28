# Frontend Synthetic Persistence Dataset

These JSON files contain deterministic `DEMO` and `SYNTHETIC` records used to support the frontend contracts identified in `FRONTEND_API_ENDPOINTS.md`.

## Files

- `defect_reports.json`: additional field-supervisor defect reports. Existing `Defect` records remain the canonical defect model.
- `maintenance_history.json`: completed maintenance history entries linked to assets and optional maintenance tasks.
- `block_requests.json`: department block-request workflow records linked to departments, sections, and existing block windows where available.
- `recommendations.json`: synthetic maintenance recommendations linked to assets, tasks, and departments.
- `approval_requests.json`: synthetic approval workflow records linked to block requests.
- `department_performance.json`: weekly and monthly department performance snapshots.
- `corridors.json`: fictional corridor metadata linked to sections.
- `operational_conflicts.json`: fictional timetable/block-window conflict examples.
- `operational_alerts.json`: fictional operational alert examples linked to conflicts and corridors.
- `roles.json`: demo role catalog.
- `admin_users.json`: demo users only. These are not authenticated real users and use `.invalid` email addresses.
- `system_configuration.json`: non-operational demo configuration values.
- `audit_logs.json`: demo audit history for the synthetic records.

## Data rules and limitations

- All stable IDs are `DEMO` or `SYNTHETIC` identifiers and are safe to re-import.
- Foreign references use business keys such as asset codes, task codes, department codes, section codes, train numbers, and block-window keys. The importer resolves these to current database IDs.
- Generated records describe fictional UI/planning scenarios only. They do not represent real train movements, corridor restrictions, railway assets, safety instructions, or authenticated users.
- The importer validates references and values before writing. It never resets or deletes database records.
- Existing operational seed and dataset-import records are preserved; these files add separate records where the schema supports them.
