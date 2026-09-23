import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { AdminSourceBanner } from '../../components/admin/AdminSourceBanner'
import { ApprovalCard } from '../../components/common/ApprovalCard'
import { DetailDrawer } from '../../components/common/DetailDrawer'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useDepartmentOfficerWorkspace } from '../../hooks/useDepartmentOfficerWorkspace'

export function DepartmentOfficerRequestsPage() { const { requests, isMock } = useDepartmentOfficerWorkspace(); const [selected, setSelected] = useState(null); return <><PageHeader eyebrow="DEPARTMENT DECISION DESK / REQUESTS" title="Requests for review" description="Review maintenance block requests submitted by department planners before they move to operations." actions={<StatusBadge tone="demo">Prototype data</StatusBadge>} />{isMock && <AdminSourceBanner />}{requests.map((request) => <div className="officer-request-card" key={request.id}><ApprovalCard title={request.title} requestId={request.id} department={request.department} priority={request.priority} submittedAt={request.submittedAt} status={request.status} onReview={() => setSelected(request)} /></div>)}<DetailDrawer open={Boolean(selected)} title={selected?.id ?? 'Request details'} onClose={() => setSelected(null)}>{selected && <dl className="detail-list"><div><dt>Request</dt><dd>{selected.title}</dd></div><div><dt>Department</dt><dd>{selected.department}</dd></div><div><dt>Section</dt><dd>{selected.section}</dd></div><div><dt>Submitted by</dt><dd>{selected.submittedBy}</dd></div></dl>}</DetailDrawer></> }
