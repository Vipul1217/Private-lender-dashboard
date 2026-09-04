import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Wallet,
  ReceiptText,
  Percent,
  Building2,
  Settings as SettingsIcon,
  ShieldCheck,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/loans', label: 'Active Loans', icon: Wallet },
  { to: '/repayments', label: 'Repayments', icon: ReceiptText },
  { to: '/rate-bands', label: 'Rate Bands', icon: Percent },
  { to: '/profile', label: 'Lender Profile', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Trust Score</p>
          <p className="text-[11px] text-slate-400 leading-tight">Lender Portal</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-700/60 text-[11px] text-slate-500">
        SIH Trust Score Platform
      </div>
    </aside>
  )
}
