import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/auth/user/${userId}`);
        setProfile(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (!userId) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500"></div>
            <p className="mt-4 text-sm text-slate-400">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center">
              {/* Profile Photo */}
              <div className="relative mb-4">
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile.name}
                    className="h-24 w-24 rounded-full border-4 border-slate-700 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-700 bg-gradient-to-br from-cyan-500 to-indigo-600 text-3xl font-bold text-white">
                    {profile.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <h2 className="text-2xl font-bold text-slate-100">
                {profile.name}
              </h2>

              {/* Email */}
              <p className="mt-1 text-sm text-slate-400">
                {profile.email}
              </p>

              {/* Member Since */}
              {profile.createdAt && (
                <p className="mt-2 text-xs text-slate-500">
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              )}
            </div>

            {/* Stats or Additional Info */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">
                  {profile.gigsCreated || 0}
                </div>
                <div className="text-xs text-slate-400">Gigs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">
                  {profile.bidsSubmitted || 0}
                </div>
                <div className="text-xs text-slate-400">Bids</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">
                  {profile.rating ? profile.rating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs text-slate-400">Rating</div>
              </div>
            </div>

            {/* Bio/Description if available */}
            {profile.bio && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  About
                </h3>
                <p className="text-sm text-slate-300 whitespace-pre-wrap break-all">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Link
                to={`/profile/${userId}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                onClick={onClose}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Full Profile
              </Link>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
