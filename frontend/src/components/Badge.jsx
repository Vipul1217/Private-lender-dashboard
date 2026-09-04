import { statusColor, statusLabel } from '../utils/format'

export default function Badge({ status, children }) {
  const c = statusColor(status)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {children || statusLabel(status)}
    </span>
  )
}
