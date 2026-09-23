import { AlertTriangle } from 'lucide-react'
import { AlertPanel } from '../../components/common/AlertPanel'
import { DataTable } from '../../components/common/DataTable'
import { PageHeader } from '../../components/common/PageHeader'
import { PriorityBadge } from '../../components/common/PriorityBadge'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useOperationsWorkspace } from '../../hooks/useOperationsWorkspace'
import { BlockDetailsDrawer } from './BlockDetailsDrawer'
import { useState } from 'react'

export function OperationsConflictsPage() { const { conflicts, blocks, isMock, error, refresh } = useOperationsWorkspace(); const [selected, setSelected] = useState(null); const columns = [{ key: 'severity', label: 'Severity', render: (row) => <PriorityBadge value={row.severity} /> }, { key: 'section', label: 'Section' }, { key: 'blockId', label: 'Proposed block' }, { key: 'trainNumber', label: 'Train movement' }, { key: 'window', label: 'Window' }, { key: 'issue', label: 'Conflict' }, { key: 'action', label: 'Suggested action', render: (row) => <span className="table-secondary">{row.action}</span> }, { key: 'details', label: 'Details', render: (row) => <button className="text-button" onClick={() => setSelected(blocks.find((block) => block.id === row.blockId))}>Review</button> }]
  return <><PageHeader eyebrow="OPERATING / CONFLICT CENTER" title="Operational conflicts" description="Resolve clashes between proposed maintenance blocks and scheduled train movements." actions={<StatusBadge tone={isMock ? 'demo' : 'low'}>{isMock ? 'Demo conflicts' : 'Backend conflicts'}</StatusBadge>} />{isMock && <AlertPanel tone="warning" title={`${conflicts.length} conflicts need review`} description="These demo conflicts show where proposed work overlaps or reduces the operating margin around a train movement." action={<AlertTriangle size={18} />} />}{error && !isMock && <AlertPanel tone="warning" title="Conflict data unavailable" description={error.message} action={<button className="text-button" onClick={refresh}>Retry</button>} />}<DataTable columns={columns} rows={conflicts} emptyMessage="No operational conflicts returned." /><BlockDetailsDrawer block={selected} onClose={() => setSelected(null)} /></> }
