import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout'
import { AuthProvider } from './context/auth_context'
import { LocaleProvider } from './context/locale_context'
import { AuthPage } from './pages/auth_page'
import { DiagnosePage } from './pages/diagnose_page'
import { HomePage } from './pages/home_page'
import { MyRepairsPage } from './pages/my_repairs_page'
import { ProfilePage } from './pages/profile_page'
import { ShoppingPage } from './pages/shopping_page'

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="diagnose" element={<DiagnosePage />} />
              <Route path="shopping" element={<ShoppingPage />} />
              <Route path="my-repairs" element={<MyRepairsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
  )
}
