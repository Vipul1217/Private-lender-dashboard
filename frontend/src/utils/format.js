export function formatCurrency(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatFactorLabel(key) {
  const map = {
    income_consistency: 'Income Consistency',
    transaction_frequency: 'Transaction Frequency',
    inflow_outflow_ratio: 'Inflow / Outflow Ratio',
    financial_longevity: 'Financial Longevity',
    payer_diversity: 'Payer Diversity',
    lean_period_resilience: 'Lean-period Resilience',
  }
  return map[key] || key
}

export function tierColor(tier) {
  switch (tier) {
    case 'Gold':
      return { text: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' }
    case 'Silver':
      return { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' }
    default:
      return { text: 'text-sky-700', bg: 'bg-sky-100', border: 'border-sky-300' }
  }
}

export function statusColor(status) {
  const map = {
    pending: { text: 'text-amber-700', bg: 'bg-amber-100' },
    countered: { text: 'text-sky-700', bg: 'bg-sky-100' },
    approved: { text: 'text-brand-700', bg: 'bg-brand-100' },
    rejected: { text: 'text-rose-700', bg: 'bg-rose-100' },
    expired: { text: 'text-slate-500', bg: 'bg-slate-100' },
    disbursed: { text: 'text-sky-700', bg: 'bg-sky-100' },
    repaying: { text: 'text-brand-700', bg: 'bg-brand-100' },
    closed: { text: 'text-slate-600', bg: 'bg-slate-100' },
    on_time: { text: 'text-brand-700', bg: 'bg-brand-100' },
    late: { text: 'text-amber-700', bg: 'bg-amber-100' },
    missed: { text: 'text-rose-700', bg: 'bg-rose-100' },
  }
  return map[status] || { text: 'text-slate-600', bg: 'bg-slate-100' }
}

export function statusLabel(status) {
  const map = {
    on_time: 'On Time',
    due_soon: 'Due Soon',
  }
  if (map[status]) return map[status]
  return status.charAt(0).toUpperCase() + status.slice(1)
}
