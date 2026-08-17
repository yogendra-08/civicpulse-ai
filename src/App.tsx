import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { RequireRole } from '@/components/RequireRole';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { CitizenDashboard } from '@/pages/CitizenDashboard';
import { ReportComplaintPage } from '@/pages/ReportComplaintPage';
import { OfficerDashboard } from '@/pages/OfficerDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminAnalytics } from '@/pages/AdminAnalytics';
import { ChatAgent } from '@/components/ChatAgent';
import i18n from '@/i18n/i18n';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <BrowserRouter>
          <ChatAgent />
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/citizen"
            element={
              <RequireRole role="citizen">
                <CitizenDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/citizen/report"
            element={
              <RequireRole role="citizen">
                <ReportComplaintPage />
              </RequireRole>
            }
          />
          <Route
            path="/citizen/profile"
            element={
              <RequireRole role="citizen">
                <ProfilePage />
              </RequireRole>
            }
          />
          <Route
            path="/officer"
            element={
              <RequireRole role="officer">
                <OfficerDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RequireRole role="admin">
                <AdminAnalytics />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole role="admin">
                <UserManagementPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
