import { ArrowUpRight } from 'lucide-react'
import { DataTable } from '../common/DataTable'
import { PriorityBadge } from '../common/PriorityBadge'
import { StatusBadge } from '../common/StatusBadge'
import { fieldValue } from '../../utils/fieldFormatters'

export function FieldTaskTable({ tasks, onSelect, emptyMessage = 'No assigned maintenance tasks.' }) {
  const columns = [
    { key: 'id', label: 'Task ID', render: (row) => <strong className="table-primary">{fieldValue(row, 'id', 'taskId')}</strong> },
    { key: 'asset', label: 'Asset', render: (row) => <><strong className="table-primary">{fieldValue(row, 'asset')}</strong><span className="table-secondary">{fieldValue(row, 'assetCode')}</span></> },
    { key: 'section', label: 'Section', render: (row) => fieldValue(row, 'section') },
    { key: 'priority', label: 'Priority', render: (row) => <PriorityBadge value={fieldValue(row, 'priority')} /> },
    { key: 'severity', label: 'Severity', render: (row) => <PriorityBadge value={fieldValue(row, 'severity')} /> },
    { key: 'dueDate', label: 'Due date', render: (row) => fieldValue(row, 'dueDate', 'due') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge tone={String(fieldValue(row, 'status')).toLowerCase().includes('overdue') ? 'critical' : 'low'}>{fieldValue(row, 'status')}</StatusBadge> },
    { key: 'action', label: 'Action', render: (row) => <button className="row-action" aria-label={`Open task ${fieldValue(row, 'id', 'taskId')}`} onClick={() => onSelect?.(row)}><ArrowUpRight size={16} /></button> },
  ]
  return <FieldTaskTableFrame columns={columns} tasks={tasks} emptyMessage={emptyMessage} />
}
function FieldTaskTableFrame({ columns, tasks, emptyMessage }) { return <DataTable columns={columns} rows={tasks} rowKey="id" emptyMessage={emptyMessage} /> }
