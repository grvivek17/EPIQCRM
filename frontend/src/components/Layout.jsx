import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, CreditCard, LogOut } from 'lucide-react'

import EpiqLogo from './EpiqLogo'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',     icon: Users,           label: 'Clients'   },
  { to: '/rate-cards',  icon: CreditCard,      label: 'Rate Cards'},
  { to: '/invoices',    icon: FileText,        label: 'Invoices'  },
]

const pageTitles = {
  '/dashboard':  'Dashboard',
  '/clients':    'Clients',
  '/rate-cards': 'Rate Cards',
  '/invoices':   'Invoices',
}

export default function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[pathname] || 'CRM'

  const handleLogout = () => {
    localStorage.removeItem('auth')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <EpiqLogo size={36} />
          <span style={{ marginLeft: 8, fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px', color: '#ffffff' }}>EPIQ INDIA</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="user-avatar" style={{ background: 'var(--primary)' }}>S</div>
              <div>
                <div className="user-name">Santhosh</div>
                <div className="user-role">Super Admin</div>
              </div>
            </div>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              onClick={handleLogout} 
              title="Logout"
              style={{ padding: 6, color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{title}</h1>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
