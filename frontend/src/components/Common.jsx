export function Card({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function KPICard({ label, value, icon: Icon, accent = 'brand' }) {
  const accentMap = {
    brand: 'bg-brand-100 text-brand-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    rose: 'bg-rose-100 text-rose-700',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-semibold text-charcoal mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div className="text-center py-12 text-slate-400 text-sm">
      {message}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong. Please try again.' }) {
  return (
    <div className="text-center py-12 text-rose-500 text-sm">
      {message}
    </div>
  )
}
