import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import RateCards from './pages/RateCards'
import Invoices from './pages/Invoices'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="rate-cards" element={<RateCards />} />
        <Route path="invoices" element={<Invoices />} />
      </Route>
    </Routes>
  )
}
