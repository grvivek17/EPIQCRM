import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Send, Download } from 'lucide-react'
import { invoicesApi, clientsApi, rateCardsApi } from '../services/api'
import { LoadingSpinner, StatusBadge, formatCurrency, formatDate } from '../components/ui'
import Modal from '../components/Modal'
import EpiqLogo from '../components/EpiqLogo'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  
  const [isModalOpen, setModalOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(null)
  
  const { register, control, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: { line_items: [{ description: '', rate: 0, quantity: 1, amount: 0, unit: 'per month' }] }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })
  
  const watchClientId = watch('client_id')
  const watchLineItems = watch('line_items')
  
  // Auto calculate line amounts and subtotal
  useEffect(() => {
    let sub = 0
    watchLineItems?.forEach((item, index) => {
      const amt = (parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0)
      if (item.amount !== amt) setValue(`line_items.${index}.amount`, amt)
      sub += amt
    })
  }, [JSON.stringify(watchLineItems), setValue])

  useEffect(() => { fetchCoreData() }, [])
  useEffect(() => { fetchInvoices() }, [statusFilter, clientFilter])

  const fetchCoreData = async () => {
    const c = await clientsApi.list()
    setClients(c)
  }

  const fetchInvoices = () => {
    setLoading(true)
    invoicesApi.list({ status: statusFilter || undefined, client_id: clientFilter || undefined })
      .then(setInvoices).finally(() => setLoading(false))
  }

  // Pre-fill rate card items when client changes
  useEffect(() => {
    if (watchClientId && isModalOpen) {
      rateCardsApi.listClient(watchClientId).then(clientItems => {
        if (clientItems.length === 0) {
          rateCardsApi.listDefault().then(defaultItems => populateLineItems(defaultItems))
        } else {
          populateLineItems(clientItems)
        }
      })
    }
  }, [watchClientId])

  const populateLineItems = (items) => {
    if (items.length > 0) {
      setValue('line_items', items.map(i => ({ description: i.name, rate: i.rate, quantity: 1, amount: i.rate, unit: i.unit })))
    }
  }

  const onSubmit = async (data) => {
    try {
      await invoicesApi.create(data)
      toast.success('Invoice created')
      setModalOpen(false)
      fetchInvoices()
    } catch(e) { toast.error('Failed to create invoice') }
  }

  const [sendingEmailId, setSendingEmailId] = useState(null)

  const handleResendEmail = async (inv) => {
    if (!inv.client?.email) {
      toast.error('Client has no email address')
      return
    }
    
    setSendingEmailId(inv.id)
    try {
      await invoicesApi.sendEmail({
        invoice_id: inv.id,
        to_email: inv.client.email,
        subject: `Invoice #${inv.invoice_number} from EPIQ INDIA`,
        message: `Please find the details for Invoice #${inv.invoice_number} attached.`
      })
      toast.success('Invoice sent to ' + inv.client.email)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send invoice email')
    } finally {
      setSendingEmailId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return
    await invoicesApi.delete(id)
    fetchInvoices()
  }

  const handleStatusChange = async (id, status) => {
    await invoicesApi.update(id, { status })
    fetchInvoices()
  }

  const [selectedInvoices, setSelectedInvoices] = useState(new Set())
  const [sendingBulk, setSendingBulk] = useState(false)

  const handleBulkEmail = async () => {
    if (selectedInvoices.size === 0) return
    setSendingBulk(true)
    let successCount = 0
    let failCount = 0
    for (const invId of selectedInvoices) {
      const inv = invoices.find(i => i.id === invId)
      if (!inv || !inv.client?.email) {
        failCount++
        continue
      }
      try {
        await invoicesApi.sendEmail({
          invoice_id: inv.id,
          to_email: inv.client.email,
          subject: `Invoice #${inv.invoice_number} from EPIQ INDIA`,
          message: `Please find the details for Invoice #${inv.invoice_number} attached.`
        })
        successCount++
      } catch (e) {
        failCount++
      }
    }
    if (failCount === 0) toast.success(`Successfully sent ${successCount} emails`)
    else toast.success(`Sent: ${successCount}, Failed: ${failCount}`)
    setSelectedInvoices(new Set())
    setSendingBulk(false)
  }

  const exportInvoiceSummary = () => {
    try {
      const rowData = [["Invoice Number", "Client Name", "Invoice Date", "Due Date", "Taxable Amount", "GST Amount", "Total Amount", "Status"]]
      invoices.forEach(inv => {
        rowData.push([
          inv.invoice_number,
          inv.client?.name || '-',
          inv.invoice_date,
          inv.due_date,
          inv.subtotal || 0,
          inv.gst_amount || 0,
          inv.total || 0,
          inv.status || 'due'
        ])
      })
      const csvContent = rowData.map(e => e.map(item => `"${(item||'').toString().replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `invoice_summary_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Report generated successfully")
    } catch(e) {
      toast.error("Failed to generate summary report")
    }
  }

  return (
    <>
      <div className="page-toolbar">
        <div className="filter-row">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="due">Due</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <select className="filter-select" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {selectedInvoices.size > 0 && (
            <button 
              className="btn btn-secondary" 
              onClick={handleBulkEmail}
              disabled={sendingBulk}
            >
              {sendingBulk ? <div className="spinner" style={{width: 14, height: 14, borderWidth: 2}}></div> : <Send size={14}/>}
              Send Mail ({selectedInvoices.size})
            </button>
          )}
          <button className="btn btn-secondary" onClick={exportInvoiceSummary}>
            <Download size={14} /> Export Report
          </button>
          <button className="btn btn-primary" onClick={() => { reset(); setModalOpen(true) }}>
            <Plus size={16}/> New Invoice
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      style={{ cursor: 'pointer' }}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedInvoices(new Set(invoices.map(i => i.id)))
                        else setSelectedInvoices(new Set())
                      }}
                      checked={invoices.length > 0 && selectedInvoices.size === invoices.length}
                    />
                  </th>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>No invoices found.</td></tr>}
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        style={{ cursor: 'pointer' }}
                        checked={selectedInvoices.has(inv.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedInvoices)
                          if (e.target.checked) newSet.add(inv.id)
                          else newSet.delete(inv.id)
                          setSelectedInvoices(newSet)
                        }}
                      />
                    </td>
                    <td className="td-mono">{inv.invoice_number}</td>
                    <td>{inv.client?.name}</td>
                    <td>
                      <div>{formatDate(inv.invoice_date)}</div>
                      <div style={{fontSize: 11, color:'var(--danger)'}}>Due: {formatDate(inv.due_date)}</div>
                    </td>
                    <td className="td-amount">{formatCurrency(inv.total)}</td>
                    <td>
                      <select className="filter-select" style={{height:30, padding:'0 8px', fontSize:12}}
                        value={inv.status} onChange={e => handleStatusChange(inv.id, e.target.value)}>
                        <option value="due">Due</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>
                    <td>
                      <div className="client-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPreviewInvoice(inv)} title="Preview"><FileText size={14}/></button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => { setPreviewInvoice(inv); setTimeout(() => window.print(), 100); }} 
                          title="Download PDF"
                        >
                          <Download size={14}/>
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => handleResendEmail(inv)} 
                          disabled={sendingEmailId === inv.id}
                          title="Resend Email"
                        >
                          {sendingEmailId === inv.id ? <div className="spinner" style={{width: 14, height: 14, borderWidth: 2}}></div> : <Send size={14} style={{color: 'var(--primary)'}}/>}
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(inv.id)} style={{color:'var(--danger)'}} title="Delete"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create Invoice" size="modal-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid" style={{ marginBottom: 24 }}>
            <div className="form-group form-full">
              <label>Client *</label>
              <select className="form-control" {...register('client_id', { required: true })}>
                <option value="">Select...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Invoice Date *</label>
              <input type="date" className="form-control" {...register('invoice_date', { required: true })} />
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <input type="date" className="form-control" {...register('due_date', { required: true })} />
            </div>
            <div className="form-group form-full">
              <label>Notes</label>
              <textarea className="form-control" {...register('notes')} rows="2"></textarea>
            </div>
          </div>

          <div style={{ marginBottom: 16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{fontSize:15}}>Line Items</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ description: '', rate: 0, quantity: 1, amount: 0, unit: 'per month' })}>
              <Plus size={14}/> Add Row
            </button>
          </div>

          <div className="line-items-header">
            <span>Description</span>
            <span>Unit</span>
            <span>Qty</span>
            <span>Rate</span>
            <span>Amount</span>
            <span></span>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="line-item-row">
              <input className="form-control" placeholder="Service / Role" {...register(`line_items.${index}.description`, { required: true })} />
              <input className="form-control" placeholder="Unit" {...register(`line_items.${index}.unit`)} />
              <input type="number" step="0.1" className="form-control" {...register(`line_items.${index}.quantity`)} />
              <input type="number" step="0.01" className="form-control" {...register(`line_items.${index}.rate`)} />
              <span className="line-amount">{formatCurrency(watchLineItems?.[index]?.amount || 0)}</span>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => remove(index)}><Trash2 size={14} style={{color:'var(--danger)'}}/></button>
            </div>
          ))}

          <div className="modal-footer" style={{ marginTop: 32 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Generate Invoice</button>
          </div>
        </form>
      </Modal>

      {/* Basic Preview logic for now */}
      <Modal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} title={`Preview: ${previewInvoice?.invoice_number}`} size="modal-lg">
        {previewInvoice && (
          <div className="inv-preview" style={{ padding: '40px', background: 'white', color: '#1a1a2e', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => window.print()}
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <EpiqLogo size={64} />
                <div>
                  <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#1b2e4b', letterSpacing: '0.5px' }}>EPIQ INDIA</h1>
                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Innovation Delivered</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#1a1a2e' }}>INVOICE</h2>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}><strong>#{previewInvoice.invoice_number}</strong></p>
                <div className="no-print"><StatusBadge status={previewInvoice.status} /></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px', borderTop: '2px solid #e0e0e0', paddingTop: '24px' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Billed To</p>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#1b2e4b' }}>{previewInvoice.client?.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>ATTN: {previewInvoice.client?.spoc_name}</p>
                {previewInvoice.client?.address && <p style={{ margin: 0, fontSize: '14px', color: '#555', whiteSpace: 'pre-wrap' }}>{previewInvoice.client.address}</p>}
                {previewInvoice.client?.gst_number && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#1b2e4b', fontWeight: 600 }}>GST: {previewInvoice.client.gst_number}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <table style={{ width: '100%', maxWidth: '250px', marginLeft: 'auto', fontSize: '14px' }}>
                  <tbody>
                    <tr><td style={{ padding: '4px 0', color: '#666' }}>Invoice Date:</td><td style={{ padding: '4px 0', fontWeight: 600, color: '#333' }}>{formatDate(previewInvoice.invoice_date)}</td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#666' }}>Due Date:</td><td style={{ padding: '4px 0', fontWeight: 600, color: '#e87c31' }}>{formatDate(previewInvoice.due_date)}</td></tr>
                    <tr><td colSpan="2"><hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '8px 0' }}/></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#666' }}>Total Due:</td><td style={{ padding: '4px 0', fontWeight: 800, color: '#1b2e4b', fontSize: '16px' }}>{formatCurrency(previewInvoice.total)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>Quantity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>Rate</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {previewInvoice.line_items?.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '14px 16px', color: '#444', fontSize: '14px' }}>
                      <div style={{ fontWeight: 600, color: '#222' }}>{item.description}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{item.unit}</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#444', fontSize: '14px' }}>{item.quantity}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#444', fontSize: '14px' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#222', fontSize: '14px' }}>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '50%' }}>
                {previewInvoice.notes && (
                  <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px', borderLeft: '4px solid #1b2e4b', fontSize: '13px', color: '#555' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', color: '#333' }}>Notes:</strong>
                    {previewInvoice.notes}
                  </div>
                )}
              </div>
              <div style={{ width: '40%' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr><td style={{ padding: '6px 0', color: '#666' }}>Subtotal</td><td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#333' }}>{formatCurrency(previewInvoice.subtotal)}</td></tr>
                    {previewInvoice.gst_type === 'IGST' ? (
                      <tr><td style={{ padding: '6px 0', color: '#666' }}>IGST ({previewInvoice.gst_rate}%)</td><td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#333' }}>{formatCurrency(previewInvoice.gst_amount)}</td></tr>
                    ) : (
                      <>
                        <tr><td style={{ padding: '6px 0', color: '#666' }}>CGST ({previewInvoice.gst_rate/2}%)</td><td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#333' }}>{formatCurrency(previewInvoice.gst_amount/2)}</td></tr>
                        <tr><td style={{ padding: '6px 0', color: '#666' }}>SGST ({previewInvoice.gst_rate/2}%)</td><td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#333' }}>{formatCurrency(previewInvoice.gst_amount/2)}</td></tr>
                      </>
                    )}
                    <tr><td colSpan="2"><hr style={{ border: 'none', borderTop: '2px solid #1b2e4b', margin: '8px 0' }}/></td></tr>
                    <tr><td style={{ padding: '8px 0', color: '#1b2e4b', fontSize: '18px', fontWeight: 800 }}>Total</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: '#1b2e4b', fontSize: '18px' }}>{formatCurrency(previewInvoice.total)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #e0e0e0', textAlign: 'center', fontSize: '12px', color: '#999' }}>
              EPIQ INDIA • Thank you for your business.
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
// Fix imports
import { FileText } from 'lucide-react'
