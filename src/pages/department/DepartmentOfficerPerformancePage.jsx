import { AlertPanel } from '../../components/common/AlertPanel'
import { DataTable } from '../../components/common/DataTable'
import { DepartmentBadge } from '../../components/common/DepartmentBadge'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useDepartmentOfficerWorkspace } from '../../hooks/useDepartmentOfficerWorkspace'

export function DepartmentOfficerPerformancePage() { const { performance, isMock } = useDepartmentOfficerWorkspace(); const columns = [{ key: 'department', label: 'Department', render: (row) => <DepartmentBadge department={row.department} /> }, { key: 'tasks', label: 'Tasks' }, { key: 'critical', label: 'Critical' }, { key: 'overdue', label: 'Overdue' }, { key: 'completion', label: 'Completion' }, { key: 'readiness', label: 'Readiness', render: (row) => <StatusBadge tone={row.readiness === 'Review required' ? 'high' : 'low'}>{row.readiness}</StatusBadge> }]; return <><PageHeader eyebrow="DEPARTMENT DECISION DESK / PERFORMANCE" title="Department performance" description="Compare planner readiness and overdue work before making department-level decisions." /><AlertPanel tone="info" title={isMock ? 'Prototype performance data' : 'Performance data'} description={isMock ? 'Completion values are not fabricated and remain unavailable until backend performance fields are connected.' : 'Values are supplied by the backend.'} /><DataTable columns={columns} rows={performance} emptyMessage="No department performance data returned." /></> }
