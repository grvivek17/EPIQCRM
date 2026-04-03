import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Building2, MapPin, Phone, Mail, Edit2, Trash2, Upload } from 'lucide-react'
import { clientsApi, statesApi } from '../services/api'
import { LoadingSpinner, EmptyState, SearchInput } from '../components/ui'
import Modal from '../components/Modal'
import * as XLSX from 'xlsx'
import { useRef } from 'react'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchClients = () => {
    setLoading(true)
    Promise.all([clientsApi.list(), statesApi.list()])
      .then(([c, s]) => { setClients(c); setStates(s) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchClients() }, [])

  const onSubmit = async (data) => {
    try {
      if (editingClient) {
        await clientsApi.update(editingClient.id, data)
        toast.success('Client updated')
      } else {
        await clientsApi.create(data)
        toast.success('Client created')
      }
      setModalOpen(false)
      fetchClients()
    } catch (e) {
      toast.error('Failed to save client')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this client?')) {
      try {
        await clientsApi.delete(id)
        toast.success('Client deleted')
        fetchClients()
      } catch (e) {
        toast.error('Failed to delete')
      }
    }
  }

  const openAdd = () => { setEditingClient(null); reset({}); setModalOpen(true) }
  const openEdit = (client) => { setEditingClient(client); reset(client); setModalOpen(true) }

  const fileInputRef = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        setLoading(true)
        const data = evt.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        let successCount = 0
        let failCount = 0
        for (const row of json) {
          const payload = {
            name: row['Company Name'] || row['name'] || row['Client Name'],
            spoc_name: row['SPOC Name'] || row['spoc_name'] || row['SPOC'],
            email: row['Email'] || row['email'],
            phone: (row['Phone'] || row['phone'] || '').toString(),
            gst_number: row['GST Number'] || row['gst_number'] || row['GST'] || '',
            state: row['State'] || row['state'] || '',
            address: row['Address'] || row['address'] || ''
          }
          if (payload.name && payload.spoc_name && payload.email) {
            try {
              await clientsApi.create(payload)
              successCount++
            } catch(e) {
              failCount++
            }
          } else {
            failCount++
          }
        }
        toast.success(`Imported: ${successCount}. Failed/Skipped: ${failCount}.`)
        fetchClients()
      } catch (err) {
        toast.error('Failed to parse excel file')
        setLoading(false)
      }
      e.target.value = ''
    }
    reader.readAsBinaryString(file)
  }

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.spoc_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="page-toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Excel
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title="No clients found" description="Add your first client to get started." />
      ) : (
        <div className="clients-grid">
          {filtered.map(client => (
            <div key={client.id} className="client-card">
              <div className="client-card-header">
                <div className="client-avatar">{client.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="client-name">{client.name}</div>
                  <div className="client-spoc">SPOC: {client.spoc_name}</div>
                </div>
              </div>
              <div className="client-meta">
                <div className="client-meta-row"><Mail /><a href={`mailto:${client.email}`} style={{color:'inherit'}}>{client.email}</a></div>
                {client.phone && <div className="client-meta-row"><Phone />{client.phone}</div>}
                {client.state && <div className="client-meta-row"><MapPin />{client.state}</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12 }}>
                {client.gst_number ? <span className="client-gst">GST: {client.gst_number}</span> : <span />}
                <div className="client-actions">
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(client)}><Edit2 size={14}/></button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(client.id)} style={{color:'var(--danger)'}}><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingClient ? 'Edit Client' : 'New Client'} size="modal-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          <div className="form-group form-full">
            <label>Company Name *</label>
            <input className="form-control" {...register('name', { required: true })} />
          </div>
          <div className="form-group">
            <label>SPOC Name *</label>
            <input className="form-control" {...register('spoc_name', { required: true })} />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" className="form-control" {...register('email', { required: true })} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" {...register('phone')} />
          </div>
          <div className="form-group">
            <label>GST Number</label>
            <input className="form-control" {...register('gst_number')} />
          </div>
          <div className="form-group">
            <label>State (for GST calc)</label>
            <select className="form-control" {...register('state')}>
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group form-full">
            <label>Address</label>
            <textarea className="form-control" {...register('address')} rows={2} />
          </div>
          <div className="form-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Client</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
