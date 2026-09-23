import { DetailDrawer } from '../../components/common/DetailDrawer'
import { DepartmentBadge } from '../../components/common/DepartmentBadge'
import { StatusBadge } from '../../components/common/StatusBadge'

export function BlockRequestDrawer({ block, onClose }) { if (!block) return null; return <DetailDrawer open={Boolean(block)} title={`Block request ${block.id}`} onClose={onClose}><div className="detail-title-block"><p className="eyebrow">MAINTENANCE BLOCK</p><h3>{block.corridor}</h3><span>{block.window}</span></div><div className="detail-badges"><DepartmentBadge department={block.department} /><StatusBadge tone={String(block.status).toLowerCase().includes('pending') ? 'high' : 'neutral'}>{block.status}</StatusBadge></div><dl className="detail-list"><div><dt>Requested work</dt><dd>{block.requestedFor}</dd></div><div><dt>Operational impact</dt><dd>{block.impact}</dd></div><div><dt>Department</dt><dd><DepartmentBadge department={block.department} /></dd></div></dl></DetailDrawer> }
