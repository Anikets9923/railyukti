import { AlertPanel } from '../../components/common/AlertPanel'
import { DataTable } from '../../components/common/DataTable'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useOperationsWorkspace } from '../../hooks/useOperationsWorkspace'

export function OperationsTimetablePage() { const { trains, isMock, error, refresh } = useOperationsWorkspace(); const columns = [{ key: 'trainNumber', label: 'Train number' }, { key: 'section', label: 'Section' }, { key: 'date', label: 'Date' }, { key: 'arrival', label: 'Arrival' }, { key: 'departure', label: 'Departure' }, { key: 'direction', label: 'Direction' }, { key: 'state', label: 'State', render: (row) => <StatusBadge tone={row.state === 'Delayed' ? 'high' : 'low'}>{row.state}</StatusBadge> }]
  return <><PageHeader eyebrow="OPERATING / TIMETABLE" title="Train timetable" description="Review movement paths before confirming any maintenance window." actions={<StatusBadge tone={isMock ? 'demo' : 'low'}>{isMock ? 'Demo timetable' : 'Backend timetable'}</StatusBadge>} />{error && !isMock && <AlertPanel tone="warning" title="Timetable unavailable" description={error.message} action={<button className="text-button" onClick={refresh}>Retry</button>} />}<DataTable columns={columns} rows={trains} emptyMessage="No timetable movements returned." /></> }
