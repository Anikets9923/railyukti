import { Search, X } from 'lucide-react'

export function SearchInput({ value, onChange, placeholder = 'Search records', label = 'Search' }) { return <label className="search-input"><span className="sr-only">{label}</span><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button type="button" aria-label="Clear search" onClick={() => onChange('')}><X size={14} /></button></label> }
