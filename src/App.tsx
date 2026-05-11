import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LeaderJourney from './pages/LeaderJourney';
import StartingPointForm from './pages/StartingPointForm';
import CheckInTypeSelector from './pages/CheckInTypeSelector';
import CheckInForm from './pages/CheckInForm';
import BiWeeklyLeaderForm from './pages/BiWeeklyLeaderForm';
import Admin from './pages/Admin';
import AdminLogin, { isAdminAuthenticated } from './pages/AdminLogin';
import BiWeeklyCheckInPage from './pages/BiWeeklyCheckIn';

function AdminGate() {
  const [authed, setAuthed] = useState(isAdminAuthenticated);
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <Admin />;
}

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leaders/:leaderId" element={<LeaderJourney />} />
            <Route path="/leaders/:leaderId/starting-point" element={<StartingPointForm />} />
            <Route path="/leaders/:leaderId/checkin/new" element={<CheckInTypeSelector />} />
            <Route path="/leaders/:leaderId/checkin/30-day" element={<CheckInForm />} />
            <Route path="/leaders/:leaderId/checkin/bi-weekly" element={<BiWeeklyLeaderForm />} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/bi-weekly" element={<BiWeeklyCheckInPage />} />
          </Routes>
        </main>
      </div>
    </StoreProvider>
  );
}
