import { DetailDrawer } from '../../components/common/DetailDrawer'
import { DepartmentBadge } from '../../components/common/DepartmentBadge'
import { PriorityBadge } from '../../components/common/PriorityBadge'
import { StatusBadge } from '../../components/common/StatusBadge'

export function DepartmentTaskDrawer({ task, onClose }) { if (!task) return null; return <DetailDrawer open={Boolean(task)} title={`Task ${task.id}`} onClose={onClose}><div className="detail-title-block"><p className="eyebrow">DEPARTMENT TASK</p><h3>{task.asset}</h3><span>{task.assetCode} · {task.section}</span></div><div className="detail-badges"><PriorityBadge value={task.priority} /><PriorityBadge value={task.severity} /><PriorityBadge value={task.criticality} /><StatusBadge tone={task.status === 'Overdue' ? 'critical' : 'low'}>{task.status}</StatusBadge></div><dl className="detail-list"><div><dt>Department</dt><dd><DepartmentBadge department={task.department} /></dd></div><div><dt>Due date</dt><dd>{task.dueDate}</dd></div><div><dt>Overdue</dt><dd>{task.status === 'Overdue' ? 'Yes' : 'No'}</dd></div></dl></DetailDrawer> }
