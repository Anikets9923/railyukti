import { AlertTriangle, Info, XCircle } from 'lucide-react'

const icons = { warning: AlertTriangle, info: Info, critical: XCircle }
export function AlertPanel({ title, description, tone = 'warning', action }) { const Icon = icons[tone] ?? Info; return <section className={`alert-panel alert-${tone}`}><Icon size={19} /><div><strong>{title}</strong><p>{description}</p></div>{action}</section> }
