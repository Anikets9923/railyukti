import { Inbox } from 'lucide-react'

export function EmptyState({ title = 'Nothing here yet', description, action }) { return <div className="state-panel empty-state"><div className="state-icon"><Inbox size={22} /></div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div> }
