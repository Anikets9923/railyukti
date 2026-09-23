import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { StatusBadge } from '../../components/common/StatusBadge'
import { AlertPanel } from '../../components/common/AlertPanel'
import { useFieldWorkspace } from '../../hooks/useFieldWorkspace'

export function FieldHistoryPage() { const { history, loading, error, isMock, refresh } = useFieldWorkspace(); const columns = [{ key: 'date', label: 'Date' }, { key: 'taskId', label: 'Task ID' }, { key: 'asset', label: 'Asset' }, { key: 'action', label: 'Maintenance action' }, { key: 'technician', label: 'Updated by' }, { key: 'status', label: 'Status', render: (row) => <StatusBadge tone="low">{row.status}</StatusBadge> }]
  return <><PageHeader eyebrow="FIELD OPERATIONS / HISTORY" title="Maintenance history" description="Review recently completed work and past maintenance actions." actions={<StatusBadge tone={isMock ? 'demo' : 'low'}>{isMock ? 'Demo data' : 'Live API'}</StatusBadge>} />{error && !isMock && <AlertPanel tone="warning" title="History data could not be loaded" description={error.message} action={<button className="text-button" onClick={refresh}>Retry</button>} />}{loading ? <div className="state-panel">Loading maintenance history...</div> : <DataTable columns={columns} rows={history} emptyMessage="No maintenance history is available." />}</> }
