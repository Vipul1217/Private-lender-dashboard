import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { loansApi, repaymentsApi } from '../services/resources'
import { Card, Spinner, ErrorState, EmptyState } from '../components/Common'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { formatCurrency, formatDate } from '../utils/format'
import { useToast } from '../context/ToastContext'

export default function LoanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ emi_amount: '', due_date: '', paid_date: '', status: 'on_time' })

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await loansApi.get(id)
      setLoan(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <Spinner />
  if (error || !loan) return <ErrorState />

  const handleDisburse = async () => {
    try {
      const res = await loansApi.disburse(id)
      setLoan(res.data)
      showToast('Loan disbursed.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not disburse loan.', 'error')
    }
  }

  const handleClose = async () => {
    try {
      const res = await loansApi.close(id)
      setLoan(res.data)
      showToast('Loan marked as closed.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not close loan.', 'error')
    }
  }

  const handleRecordRepayment = async () => {
    if (!form.emi_amount || !form.due_date) {
      showToast('EMI amount and due date are required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await repaymentsApi.record(id, {
        emi_amount: Number(form.emi_amount),
        due_date: form.due_date,
        paid_date: form.paid_date || null,
        status: form.status,
      })
      await load()
      setModalOpen(false)
      setForm({ emi_amount: '', due_date: '', paid_date: '', status: 'on_time' })
      showToast('Repayment recorded — Trust Score updated.', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not record repayment.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/loans')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-charcoal">
        <ArrowLeft size={15} /> Back to Active Loans
      </button>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">{loan.applicant_name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Loan ID: {loan.id}</p>
          </div>
          <Badge status={loan.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <Stat label="Principal" value={formatCurrency(loan.principal_amount)} />
          <Stat label="Interest Rate" value={`${loan.interest_rate}%`} />
          <Stat label="Tenure" value={`${loan.tenure_months} months`} />
          <Stat label="Processing Fee" value={formatCurrency(loan.processing_fee)} />
          <Stat label="Disbursed" value={formatDate(loan.disbursed_date)} />
          <Stat label="Closed" value={formatDate(loan.closed_date)} />
        </div>

        <div className="flex gap-2 mt-5">
          {loan.status === 'approved' && (
            <button onClick={handleDisburse} className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              Disburse Loan
            </button>
          )}
          {(loan.status === 'disbursed' || loan.status === 'repaying') && (
            <>
              <button onClick={() => setModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                Record Repayment
              </button>
              {loan.status === 'repaying' && (
                <button onClick={handleClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg">
                  Mark as Closed
                </button>
              )}
            </>
          )}
        </div>
      </Card>

      <Card title="Repayment History">
        {loan.repayment_events.length === 0 ? (
          <EmptyState message="No repayments recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                  <th className="py-2 pr-4">EMI Amount</th>
                  <th className="py-2 pr-4">Due Date</th>
                  <th className="py-2 pr-4">Paid Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Score Impact</th>
                </tr>
              </thead>
              <tbody>
                {loan.repayment_events.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4">{formatCurrency(e.emi_amount)}</td>
                    <td className="py-3 pr-4 text-slate-500">{formatDate(e.due_date)}</td>
                    <td className="py-3 pr-4 text-slate-500">{formatDate(e.paid_date)}</td>
                    <td className="py-3 pr-4"><Badge status={e.status} /></td>
                    <td className={`py-3 pr-4 font-medium ${e.score_impact >= 0 ? 'text-brand-600' : 'text-rose-600'}`}>
                      {e.score_impact >= 0 ? '+' : ''}{e.score_impact}
                    </td>
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
        title="Record Repayment"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-charcoal">Cancel</button>
            <button onClick={handleRecordRepayment} disabled={submitting} className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium disabled:opacity-60">
              {submitting ? 'Saving...' : 'Record Repayment'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">EMI amount (₹)</label>
            <input type="number" value={form.emi_amount} onChange={(e) => setForm((f) => ({ ...f, emi_amount: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Due date</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Paid date (optional)</label>
            <input type="date" value={form.paid_date} onChange={(e) => setForm((f) => ({ ...f, paid_date: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="on_time">On Time</option>
              <option value="late">Late</option>
              <option value="missed">Missed</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-charcoal mt-0.5">{value}</p>
    </div>
  )
}
