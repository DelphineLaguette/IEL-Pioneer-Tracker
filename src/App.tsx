import { Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LeaderJourney from './pages/LeaderJourney';
import StartingPointForm from './pages/StartingPointForm';
import CheckInForm from './pages/CheckInForm';

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
            <Route path="/leaders/:leaderId/checkin/new" element={<CheckInForm />} />
          </Routes>
        </main>
      </div>
    </StoreProvider>
  );
}
