import { ListFilter, RotateCcw } from 'lucide-react'

export function FilterBar({ children, onReset }) { return <div className="filter-bar"><div className="filter-label"><ListFilter size={15} /> Filters</div><div className="filter-controls">{children}</div>{onReset && <button className="reset-button" type="button" onClick={onReset}><RotateCcw size={14} /> Reset</button>}</div> }
