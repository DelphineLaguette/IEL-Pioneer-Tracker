import { Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LeaderJourney from './pages/LeaderJourney';
import StartingPointForm from './pages/StartingPointForm';
import CheckInForm from './pages/CheckInForm';
import Admin from './pages/Admin';
import BiWeeklyCheckInPage from './pages/BiWeeklyCheckIn';

function AppContent() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          {/* Leaders land on their own journey; admins get the full dashboard */}
          <Route
            path="/"
            element={
              user.role === 'leader' && user.leaderId
                ? <Navigate to={`/leaders/${user.leaderId}`} replace />
                : <Dashboard />
            }
          />

          <Route path="/leaders/:leaderId" element={<LeaderJourney />} />
          <Route path="/leaders/:leaderId/starting-point" element={<StartingPointForm />} />
          <Route path="/leaders/:leaderId/checkin/new" element={<CheckInForm />} />

          {/* Admin-only routes */}
          <Route
            path="/admin"
            element={user.role === 'admin' ? <Admin /> : <Navigate to="/" replace />}
          />
          <Route
            path="/bi-weekly"
            element={user.role === 'admin' ? <BiWeeklyCheckInPage /> : <Navigate to="/" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}
