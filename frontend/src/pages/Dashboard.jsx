import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import { ClipboardList, Wallet, IndianRupee, TrendingUp } from 'lucide-react'
import { dashboardApi, applicationsApi } from '../services/resources'
import { Card, KPICard, Spinner, ErrorState, EmptyState } from '../components/Common'
import Badge from '../components/Badge'
import { formatCurrency, formatDate, tierColor } from '../utils/format'

const PIE_COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#94a3b8']

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [appStats, setAppStats] = useState(null)
  const [loanStats, setLoanStats] = useState(null)
  const [repaymentStats, setRepaymentStats] = useState(null)
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, l, r, apps] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.applicationStats(),
          dashboardApi.loanStats(),
          dashboardApi.repaymentStats(),
          applicationsApi.list({ limit: 5 }),
        ])
        setSummary(s.data)
        setAppStats(a.data)
        setLoanStats(l.data)
        setRepaymentStats(r.data)
        setRecentApps(apps.data)
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

  const loanPieData = [
    { name: 'Approved', value: loanStats.approved },
    { name: 'Disbursed', value: loanStats.disbursed },
    { name: 'Repaying', value: loanStats.repaying },
    { name: 'Closed', value: loanStats.closed },
  ]

  const repaymentBarData = [
    { name: 'On-time', pct: repaymentStats.on_time_pct },
    { name: 'Late', pct: repaymentStats.late_pct },
    { name: 'Missed', pct: repaymentStats.missed_pct },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pending Applications" value={summary.pending_applications} icon={ClipboardList} accent="amber" />
        <KPICard label="Active Loans" value={summary.active_loans} icon={Wallet} accent="sky" />
        <KPICard label="Total Disbursed" value={formatCurrency(summary.total_disbursed)} icon={IndianRupee} accent="brand" />
        <KPICard label="Repayment Performance" value={`${summary.repayment_on_time_pct}% on time`} icon={TrendingUp} accent="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Application Overview */}
        <Card title="Application Overview">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatPill label="Pending" value={appStats.pending} color="amber" />
            <StatPill label="Countered" value={appStats.countered} color="sky" />
            <StatPill label="Approved" value={appStats.approved} color="brand" />
            <StatPill label="Rejected" value={appStats.rejected} color="rose" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={appStats.over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} hide={appStats.over_time.length > 8} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={24} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Loan Portfolio */}
        <Card title="Loan Portfolio">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={loanPieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65}>
                  {loanPieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
            {loanPieData.map((d, idx) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </Card>

        {/* Repayment Performance */}
        <Card title="Repayment Performance">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={repaymentBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" width={32} />
              <Tooltip />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {repaymentBarData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === 'On-time' ? '#22c55e' : entry.name === 'Late' ? '#f59e0b' : '#e11d48'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-1">{repaymentStats.total_emis} EMIs recorded</p>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card title="Recent Applications" action={<Link to="/applications" className="text-sm text-brand-600 font-medium hover:underline">View all</Link>}>
        {recentApps.length === 0 ? (
          <EmptyState message="No applications yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                  <th className="py-2 pr-4">Applicant</th>
                  <th className="py-2 pr-4">Trust Score</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Loan Type</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((a) => {
                  const tc = tierColor(a.score_tier)
                  return (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-charcoal">{a.applicant_name}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>
                          {a.trust_score_snapshot} · {a.score_tier}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{formatCurrency(a.requested_amount)}</td>
                      <td className="py-3 pr-4 text-slate-500">{a.loan_type}</td>
                      <td className="py-3 pr-4 text-slate-500">{formatDate(a.created_at)}</td>
                      <td className="py-3 pr-4"><Badge status={a.status} /></td>
                      <td className="py-3 pr-4">
                        <Link to={`/applications/${a.id}`} className="text-brand-600 text-xs font-medium hover:underline">
                          Review
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

function StatPill({ label, value, color }) {
  const map = {
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    brand: 'bg-brand-50 text-brand-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <div className={`rounded-lg px-3 py-2 ${map[color]}`}>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}
