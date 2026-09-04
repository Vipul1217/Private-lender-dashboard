import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle, ListChecks } from 'lucide-react'
import { repaymentsApi } from '../services/resources'
import { Card, KPICard, Spinner, ErrorState, EmptyState } from '../components/Common'
import Badge from '../components/Badge'
import { formatCurrency, formatDate } from '../utils/format'

export default function Repayments() {
  const [repayments, setRepayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await repaymentsApi.list()
        setRepayments(res.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorState />

  const total = repayments.length
  const onTime = repayments.filter((r) => r.status === 'on_time').length
  const late = repayments.filter((r) => r.status === 'late').length
  const missed = repayments.filter((r) => r.status === 'missed').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total EMIs" value={total} icon={ListChecks} accent="sky" />
        <KPICard label="On-time" value={onTime} icon={CheckCircle2} accent="brand" />
        <KPICard label="Late" value={late} icon={Clock} accent="amber" />
        <KPICard label="Missed" value={missed} icon={XCircle} accent="rose" />
      </div>

      <Card title="All Repayment Events">
        {repayments.length === 0 ? (
          <EmptyState message="No repayment events recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                  <th className="py-2 pr-4">Applicant</th>
                  <th className="py-2 pr-4">Loan ID</th>
                  <th className="py-2 pr-4">EMI Amount</th>
                  <th className="py-2 pr-4">Due Date</th>
                  <th className="py-2 pr-4">Paid Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Score Impact</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-charcoal">{r.applicant_name}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/loans/${r.loan_id}`} className="text-brand-600 font-mono text-xs hover:underline">
                        {r.loan_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{formatCurrency(r.emi_amount)}</td>
                    <td className="py-3 pr-4 text-slate-500">{formatDate(r.due_date)}</td>
                    <td className="py-3 pr-4 text-slate-500">{formatDate(r.paid_date)}</td>
                    <td className="py-3 pr-4"><Badge status={r.status} /></td>
                    <td className={`py-3 pr-4 font-medium ${r.score_impact >= 0 ? 'text-brand-600' : 'text-rose-600'}`}>
                      {r.score_impact >= 0 ? '+' : ''}{r.score_impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
