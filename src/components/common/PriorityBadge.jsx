import { StatusBadge } from './StatusBadge'

const toneByPriority = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' }
export function PriorityBadge({ value = 'Medium' }) { return <StatusBadge tone={toneByPriority[value.toLowerCase()] ?? 'neutral'}>{value}</StatusBadge> }
