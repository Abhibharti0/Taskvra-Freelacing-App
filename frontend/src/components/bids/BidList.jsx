import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchBidsForGig, hireBid, clearMessages } from '../../features/bids/bidSlice';
import { getOrCreateConversation } from '../../features/messages/messageSlice';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

export default function BidList() {
  const { gigId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bids, isLoading, error, success } = useSelector((state) => state.bids);
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();
  const [ratings, setRatings] = useState({}); // bidId -> {stars, comment}

  const formatCurrency = (amount, currency) => {
    if (!amount) return '';
    const num = Number(amount);
    const code = (currency || 'INR').toUpperCase();
    const symbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
    const symbol = symbols[code] || '';
    return symbol ? `${symbol}${num}` : `${num} ${code}`;
  };

  useEffect(() => {
    dispatch(fetchBidsForGig(gigId));
  }, [dispatch, gigId]);

  // Fetch ratings for hired bids
  useEffect(() => {
    const loadRatings = async () => {
      const hiredBids = (bids || []).filter((b) => b.status === 'hired');
      const promises = hiredBids.map(async (b) => {
        try {
          const { data } = await api.get(`/ratings/bid/${b._id}`);
          if (data?.rating) {
            setRatings((prev) => ({ ...prev, [b._id]: data.rating }));
          }
        } catch (e) {
          // ignore per-bid failures
        }
      });
      await Promise.all(promises);
    };
    if (bids?.length) loadRatings();
  }, [bids]);

  const handleHire = async (bidId) => {
    if (window.confirm('Are you sure you want to hire this freelancer?')) {
      const result = await dispatch(hireBid(bidId));
      // Refresh bids list to show updated statuses
      if (result.type === 'bids/hireBid/fulfilled') {
        dispatch(fetchBidsForGig(gigId));
        toast.success('Freelancer hired successfully! You can now message them.');
      }
      setTimeout(() => dispatch(clearMessages()), 3000);
    }
  };

  // Open conversation with hired freelancer
  const handleStartConversation = async (bid) => {
    try {
      const result = await dispatch(getOrCreateConversation(bid._id));
      if (result.type === 'messages/getOrCreateConversation/fulfilled') {
        toast.success('Opening conversation...');
        // Navigate to messages page with a small delay to let the conversation load
        setTimeout(() => {
          navigate('/messages', { state: { conversationId: result.payload._id } });
        }, 300);
      } else {
        toast.error('Failed to open conversation');
      }
    } catch (err) {
      toast.error('Failed to open conversation');
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });

  const handlePayNow = async (bid) => {
    try {
      const { data } = await api.post(`/payments/orders/${bid._id}`);
      const { order, keyId } = data;

      await loadRazorpayScript();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Taskvra',
        description: `Payment for gig bid ${bid._id}`,
        order_id: order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        notes: order.notes || {},
        handler: async function (response) {
          try {
            await api.post('/payments/verify', {
              bidId: bid._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment successful!');
            dispatch(fetchBidsForGig(gigId));
          } catch (err) {
            console.error('Payment verification failed:', err);
            toast.error('Payment verification failed');
          }
        },
        theme: { color: '#10b981' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        const err = response?.error || {};
        const msg = err.description || err.reason || 'Payment failed';
        toast.error(`Payment failed: ${msg}`);
        console.error('Razorpay payment failed:', {
          code: err.code,
          description: err.description,
          reason: err.reason,
          source: err.source,
          step: err.step,
          metadata: err.metadata
        });
      });
      rzp.open();
    } catch (err) {
      console.error('Create order failed:', err);
      toast.error(err.response?.data?.message || 'Unable to initiate payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="bg-linear-to-r from-emerald-300 via-sky-200 to-indigo-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
            Bids for this gig
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review proposals and hire the freelancer that best matches your needs.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/70 py-16 text-slate-400">
          <div className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 animate-ping rounded-full bg-emerald-400" />
            Loading bids...
          </div>
        </div>
      ) : bids.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 py-16 text-center">
          <p className="text-sm font-medium text-slate-300">
            No bids for this gig yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Share your gig to attract qualified freelancers faster.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div
              key={bid._id}
              className="glass-card flex flex-col rounded-2xl p-5 text-xs text-slate-100"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/profile/${bid.freelancerId?._id || bid.freelancerId}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 font-medium text-slate-200 hover:text-cyan-300 transition"
                    title="View freelancer profile"
                  >
                    <img
                      src={bid.freelancerId?.profilePhoto || '/public/avatar-placeholder.png'}
                      alt={bid.freelancerId?.name || 'Freelancer'}
                      className="h-6 w-6 rounded-md object-cover border border-slate-700"
                    />
                    <span>{bid.freelancerId?.name}</span>
                  </Link>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {bid.freelancerId?.email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-emerald-300">
                    ₹{bid.price}
                  </div>
                  <span
                    className={`mt-1 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                      bid.status === 'hired'
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40'
                        : bid.status === 'rejected'
                        ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/40'
                        : 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/40'
                    }`}
                  >
                    {bid.status}
                  </span>
                </div>
              </div>

              <p className="mb-4 text-xs leading-relaxed text-slate-200">
                {bid.message}
              </p>

              {bid.status === 'pending' && (
                <button
                  onClick={() => handleHire(bid._id)}
                  disabled={isLoading}
                  className="mt-auto inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-emerald-400 via-sky-400 to-cyan-400 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_18px_40px_rgba(52,211,153,0.8)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hire this freelancer and start working together"
                >
                  {isLoading ? 'Hiring...' : 'Hire this freelancer'}
                </button>
              )}

              {bid.status === 'hired' && !bid.payment?.paid && (
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() => handlePayNow(bid)}
                    disabled={isLoading}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_12px_28px_rgba(245,158,11,0.5)] transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                  <button
                    onClick={() => handleStartConversation(bid)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    💬 Start Conversation
                  </button>
                  <p className="text-center text-[10px] text-slate-500">
                    💡 Click to message and discuss project details
                  </p>
                </div>
              )}

              {bid.status === 'hired' && bid.payment?.paid && (
                <div className="mt-2 space-y-2">
                  <div className="text-[11px] text-slate-400">
                    Payment received{bid.payment?.amount ? `: ${formatCurrency(bid.payment.amount, bid.payment.currency)}` : ''}
                  </div>
                  <button
                    onClick={() => handleStartConversation(bid)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    💬 Message Freelancer
                  </button>
                </div>
              )}

              {/* Rating UI for hired bids (client side) */}
              {bid.status === 'hired' && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Your rating:</span>
                  <select
                    className="rounded-md bg-slate-900 px-2 py-1 text-[11px]"
                    value={ratings[bid._id]?.stars || ''}
                    onChange={(e) => {
                      const stars = Number(e.target.value);
                      setRatings((prev) => ({ ...prev, [bid._id]: { ...(prev[bid._id] || {}), stars } }));
                    }}
                  >
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Optional comment"
                    className="flex-1 rounded-md bg-slate-900 px-2 py-1 text-[11px]"
                    value={ratings[bid._id]?.comment || ''}
                    onChange={(e) => {
                      const comment = e.target.value;
                      setRatings((prev) => ({ ...prev, [bid._id]: { ...(prev[bid._id] || {}), comment } }));
                    }}
                  />
                  <button
                    className="rounded-md bg-emerald-500 px-3 py-1 text-[11px] text-slate-900"
                    onClick={async () => {
                      const sel = ratings[bid._id]?.stars;
                      if (!sel) {
                        toast.error('Please select a star rating');
                        return;
                      }
                      try {
                        const { data } = await api.post(`/ratings/${bid._id}`, { stars: sel, comment: ratings[bid._id]?.comment || '' });
                        setRatings((prev) => ({ ...prev, [bid._id]: data.rating }));
                        toast.success('Rating saved');
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to save rating');
                      }
                    }}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}