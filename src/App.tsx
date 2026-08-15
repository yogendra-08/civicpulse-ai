import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RequireRole } from '@/components/RequireRole';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { CitizenDashboard } from '@/pages/CitizenDashboard';
import { ReportComplaintPage } from '@/pages/ReportComplaintPage';
import { OfficerDashboard } from '@/pages/OfficerDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminAnalytics } from '@/pages/AdminAnalytics';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
