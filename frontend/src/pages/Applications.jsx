import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { applicationsApi } from '../services/resources'
import { Card, Spinner, ErrorState, EmptyState } from '../components/Common'
import Badge from '../components/Badge'
import { formatCurrency, formatDate, tierColor } from '../utils/format'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'countered', label: 'Countered' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function Applications() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await applicationsApi.list({ status: tab, search: search || undefined })
        setApplications(res.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(load, 250) // light debounce for search
    return () => clearTimeout(t)
  }, [tab, search])

  const filtered = applications.filter((a) => tierFilter === 'all' || a.score_tier === tierFilter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicant or ID..."
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="all">All tiers</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Building">Building</option>
          </select>
        </div>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState />
        ) : filtered.length === 0 ? (
          <EmptyState message="No applications match your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                  <th className="py-2 pr-4">Applicant</th>
                  <th className="py-2 pr-4">Application ID</th>
                  <th className="py-2 pr-4">Trust Score</th>
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4">Requested</th>
                  <th className="py-2 pr-4">Loan Type</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const tc = tierColor(a.score_tier)
                  return (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-charcoal">{a.applicant_name}</td>
                      <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{a.id.slice(0, 8)}</td>
                      <td className="py-3 pr-4">{a.trust_score_snapshot}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>
                          {a.score_tier}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{formatCurrency(a.requested_amount)}</td>
                      <td className="py-3 pr-4 text-slate-500">{a.loan_type}</td>
                      <td className="py-3 pr-4 text-slate-500">{formatDate(a.created_at)}</td>
                      <td className="py-3 pr-4"><Badge status={a.status} /></td>
                      <td className="py-3 pr-4">
                        <Link to={`/applications/${a.id}`} className="text-brand-600 text-xs font-medium hover:underline">
                          {a.status === 'pending' ? 'Review' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
