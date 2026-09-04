import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { authApi } from '../services/resources'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const OTP_SECONDS = 300

export default function Login() {
  const [step, setStep] = useState(1) // 1 = identifier, 2 = otp
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS)
  const [devOtp, setDevOtp] = useState(null)
  const inputRefs = useRef([])

  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (step !== 2) return
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [step, secondsLeft])

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) return
    setLoading(true)
    try {
      const res = await authApi.sendOtp(identifier.trim())
      setDevOtp(res.data.debug_otp || null)
      setSecondsLeft(res.data.expires_in_seconds || OTP_SECONDS)
      setStep(2)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not send OTP. Check the identifier.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[idx] = value
    setOtp(next)
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) {
      showToast('Enter the full 6-digit OTP.', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.verifyOtp(identifier.trim(), code)
      await login(res.data.access_token)
      navigate('/')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Invalid or expired OTP.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setOtp(['', '', '', '', '', ''])
    await handleSendOtp({ preventDefault: () => {} })
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mb-3">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-charcoal">Trust Score Lender Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage applications and loans</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone or email
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="officer@lender.demo"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <p className="text-xs text-slate-400 text-center pt-1">
                Demo: try admin@sahyogmicrofinance.demo
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft size={13} /> Change identifier
              </button>
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Enter the 6-digit code sent to <span className="font-medium text-charcoal">{identifier}</span>
                </p>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {secondsLeft > 0 ? `Expires in ${formatTime(secondsLeft)}` : 'OTP expired'}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={secondsLeft > 0 || loading}
                  className="text-brand-600 font-medium disabled:text-slate-300 hover:underline"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Sign in'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}




