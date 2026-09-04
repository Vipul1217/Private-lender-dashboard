import { useState } from 'react'
import { Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ title }) {
  const { officer, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-charcoal">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative text-slate-400 hover:text-slate-600">
          <Bell size={19} />
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-slate-50"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-charcoal leading-tight">{officer?.name}</p>
              <p className="text-xs text-slate-400 leading-tight">{officer?.lender_name}</p>
            </div>
            <ChevronDown size={15} className="text-slate-400" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs text-slate-400">Role</p>
                <p className="text-sm font-medium text-charcoal">{officer?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
