import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyGigs } from '../features/gigs/gigSlice';

export default function MyGigs() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myGigs, isLoading } = useSelector((state) => state.gigs);

  useEffect(() => {
    dispatch(fetchMyGigs());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="bg-linear-to-r from-sky-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
            Your posted gigs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track interest, compare bids, and move quickly on your top candidates.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/70 py-16 text-slate-400">
          <div className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 animate-ping rounded-full bg-sky-400" />
            Loading your gigs...
          </div>
        </div>
      ) : myGigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 py-16 text-center">
          <p className="text-sm font-medium text-slate-300">
            You haven&apos;t created any gigs yet.
          </p>
          <p className="text-xs text-slate-500">
            Post your first gig and start receiving tailored bids from freelancers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {myGigs.map((gig) => (
            <div
              key={gig._id}
              className="glass-card gradient-border flex h-full flex-col rounded-2xl p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold tracking-tight text-slate-50">
                  {gig.title}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    gig.status === 'open'
                      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40'
                      : 'bg-slate-700/60 text-slate-300 ring-1 ring-slate-500/40'
                  }`}
                >
                  {gig.status}
                </span>
              </div>

              <p className="mb-3 text-xs leading-relaxed text-slate-300 line-clamp-3">
                {gig.description}
              </p>

              <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                <span>Budget</span>
                <span className="text-sm font-semibold text-sky-300">
                  ₹{gig.budget}
                </span>
              </div>

              <button
                onClick={() => navigate(`/gig/${gig._id}/bids`)}
                className="mt-auto w-full rounded-xl border border-slate-600/80 bg-slate-900 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-400/70 hover:bg-slate-800"
              >
                View bids for this gig
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}