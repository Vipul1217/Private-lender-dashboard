import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { loanTermsApi } from '../services/resources'
import { useAuth } from '../context/AuthContext'
import { Card, Spinner, ErrorState, EmptyState } from '../components/Common'
import Modal from '../components/Modal'
import { formatCurrency, formatDate } from '../utils/format'
import { useToast } from '../context/ToastContext'

const TIERS = ['Gold', 'Silver', 'Building']

export default function RateBands() {
  const { officer } = useAuth()
  const { showToast } = useToast()
  const isAdmin = officer?.role === 'Admin'

  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ score_tier: 'Gold', interest_rate: '', tenure_months: '', processing_fee: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await loanTermsApi.list()
      setTerms(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ score_tier: 'Gold', interest_rate: '', tenure_months: '', processing_fee: '' })
    setModalOpen(true)
  }

  const openEdit = (term) => {
    setEditing(term)
    setForm({
      score_tier: term.score_tier,
      interest_rate: term.interest_rate,
      tenure_months: term.tenure_months,
      processing_fee: term.processing_fee,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editing) {
        await loanTermsApi.update(editing.id, {
          interest_rate: Number(form.interest_rate),
          tenure_months: Number(form.tenure_months),
          processing_fee: Number(form.processing_fee),
        })
        showToast('Rate band updated. Historical loans are unaffected.', 'success')
      } else {
        await loanTermsApi.create({
          score_tier: form.score_tier,
          interest_rate: Number(form.interest_rate),
          tenure_months: Number(form.tenure_months),
          processing_fee: Number(form.processing_fee || 0),
        })
        showToast('New rate band created.', 'success')
      }
      await load()
      setModalOpen(false)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not save rate band.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExpire = async (termId) => {
    try {
      await loanTermsApi.expire(termId)
      await load()
      showToast('Rate band expired.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not expire rate band.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {isAdmin ? 'Manage your rate bands by score tier.' : 'Read-only view — only Admin officers can edit rate bands.'}
        </p>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Plus size={15} /> New Rate Band
          </button>
        )}
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState />
        ) : terms.length === 0 ? (
          <EmptyState message="No rate bands configured yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                  <th className="py-2 pr-4">Score Tier</th>
                  <th className="py-2 pr-4">Interest Rate</th>
                  <th className="py-2 pr-4">Tenure</th>
                  <th className="py-2 pr-4">Processing Fee</th>
                  <th className="py-2 pr-4">Effective Date</th>
                  <th className="py-2 pr-4">Status</th>
                  {isAdmin && <th className="py-2 pr-4"></th>}
                </tr>
              </thead>
              <tbody>
                {terms.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-charcoal">{t.score_tier}</td>
                    <td className="py-3 pr-4">{t.interest_rate}%</td>
                    <td className="py-3 pr-4">{t.tenure_months} months</td>
                    <td className="py-3 pr-4">{formatCurrency(t.processing_fee)}</td>
                    <td className="py-3 pr-4 text-slate-500">{formatDate(t.effective_date)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                        {t.is_active ? 'Active' : `Expired ${formatDate(t.expired_date)}`}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 pr-4 flex gap-3">
                        {t.is_active && (
                          <>
                            <button onClick={() => openEdit(t)} className="text-brand-600 text-xs font-medium hover:underline">Edit</button>
                            <button onClick={() => handleExpire(t.id)} className="text-rose-600 text-xs font-medium hover:underline">Expire</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Rate Band' : 'New Rate Band'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-charcoal">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Score Tier</label>
            <select
              value={form.score_tier}
              disabled={!!editing}
              onChange={(e) => setForm((f) => ({ ...f, score_tier: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Interest rate (%)</label>
            <input type="number" value={form.interest_rate} onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tenure (months)</label>
            <input type="number" value={form.tenure_months} onChange={(e) => setForm((f) => ({ ...f, tenure_months: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Processing fee (₹)</label>
            <input type="number" value={form.processing_fee} onChange={(e) => setForm((f) => ({ ...f, processing_fee: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          {editing && (
            <p className="text-xs text-slate-400">
              Editing only changes this active band going forward — loans already disbursed keep their original locked rate.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
