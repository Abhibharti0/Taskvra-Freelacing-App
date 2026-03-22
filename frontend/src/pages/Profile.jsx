import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import ProfileEditModal from '../components/layout/ProfileEditModal';

export default function Profile() {
  const { userId } = useParams();
  const { user: me } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/auth/user/${userId}`);
        setProfile(data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back button */}
      <div className="mb-3">
        <button
          onClick={() => {
            // Navigate back if possible, else go to gigs
            if (window.history.length > 1) navigate(-1);
            else navigate('/gigs');
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800"
        >
          <span className="h-3 w-3 rotate-180">➜</span>
          Back
        </button>
      </div>
      {loading && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6 text-slate-400">Loading profile...</div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/50 p-6 text-red-300">{error}</div>
      )}
      {profile && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-900/40 px-3 py-2">
            <img
              src={profile.profilePhoto || '/public/avatar-placeholder.png'}
              alt={profile.name}
              className="h-14 w-14 rounded-xl object-cover border border-slate-600"
            />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-100">{profile.name}</h1>
              {profile.role && (
                <p className="text-[12px] text-slate-400">Role: {profile.role}</p>
              )}
              <div className="mt-1 text-[12px] text-slate-400">
                Rating: {Number(profile.ratingAvg || 0).toFixed(1)} / 5 · {profile.ratingCount || 0} ratings
              </div>
            </div>
            {me?.id === userId && (
              <button
                className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white hover:bg-cyan-700"
                onClick={() => setShowEdit(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-300">Bio</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
              {profile.bio || 'No bio yet.'}
            </p>
          </div>
        </div>
      )}

      {showEdit && <ProfileEditModal onClose={() => setShowEdit(false)} />}
    </div>
  );
}