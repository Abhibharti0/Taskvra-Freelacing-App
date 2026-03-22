import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createGig } from '../../features/gigs/gigSlice';

export default function CreateGig() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: ''
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.gigs);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createGig({
      ...formData,
      budget: parseFloat(formData.budget)
    }));
    
    if (result.type === 'gigs/createGig/fulfilled') {
      navigate('/my-gigs');
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-4 bg-linear-to-r from-sky-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
        Create a new gig
      </h1>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="glass-card space-y-4 rounded-3xl p-6 sm:p-7"
      >
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            minLength={5}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            minLength={20}
            rows={5}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Share scope, expectations, and any requirements so freelancers can send great bids."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Budget (₹)
          </label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            required
            min={1}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-sky-400 via-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(56,189,248,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-90"
        >
          {isLoading ? 'Creating...' : 'Create gig'}
        </button>
      </form>
    </div>
  );
}
