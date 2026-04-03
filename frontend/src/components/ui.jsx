export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

export function LoadingSpinner() {
  return <div className="loading-spinner"><div className="spinner" /></div>
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="search-input-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
      />
    </div>
  )
}

export function formatCurrency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
