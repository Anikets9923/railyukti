import { CalendarDays } from 'lucide-react'
import { AlertPanel } from '../../components/common/AlertPanel'
import { DepartmentBadge } from '../../components/common/DepartmentBadge'
import { PageHeader } from '../../components/common/PageHeader'
import { ProgressIndicator } from '../../components/common/ProgressIndicator'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useDepartmentWorkspace } from '../../hooks/useDepartmentWorkspace'

export function DepartmentPlanPage() { const { plan, department, isMock, error, refresh } = useDepartmentWorkspace(); return <><PageHeader eyebrow={`${department} / PLANNING`} title="Department maintenance plan" description="Proposed work grouped by date and section for department review." actions={<StatusBadge tone={isMock ? 'demo' : 'low'}>{isMock ? 'Demo plan' : 'Backend plan'}</StatusBadge>} />{error && !isMock && <AlertPanel tone="warning" title="Plan data unavailable" description={error.message} action={<button className="text-button" onClick={refresh}>Retry</button>} />}<div className="plan-list">{plan.length ? plan.map((item) => <article className="plan-card" key={item.id}><div className="plan-card-date"><CalendarDays size={16} /><strong>{item.date}</strong></div><div className="plan-card-main"><div><p className="eyebrow">SECTION</p><h2>{item.section}</h2><span>{item.tasks} proposed task{item.tasks === 1 ? '' : 's'}</span></div><DepartmentBadge department={department} /></div><div className="plan-card-progress"><ProgressIndicator value={item.status === 'Proposed' ? 65 : 25} label="Plan readiness" detail={item.status} /></div></article>) : <div className="state-panel">No proposed maintenance plan is available.</div>}</div></> }
