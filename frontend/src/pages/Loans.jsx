import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loansApi } from '../services/resources'
import { Card, Spinner, ErrorState, EmptyState } from '../components/Common'
import Badge from '../components/Badge'
import { formatCurrency, formatDate } from '../utils/format'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'disbursed', label: 'Disbursed' },
  { key: 'repaying', label: 'Repaying' },
  { key: 'closed', label: 'Closed' },
]

export default function Loans() {
  const [tab, setTab] = useState('all')
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await loansApi.list({ status: tab })
        setLoans(res.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-charcoal'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState />
        ) : loans.length === 0 ? (
          <EmptyState message="No loans in this category." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                  <th className="py-2 pr-4">Loan ID</th>
                  <th className="py-2 pr-4">Applicant</th>
                  <th className="py-2 pr-4">Principal</th>
                  <th className="py-2 pr-4">Rate</th>
                  <th className="py-2 pr-4">Tenure</th>
                  <th className="py-2 pr-4">Disbursed</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Repayment</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{l.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4 font-medium text-charcoal">{l.applicant_name}</td>
                    <td className="py-3 pr-4">{formatCurrency(l.principal_amount)}</td>
                    <td className="py-3 pr-4">{l.interest_rate}%</td>
                    <td className="py-3 pr-4">{l.tenure_months} mo</td>
                    <td className="py-3 pr-4 text-slate-500">{formatDate(l.disbursed_date)}</td>
                    <td className="py-3 pr-4"><Badge status={l.status} /></td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{l.repayment_status_summary}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/loans/${l.id}`} className="text-brand-600 text-xs font-medium hover:underline">
                        View
                      </Link>
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
