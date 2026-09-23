import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useAuth } from './auth/useAuth'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { FoundationState } from './components/dashboard/FoundationState'
import { LoginPage } from './pages/auth/LoginPage'
import { ROUTES, getDashboardPath } from './routes/routeConfig'

function DashboardRedirect() {
  const { isAuthenticated, session } = useAuth()
  return <Navigate to={isAuthenticated ? getDashboardPath(session.role) : '/login'} replace />
}

function LoginRoute() {
  const { isAuthenticated, session } = useAuth()
  return isAuthenticated ? <Navigate to={getDashboardPath(session.role)} replace /> : <LoginPage />
}

function PlaceholderPage({ title }) {
  return <FoundationState title={title} description="This role-specific route is ready for backend-connected workflow content. Detailed dashboard and domain UI will be added in the next implementation phase." />
}

function RouteContent({ routeConfig }) {
  const Page = routeConfig.component
  return Page ? <Page /> : <PlaceholderPage title={routeConfig.title} />
}

function ProtectedWorkspace({ routeConfig }) {
  return <ProtectedRoute routeConfig={routeConfig}><AppLayout><RouteContent routeConfig={routeConfig} /></AppLayout></ProtectedRoute>
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/" element={<DashboardRedirect />} />
    {ROUTES.map((routeConfig) => <Route key={routeConfig.path} path={routeConfig.path} element={<ProtectedWorkspace routeConfig={routeConfig} />} />)}
    <Route path="*" element={<DashboardRedirect />} />
  </Routes>
}

