import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import BidForm from '../bids/BidForm';

export default function GigCard({ gig }) {
  const [showBidForm, setShowBidForm] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isOwner = user?.id === gig.ownerId?._id || user?.id === gig.ownerId?.id;
  const canSubmitBid = user?.role === 'freelancer' || user?.role === 'both';

  return (
    <div className="glass-card gradient-border relative flex h-full flex-col rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_65px_rgba(15,23,42,1)]">
      <div className="mb-3 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${gig.ownerId?._id || gig.ownerId?.id || gig.ownerId}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 font-medium text-slate-200 hover:text-cyan-300"
              title="View client profile"
            >
              <img
                src={gig.ownerId?.profilePhoto || '/public/avatar-placeholder.png'}
                alt={gig.ownerId?.name || 'Client'}
                className="h-6 w-6 rounded-md object-cover border border-slate-700"
              />
              <span>{gig.ownerId?.name || 'Anonymous'}</span>
            </Link>
            <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 font-semibold text-cyan-200">
              <span className="text-sm">₹{gig.budget}</span>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              gig.status === 'open'
                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40'
                : 'bg-slate-700/60 text-white ring-1 ring-slate-500/40'
            }`}
          >
            {gig.status}
          </span>
        </div>
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-neutral-50">
        {gig.title}
      </h3>
      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {/* Subtitle kept minimal */}
      </p>

      <p className="mb-4 text-xs leading-relaxed text-white line-clamp-3">
        {gig.description}
      </p>

      <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span>Fixed budget</span>
        </span>
        {/* Owner box moved to top-right; keep right side empty here */}
        <span />
      </div>

      {!isOwner && gig.status === 'open' && canSubmitBid && (
        <>
          <button
            onClick={() => setShowBidForm(!showBidForm)}
            className="w-full rounded-xl bg-slate-100/95 py-2 text-xs font-semibold text-slate-950 shadow-[0_14px_35px_rgba(148,163,184,0.45)] transition hover:bg-white"
          >
            {showBidForm ? 'Cancel' : 'Submit Bid'}
          </button>

          {showBidForm && (
            <div className="mt-4">
              <BidForm gigId={gig._id} onSuccess={() => setShowBidForm(false)} />
            </div>
          )}
        </>
      )}

      {isOwner && (
        <button
          onClick={() => navigate(`/gig/${gig._id}/bids`)}
          className="w-full rounded-xl border border-slate-600/80 bg-slate-900 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-800"
        >
          View Bids
        </button>
      )}
    </div>
  );
}