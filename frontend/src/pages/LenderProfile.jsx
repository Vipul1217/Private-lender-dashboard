import { useEffect, useState } from 'react'
import { lenderApi } from '../services/resources'
import { useAuth } from '../context/AuthContext'
import { Card, Spinner, ErrorState } from '../components/Common'
import { formatCurrency, formatDate } from '../utils/format'
import { useToast } from '../context/ToastContext'

export default function LenderProfile() {
  const { officer } = useAuth()
  const { showToast } = useToast()
  const isAdmin = officer?.role === 'Admin'

  const [profile, setProfile] = useState(null)
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', max_loan_amount: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [p, o] = await Promise.all([lenderApi.profile(), lenderApi.officers()])
      setProfile(p.data)
      setForm({ name: p.data.name, max_loan_amount: p.data.max_loan_amount })
      setOfficers(o.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />
  if (error || !profile) return <ErrorState />

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await lenderApi.updateProfile({ name: form.name, max_loan_amount: Number(form.max_loan_amount) })
      setProfile(res.data)
      setEditing(false)
      showToast('Lender profile updated.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card title="Lender Details" action={isAdmin && !editing && (
        <button onClick={() => setEditing(true)} className="text-sm text-brand-600 font-medium hover:underline">Edit</button>
      )}>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Lender name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Maximum loan amount (₹)</label>
              <input type="number" value={form.max_loan_amount} onChange={(e) => setForm((f) => ({ ...f, max_loan_amount: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className="text-sm text-slate-500 px-4 py-2">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <ProfileStat label="Lender Name" value={profile.name} />
            <ProfileStat label="Type" value={profile.type} />
            <ProfileStat label="Maximum Loan Amount" value={formatCurrency(profile.max_loan_amount)} />
            <ProfileStat label="Registered On" value={formatDate(profile.registered_date)} />
            <ProfileStat label="Active Officers" value={profile.active_officer_count} />
          </div>
        )}
      </Card>

      <Card title="Officers">
        <div className="divide-y divide-slate-100">
          {officers.map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-charcoal">{o.name}</p>
                <p className="text-xs text-slate-400">{o.phone_or_email}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.role === 'Admin' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                {o.role}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ProfileStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-charcoal mt-0.5">{value}</p>
    </div>
  )
}
