import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout({ children }) {
  const { session } = useAuth(); const [open, setOpen] = useState(false)
  return <div className="app-shell"><Sidebar session={session} open={open} onClose={() => setOpen(false)} /><main className="main-content"><Header onOpenMenu={() => setOpen(true)} /><section className="content-wrap">{children}</section></main></div>
}
