import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import RateCards from './pages/RateCards'
import Invoices from './pages/Invoices'
import Login from './pages/Login'

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('auth') === 'true'
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="rate-cards" element={<RateCards />} />
        <Route path="invoices" element={<Invoices />} />
      </Route>
    </Routes>
  )
}
