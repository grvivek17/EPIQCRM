import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, invoicesApi } from '../services/api'
import { LoadingSpinner, StatusBadge, formatCurrency, formatDate } from '../components/ui'
import { Users, FileText, DollarSign, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      invoicesApi.list({ limit: 6 }),
    ]).then(([s, inv]) => {
      setStats(s)
      setRecentInvoices(inv.slice(0, 6))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const chartData = [
    { name: 'Paid',    value: stats.total_paid,  color: '#22c55e' },
    { name: 'Due',     value: Math.max(0, stats.total_due - (stats.overdue_count > 0 ? stats.total_due * 0.3 : 0)), color: '#f59e0b' },
    { name: 'Overdue', value: stats.overdue_count > 0 ? stats.total_due * 0.3 : 0, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const statCards = [
    { label: 'Total Clients',   value: stats.total_clients,               icon: Users,         color: 'blue',   sub: 'Active accounts'        },
    { label: 'Total Invoices',  value: stats.total_invoices,              icon: FileText,      color: 'purple', sub: 'All time'                },
    { label: 'Revenue Collected',value: formatCurrency(stats.total_paid), icon: DollarSign,    color: 'green',  sub: 'Paid invoices'           },
    { label: 'Pending / Overdue',value: formatCurrency(stats.total_due),  icon: AlertTriangle, color: 'orange', sub: `${stats.overdue_count} overdue` },
  ]

  return (
    <>
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-sub">{sub}</div>
            <div className="stat-icon"><Icon /></div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Recent Invoices</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')}>View All →</button>
          </div>
          <div className="recent-list">
            {recentInvoices.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '24px 0', textAlign: 'center' }}>No invoices yet.</p>
            )}
            {recentInvoices.map(inv => (
              <div key={inv.id} className="recent-item">
                <div className="recent-item-left">
                  <span className="recent-item-num">{inv.invoice_number}</span>
                  <span className="recent-item-client">{inv.client?.name || '—'} · Due {formatDate(inv.due_date)}</span>
                </div>
                <div className="recent-item-right">
                  <span className="recent-item-amount">{formatCurrency(inv.total)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Payment Overview</h2></div>
          {chartData.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '48px 0' }}>No invoice data yet.</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: '#1a1a28', border: '1px solid #ffffff18', borderRadius: 10, color: '#e8e8f0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>
    </>
  )
}
