import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AdminSourceBanner } from './AdminSourceBanner'
import { DataTable } from '../common/DataTable'
import { DetailDrawer } from '../common/DetailDrawer'
import { PageHeader } from '../common/PageHeader'
import { StatusBadge } from '../common/StatusBadge'
import { useAdminWorkspace } from '../../hooks/useAdminWorkspace'

export function AdminTablePage({ eyebrow, title, description, rows, columns, formTitle, formFields = [] }) { const { save } = useAdminWorkspace(); const [open, setOpen] = useState(false); const [form, setForm] = useState({}); const [message, setMessage] = useState('')
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event) { event.preventDefault(); await save(title, form); setMessage('Saved in prototype workspace.'); setForm({}); setOpen(false) }
  return <><PageHeader eyebrow={eyebrow} title={title} description={description} actions={<><StatusBadge tone="demo">Prototype data</StatusBadge>{formFields.length > 0 && <button className="primary-button" onClick={() => setOpen(true)}><Plus size={16} /> Add record</button>}</>} /><AdminSourceBanner />{message && <div className="admin-success">{message}</div>}<DataTable columns={columns} rows={rows} emptyMessage={`No ${title.toLowerCase()} records are available.`} />{formFields.length > 0 && <DetailDrawer open={open} title={formTitle ?? `Add ${title}`} onClose={() => setOpen(false)}><form className="drawer-form" onSubmit={submit}>{formFields.map((field) => <label key={field.key}>{field.label}{field.type === 'select' ? <select required={field.required} value={form[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)}><option value="">Select</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={field.required} type={field.type ?? 'text'} value={form[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} />}</label>)}<button className="primary-button" type="submit">Save record</button></form></DetailDrawer>}</> }
