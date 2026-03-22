import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGigs } from '../../features/gigs/gigSlice';
import GigCard from './GigCard';

export default function GigList() {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const { gigs, isLoading } = useSelector((state) => state.gigs);

  useEffect(() => {
    dispatch(fetchGigs());
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchGigs(searchQuery));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="bg-linear-to-r from-sky-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
            Explore open gigs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse available projects • Submit a bid • Start earning
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="w-full sm:w-auto"
        >
          <div className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-2 py-1.5 shadow-[0_14px_40px_rgba(15,23,42,0.9)]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gigs by title or keyword..."
              className="flex-1 bg-transparent px-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 ring-1 ring-slate-700/80 transition hover:bg-slate-800 hover:text-white"
            >
              <span>Search</span>
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/70 py-16 text-slate-400">
          <div className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 animate-ping rounded-full bg-sky-400" />
            Loading gigs in real time...
          </div>
        </div>
      ) : gigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 py-16 text-center">
          <p className="text-sm font-medium text-slate-300">
            {searchQuery ? 'No open gigs match your search.' : 'No open gigs available right now.'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery ? 'Try different keywords or check back later.' : 'Check back soon - new gigs are posted daily!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {gigs.map((gig) => (
            <GigCard key={gig._id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}