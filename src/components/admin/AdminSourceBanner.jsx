import { AlertPanel } from '../common/AlertPanel'
export function AdminSourceBanner() { return <AlertPanel tone="info" title="Admin prototype data is active" description="Admin API contracts are not defined in the current frontend API layer. This page uses isolated mock data and will switch to backend services when contracts are available." /> }
