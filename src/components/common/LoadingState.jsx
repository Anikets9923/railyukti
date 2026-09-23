export function LoadingState({ label = 'Loading operational data...' }) { return <div className="state-panel loading-state" role="status"><span className="loading-spinner" /><p>{label}</p></div> }
