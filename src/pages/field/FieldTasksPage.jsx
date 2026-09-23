import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { FilterBar } from '../../components/common/FilterBar'
import { StatusBadge } from '../../components/common/StatusBadge'
import { AlertPanel } from '../../components/common/AlertPanel'
import { useFieldWorkspace } from '../../hooks/useFieldWorkspace'
import { FieldTaskTable } from '../../components/maintenance/FieldTaskTable'
import { FieldTaskDrawer } from './FieldTaskDrawer'
import { fieldValue } from '../../utils/fieldFormatters'

export function FieldTasksPage() { const { tasks, loading, error, isMock, refresh, updateTask } = useFieldWorkspace(); const [search, setSearch] = useState(''); const [status, setStatus] = useState('ALL'); const [selectedTask, setSelectedTask] = useState(null); const filtered = tasks.filter((task) => `${fieldValue(task, 'id', 'taskId')} ${fieldValue(task, 'asset')} ${fieldValue(task, 'section')}`.toLowerCase().includes(search.toLowerCase())).filter((task) => status === 'ALL' || fieldValue(task, 'status').toUpperCase() === status)
  async function handleStatusUpdate(task, nextStatus) { if (isMock) return; await updateTask(fieldValue(task, 'id', 'taskId'), { status: nextStatus }); refresh() }
  return <><PageHeader eyebrow="FIELD OPERATIONS / WORKLIST" title="My tasks" description="Review assigned maintenance work and update status from the field." actions={<StatusBadge tone={isMock ? 'demo' : 'low'}>{isMock ? 'Demo data' : 'Live API'}</StatusBadge>} />{error && !isMock && <AlertPanel tone="warning" title="Task data could not be loaded" description={error.message} action={<button className="text-button" onClick={refresh}>Retry</button>} />}<FilterBar onReset={() => { setSearch(''); setStatus('ALL') }}><SearchInput value={search} onChange={setSearch} placeholder="Search task, asset or section" /><select className="filter-control" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="ASSIGNED">Assigned</option><option value="IN PROGRESS">In progress</option><option value="OVERDUE">Overdue</option><option value="COMPLETED">Completed</option></select></FilterBar>{loading ? <div className="state-panel">Loading assigned tasks...</div> : <FieldTaskTable tasks={filtered} onSelect={setSelectedTask} />}{selectedTask && <FieldTaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} onStatusUpdate={handleStatusUpdate} />}</> }
