import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/Common'
import { LogOut } from 'lucide-react'

export default function Settings() {
  const { officer, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card title="Account Information">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Name</p>
            <p className="text-sm font-semibold text-charcoal mt-0.5">{officer?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Role</p>
            <p className="text-sm font-semibold text-charcoal mt-0.5">{officer?.role}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Phone / Email</p>
            <p className="text-sm font-semibold text-charcoal mt-0.5">{officer?.phone_or_email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Lender</p>
            <p className="text-sm font-semibold text-charcoal mt-0.5">{officer?.lender_name}</p>
          </div>
        </div>
      </Card>

      <Card title="Notification Preferences">
        <label className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-600">Email me when a new application arrives</span>
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
        </label>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-600">Alert me on EMI due dates</span>
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
        </label>
      </Card>

      <Card title="Security">
        <p className="text-sm text-slate-500">
          This account uses passwordless OTP-based login. There is no password to manage — each
          sign-in requires a fresh one-time code sent to your registered phone or email.
        </p>
      </Card>

      <Card>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-rose-600 hover:text-rose-700 text-sm font-medium"
        >
          <LogOut size={16} /> Logout
        </button>
      </Card>
    </div>
  )
}
