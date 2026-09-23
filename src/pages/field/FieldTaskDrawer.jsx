import { useState } from 'react'
import { Check, Clock3 } from 'lucide-react'
import { DetailDrawer } from '../../components/common/DetailDrawer'
import { DepartmentBadge } from '../../components/common/DepartmentBadge'
import { PriorityBadge } from '../../components/common/PriorityBadge'
import { StatusBadge } from '../../components/common/StatusBadge'
import { fieldValue } from '../../utils/fieldFormatters'

const nextStatuses = ['In progress', 'Completed']
export function FieldTaskDrawer({ task, onClose, onStatusUpdate }) {
  const [status, setStatus] = useState(task?.status ?? 'Assigned'); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('')
  if (!task) return null
  async function updateStatus(nextStatus) { setSaving(true); setMessage(''); try { await onStatusUpdate(task, nextStatus); setStatus(nextStatus); setMessage('Status update recorded for this task.') } catch (error) { setMessage(error.message ?? 'Unable to update task status.') } finally { setSaving(false) } }
  return <DetailDrawer open={Boolean(task)} title={`Task ${fieldValue(task, 'id', 'taskId')}`} onClose={onClose}><div className="detail-title-block"><p className="eyebrow">FIELD TASK</p><h3>{fieldValue(task, 'asset')}</h3><span>{fieldValue(task, 'assetCode')} · {fieldValue(task, 'section')}</span></div><div className="detail-badges"><PriorityBadge value={fieldValue(task, 'priority')} /><PriorityBadge value={fieldValue(task, 'severity')} /><StatusBadge tone={status.toLowerCase().includes('overdue') ? 'critical' : 'low'}>{status}</StatusBadge></div><dl className="detail-list"><div><dt>Task type</dt><dd>{fieldValue(task, 'type')}</dd></div><div><dt>Due date</dt><dd><Clock3 size={14} /> {fieldValue(task, 'dueDate', 'due')}</dd></div><div><dt>Department</dt><dd><DepartmentBadge department={fieldValue(task, 'department') === '—' ? 'TRD' : fieldValue(task, 'department')} /></dd></div></dl><div className="status-workflow"><p className="eyebrow">UPDATE STATUS</p>{nextStatuses.map((nextStatus) => <button key={nextStatus} className="status-action" disabled={saving || status === nextStatus} onClick={() => updateStatus(nextStatus)}><span>{status === nextStatus ? <Check size={14} /> : <i />}</span>{nextStatus}</button>)}</div>{message && <p className="inline-success">{message}</p>}</DetailDrawer>
}
