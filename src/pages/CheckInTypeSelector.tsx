import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getLeader } from '../data/leaders';

const IBL_NAVY = '#002060';
const IBL_CYAN = '#00D0DA';

export default function CheckInTypeSelector() {
  const { leaderId } = useParams<{ leaderId: string }>();
  const navigate = useNavigate();
  const { data } = useStore();

  const leader = getLeader(leaderId ?? '');
  const sp = data.startingPoints.find(s => s.leaderId === leaderId);

  if (!leader) return <p className="text-gray-500">Leader not found.</p>;

  if (!sp) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
          Please complete the starting reflection before adding a check-in.
        </p>
        <button
          onClick={() => navigate(`/leaders/${leader.id}/starting-point`)}
          className="px-4 py-2 text-white text-sm font-medium rounded-lg"
          style={{ backgroundColor: IBL_NAVY }}
        >
          Complete Reflection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: IBL_NAVY }}
          >
            {leader.initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Check-In</h1>
            <p className="text-sm text-gray-500">{leader.name}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Choose the type of check-in you'd like to complete.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Bi-Weekly */}
        <button
          type="button"
          onClick={() => navigate(`/leaders/${leader.id}/checkin/bi-weekly`)}
          className="text-left p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-sm
                     hover:border-[#00D0DA] hover:shadow-md transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
               style={{ backgroundColor: `${IBL_CYAN}20` }}>
            <span className="text-2xl">📅</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Bi-Weekly Check-In</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            A quick 2-week reflection on your principle focus, what went well, and your next focus.
          </p>
          <div className="mt-4 text-xs font-semibold" style={{ color: IBL_CYAN }}>
            Start →
          </div>
        </button>

        {/* 30-Day */}
        <button
          type="button"
          onClick={() => navigate(`/leaders/${leader.id}/checkin/30-day`)}
          className="text-left p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-sm
                     hover:border-[#002060] hover:shadow-md transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
               style={{ backgroundColor: `${IBL_NAVY}15` }}>
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">30-Day Leadership Check-In</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            A full monthly reflection covering your principle focus, behaviours, feedback, and next steps.
          </p>
          <div className="mt-4 text-xs font-semibold" style={{ color: IBL_NAVY }}>
            Start →
          </div>
        </button>

      </div>

      <div className="mt-6">
        <Link
          to={`/leaders/${leader.id}`}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to {leader.name}'s profile
        </Link>
      </div>
    </div>
  );
}
