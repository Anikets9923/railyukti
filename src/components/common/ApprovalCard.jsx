import { ArrowRight, CheckCircle2, Clock3 } from 'lucide-react'
import { DepartmentBadge } from './DepartmentBadge'
import { PriorityBadge } from './PriorityBadge'

export function ApprovalCard({ title, requestId, department, priority = 'Medium', submittedAt, status = 'Pending review', onReview }) { return <article className="approval-card"><div className="approval-card-head"><div><span className="muted-label">{requestId}</span><h3>{title}</h3></div><PriorityBadge value={priority} /></div><div className="approval-card-meta"><DepartmentBadge department={department} /><span><Clock3 size={13} /> {submittedAt}</span><span className="approval-status"><CheckCircle2 size={13} /> {status}</span></div>{onReview && <button className="text-button" onClick={onReview}>Review request <ArrowRight size={15} /></button>}</article> }
