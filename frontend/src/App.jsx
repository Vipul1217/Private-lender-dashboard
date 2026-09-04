import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import ApplicationReview from './pages/ApplicationReview'
import Loans from './pages/Loans'
import LoanDetail from './pages/LoanDetail'
import Repayments from './pages/Repayments'
import RateBands from './pages/RateBands'
import LenderProfile from './pages/LenderProfile'
import Settings from './pages/Settings'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayoutWithTitle />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/applications/:id" element={<ApplicationReview />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/loans/:id" element={<LoanDetail />} />
              <Route path="/repayments" element={<Repayments />} />
              <Route path="/rate-bands" element={<RateBands />} />
              <Route path="/profile" element={<LenderProfile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}

// Titles are resolved by route via a thin wrapper so DashboardLayout
// stays a plain, reusable Outlet shell.
function DashboardLayoutWithTitle() {
  const { pathname } = useLocation()
  const title = resolveTitle(pathname)
  return <DashboardLayout title={title} />
}

function resolveTitle(pathname) {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/applications/')) return 'Application Review'
  if (pathname.startsWith('/applications')) return 'Applications'
  if (pathname.startsWith('/loans/')) return 'Loan Details'
  if (pathname.startsWith('/loans')) return 'Active Loans'
  if (pathname.startsWith('/repayments')) return 'Repayments'
  if (pathname.startsWith('/rate-bands')) return 'Rate Bands'
  if (pathname.startsWith('/profile')) return 'Lender Profile'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'Dashboard'
}

export default App
