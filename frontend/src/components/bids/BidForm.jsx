import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitBid, clearMessages } from '../../features/bids/bidSlice';

export default function BidForm({ gigId, onSuccess }) {
  const [formData, setFormData] = useState({
    message: '',
    price: ''
  });

  const dispatch = useDispatch();
  const { isLoading, error, success } = useSelector((state) => state.bids);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(submitBid({
      gigId,
      ...formData,
      price: parseFloat(formData.price)
    }));

    if (result.type === 'bids/submitBid/fulfilled') {
      setFormData({ message: '', price: '' });
      setTimeout(() => {
        dispatch(clearMessages());
        if (onSuccess) onSuccess();
      }, 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.9)]">
      {error && (
        <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Your proposal
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            minLength={10}
            rows={3}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Explain how you’d deliver, past experience, and timing..."
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Your bid price (₹)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min={1}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-sky-400 via-indigo-500 to-fuchsia-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-90"
        >
          {isLoading ? 'Submitting...' : 'Submit bid'}
        </button>
      </form>
    </div>
  );
}
