import { AlertCircle, RefreshCw } from 'lucide-react'

export function ErrorState({ title = 'Unable to load data', description = 'Check the connection and try again.', onRetry }) { return <div className="state-panel error-state" role="alert"><div className="state-icon"><AlertCircle size={22} /></div><h3>{title}</h3><p>{description}</p>{onRetry && <button className="secondary-button" type="button" onClick={onRetry}><RefreshCw size={15} /> Try again</button>}</div> }
