import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Download } from 'lucide-react'
import { rateCardsApi, clientsApi } from '../services/api'
import { LoadingSpinner, formatCurrency } from '../components/ui'
import Modal from '../components/Modal'

export default function RateCards() {
  const [activeTab, setActiveTab] = useState('default')
  const [selectedClient, setSelectedClient] = useState('')
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    clientsApi.list().then(setClients)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [activeTab, selectedClient])

  const fetchItems = () => {
    setLoading(true)
    if (activeTab === 'default') {
      rateCardsApi.listDefault().then(setItems).finally(() => setLoading(false))
    } else {
      if (selectedClient) {
        rateCardsApi.listClient(selectedClient).then(setItems).finally(() => setLoading(false))
      } else {
        setItems([])
        setLoading(false)
      }
    }
  }

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, rate: parseFloat(data.rate) }
      if (activeTab === 'default') {
        if (editingItem) await rateCardsApi.updateDefault(editingItem.id, payload)
        else await rateCardsApi.createDefault(payload)
      } else {
        if (!selectedClient) return toast.error('Select client first')
        payload.client_id = parseInt(selectedClient)
        if (editingItem) await rateCardsApi.updateClient(editingItem.id, payload)
        else await rateCardsApi.createClient(payload)
      }
      toast.success('Service saved')
      setModalOpen(false)
      fetchItems()
    } catch (e) { toast.error('Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete service?')) return
    try {
      if (activeTab === 'default') await rateCardsApi.deleteDefault(id)
      else await rateCardsApi.deleteClient(id)
      toast.success('Deleted')
      fetchItems()
    } catch (e) { toast.error('Failed') }
  }

  const openAdd = () => { 
    if (activeTab === 'client' && !selectedClient) return toast.error('Select a client first')
    setEditingItem(null); reset({ unit: 'per month', category: 'General' }); setModalOpen(true) 
  }
  const openEdit = (item) => { setEditingItem(item); reset(item); setModalOpen(true) }

  const exportToCSV = async () => {
    try {
      setLoading(true)
      const allClients = await clientsApi.list()
      const rowData = [["Client Name", "SPOC", "Service / Role", "Category", "Unit", "Rate"]]
      
      const defaultRates = await rateCardsApi.listDefault()
      defaultRates.forEach(r => rowData.push(['Default', '-', r.name, r.category, r.unit, r.rate]))
      
      for (const client of allClients) {
        const clientRates = await rateCardsApi.listClient(client.id)
        if (clientRates.length > 0) {
          clientRates.forEach(r => rowData.push([client.name, client.spoc_name, r.name, r.category, r.unit, r.rate]))
        }
      }
      
      const csvContent = rowData.map(e => e.map(item => `"${(item||'').toString().replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", "rate_cards_mapping.csv")
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      toast.error('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-toolbar">
        <div className="rate-tabs">
          <button className={`rate-tab ${activeTab === 'default' ? 'active' : ''}`} onClick={() => { setActiveTab('default'); setSelectedClient('') }}>Default Rate Card</button>
          <button className={`rate-tab ${activeTab === 'client' ? 'active' : ''}`} onClick={() => setActiveTab('client')}>Client Specific</button>
        </div>
        
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          {activeTab === 'client' && (
            <select className="filter-select" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
              <option value="">-- Select Client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={14}/> Export CSV
          </button>

          <button className="btn btn-primary" onClick={openAdd} disabled={activeTab === 'client' && !selectedClient}>
            <Plus size={16} /> Add Service
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <div className="table-wrap">
            <table className="rate-table">
              <thead>
                <tr>
                  <th>Service / Role</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Rate</th>
                  <th width="80">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No rate card items found.</td></tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><span className="category-chip">{item.category}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.unit}</td>
                    <td className="td-amount">{formatCurrency(item.rate)}</td>
                    <td>
                      <div className="client-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(item)}><Edit2 size={14}/></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(item.id)} style={{color:'var(--danger)'}}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          <div className="form-group form-full">
            <label>Service / Role Name *</label>
            <input className="form-control" {...register('name', { required: true })} />
          </div>
          <div className="form-group">
            <label>Rate (₹) *</label>
            <input type="number" step="0.01" className="form-control" {...register('rate', { required: true })} />
          </div>
          <div className="form-group">
            <label>Billing Unit</label>
            <input className="form-control" {...register('unit')} />
          </div>
          <div className="form-group form-full">
            <label>Category</label>
            <input className="form-control" {...register('category')} />
          </div>
          <div className="form-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Item</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
