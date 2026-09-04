import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { applicationsApi } from '../services/resources'
import { Card, Spinner, ErrorState } from '../components/Common'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { formatCurrency, formatDate, formatFactorLabel, tierColor } from '../utils/format'
import { useToast } from '../context/ToastContext'

export default function ApplicationReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modal, setModal] = useState(null) // 'approve' | 'counter' | 'reject' | null
  const [submitting, setSubmitting] = useState(false)

  const [approveForm, setApproveForm] = useState({ loan_amount: '', interest_rate: '', tenure_months: '', processing_fee: '' })
  const [counterForm, setCounterForm] = useState({ counter_amount: '', counter_rate: '', counter_tenure_months: '' })
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await applicationsApi.get(id)
      setApp(res.data)
      setApproveForm({
        loan_amount: res.data.requested_amount,
        interest_rate: res.data.reference_rate_bands[0]?.interest_rate || '',
        tenure_months: res.data.reference_rate_bands[0]?.tenure_months || '',
        processing_fee: res.data.reference_rate_bands[0]?.processing_fee || '0',
      })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <Spinner />
  if (error || !app) return <ErrorState />

  const tc = tierColor(app.score_tier)
  const factors = Object.entries(app.score_factors_snapshot)
  const decidable = app.status === 'pending' || app.status === 'countered'

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      const res = await applicationsApi.approve(id, {
        loan_amount: Number(approveForm.loan_amount),
        interest_rate: Number(approveForm.interest_rate),
        tenure_months: Number(approveForm.tenure_months),
        processing_fee: Number(approveForm.processing_fee || 0),
      })
      setApp(res.data)
      setModal(null)
      showToast('Application approved and loan created.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not approve application.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCounter = async () => {
    setSubmitting(true)
    try {
      const res = await applicationsApi.counter(id, {
        counter_amount: Number(counterForm.counter_amount),
        counter_rate: Number(counterForm.counter_rate),
        counter_tenure_months: Number(counterForm.counter_tenure_months),
      })
      setApp(res.data)
      setModal(null)
      showToast('Counter-offer sent to applicant.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not send counter-offer.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a rejection reason.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await applicationsApi.reject(id, { reason: rejectReason.trim() })
      setApp(res.data)
      setModal(null)
      showToast('Application rejected.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not reject application.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/applications')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-charcoal">
        <ArrowLeft size={15} /> Back to Applications
      </button>

      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">{app.applicant_name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Application ID: {app.id}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div><span className="text-slate-400">Requested: </span><span className="font-medium">{formatCurrency(app.requested_amount)}</span></div>
              <div><span className="text-slate-400">Type: </span><span className="font-medium">{app.loan_type}</span></div>
              <div><span className="text-slate-400">Applied: </span><span className="font-medium">{formatDate(app.created_at)}</span></div>
            </div>
          </div>
          <Badge status={app.status} />
        </div>
        {app.status === 'countered' && (
          <div className="mt-4 bg-sky-50 border border-sky-200 rounded-lg px-4 py-3 text-sm text-sky-800">
            Counter-offer sent: {formatCurrency(app.counter_amount)} at {app.counter_rate}% for {app.counter_tenure_months} months.
          </div>
        )}
        {app.status === 'rejected' && (
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-800">
            Rejected: {app.rejection_reason}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Trust Score card */}
          <Card>
            <div className="flex items-center gap-6">
              <div className={`w-28 h-28 rounded-full border-8 ${tc.border} flex flex-col items-center justify-center shrink-0`}>
                <span className="text-2xl font-bold text-charcoal">{app.trust_score_snapshot}</span>
                <span className="text-[10px] text-slate-400">/ 900</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-brand-600" />
                  <span className="text-sm font-medium text-slate-500">Trust Score</span>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${tc.bg} ${tc.text}`}>
                  {app.score_tier} Tier
                </span>
                <p className="text-xs text-slate-400 mt-2 max-w-sm">
                  This score is explainable and rule-based — it informs your risk assessment
                  but does not set your interest rate. You decide the final terms.
                </p>
              </div>
            </div>
          </Card>

          {/* Factor breakdown */}
          <Card title="Trust Score Factor Breakdown">
            <div className="space-y-4">
              {factors.map(([key, f]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-charcoal">{formatFactorLabel(key)}</span>
                    <span className="text-xs text-slate-400">{f.score}/100 · weight {(f.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${f.score}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{f.explanation}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Financial Profile */}
          <Card title="Financial Profile">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FinancialStat label="Avg. Monthly Inflow" value={formatCurrency(app.financial_profile.avg_monthly_inflow)} />
              <FinancialStat label="Avg. Monthly Outflow" value={formatCurrency(app.financial_profile.avg_monthly_outflow)} />
              <FinancialStat label="Est. Monthly Surplus" value={formatCurrency(app.financial_profile.avg_monthly_surplus)} />
              <FinancialStat label="Transactions / month" value={app.financial_profile.transaction_frequency_per_month} />
              <FinancialStat label="Active Financial Sources" value={app.financial_profile.active_financial_sources} />
              <FinancialStat label="Financial History" value={`${app.financial_profile.financial_history_months} months`} />
            </div>
          </Card>
        </div>

        {/* Decision Panel */}
        <div className="space-y-4">
          <Card title="Lender Decision">
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-slate-400">Requested amount</span><span className="font-medium">{formatCurrency(app.requested_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Score tier</span><span className="font-medium">{app.score_tier}</span></div>
            </div>
            {app.reference_rate_bands.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Your reference rate bands ({app.score_tier})</p>
                {app.reference_rate_bands.map((b, i) => (
                  <p key={i} className="text-xs text-slate-600">
                    {b.interest_rate}% · {b.tenure_months} months · fee {formatCurrency(b.processing_fee)}
                  </p>
                ))}
              </div>
            )}

            {decidable ? (
              <div className="space-y-2">
                <button
                  onClick={() => setModal('approve')}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => setModal('counter')}
                  className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium py-2.5 rounded-lg text-sm border border-sky-200"
                >
                  Counter-offer
                </button>
                <button
                  onClick={() => setModal('reject')}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium py-2.5 rounded-lg text-sm border border-rose-200"
                >
                  Reject
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">
                This application has already been decided.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        open={modal === 'approve'}
        onClose={() => setModal(null)}
        title="Approve Application"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-charcoal">Cancel</button>
            <button onClick={handleApprove} disabled={submitting} className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium disabled:opacity-60">
              {submitting ? 'Approving...' : 'Confirm Approval'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Loan amount (₹)" value={approveForm.loan_amount} onChange={(v) => setApproveForm((f) => ({ ...f, loan_amount: v }))} />
          <FormField label="Interest rate (%)" value={approveForm.interest_rate} onChange={(v) => setApproveForm((f) => ({ ...f, interest_rate: v }))} />
          <FormField label="Tenure (months)" value={approveForm.tenure_months} onChange={(v) => setApproveForm((f) => ({ ...f, tenure_months: v }))} />
          <FormField label="Processing fee (₹)" value={approveForm.processing_fee} onChange={(v) => setApproveForm((f) => ({ ...f, processing_fee: v }))} />
        </div>
      </Modal>

      {/* Counter Modal */}
      <Modal
        open={modal === 'counter'}
        onClose={() => setModal(null)}
        title="Send Counter-offer"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-charcoal">Cancel</button>
            <button onClick={handleCounter} disabled={submitting} className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium disabled:opacity-60">
              {submitting ? 'Sending...' : 'Send Counter-offer'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Counter amount (₹)" value={counterForm.counter_amount} onChange={(v) => setCounterForm((f) => ({ ...f, counter_amount: v }))} />
          <FormField label="Counter interest rate (%)" value={counterForm.counter_rate} onChange={(v) => setCounterForm((f) => ({ ...f, counter_rate: v }))} />
          <FormField label="Counter tenure (months)" value={counterForm.counter_tenure_months} onChange={(v) => setCounterForm((f) => ({ ...f, counter_tenure_months: v }))} />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        title="Reject Application"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-charcoal">Cancel</button>
            <button onClick={handleReject} disabled={submitting} className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium disabled:opacity-60">
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rejection reason</label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          placeholder="e.g. Insufficient repayment history for requested amount"
        />
      </Modal>
    </div>
  )
}

function FinancialStat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-charcoal mt-0.5">{value}</p>
    </div>
  )
}

function FormField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
    </div>
  )
}
