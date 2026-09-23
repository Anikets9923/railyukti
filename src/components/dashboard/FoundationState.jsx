import { ArrowUpRight, Construction } from 'lucide-react'

export function FoundationState({ title, description }) { return <div className="foundation-state"><div className="foundation-icon"><Construction size={25} /></div><p className="eyebrow">FOUNDATION READY</p><h1>{title}</h1><p>{description}</p><button className="primary-button">Open workspace <ArrowUpRight size={16} /></button></div> }
