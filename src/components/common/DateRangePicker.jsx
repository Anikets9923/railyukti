import { CalendarDays } from 'lucide-react'

export function DateRangePicker({ from, to, onChange }) { return <div className="date-range-picker"><CalendarDays size={15} /><label><span>From</span><input type="date" value={from} onChange={(event) => onChange({ from: event.target.value, to })} /></label><span className="date-range-separator">to</span><label><span>To</span><input type="date" value={to} onChange={(event) => onChange({ from, to: event.target.value })} /></label></div> }
