import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, verifyEmailCode, resendVerificationCode } from '../../features/auth/authSlice';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [code, setCode] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, requiresVerification, pendingUserId, verificationInfo } = useSelector((state) => state.auth);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If user had intended to go somewhere else before login, go there
      const intendedPath = localStorage.getItem('intendedPath');
      if (intendedPath && intendedPath !== '/login') {
        localStorage.removeItem('intendedPath');
        navigate(intendedPath);
      } else {
        navigate('/gigs');
      }
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData));
    if (result.type === 'auth/login/fulfilled') {
      const payload = result.payload;
      if (payload?.requiresVerification) {
        return; // show code input UI
      }
      // Small delay to ensure cookie is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/gigs');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const result = await dispatch(verifyEmailCode({ userId: pendingUserId, code }));
    if (result.type === 'auth/verifyEmailCode/fulfilled') {
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/gigs');
    }
  };

  const handleResend = async () => {
    await dispatch(resendVerificationCode({ userId: pendingUserId, email: formData.email }));
  };

  return (
    <div className="flex min-h-[calc(100vh-96px)] items-center justify-center py-10">
      <div className="grid w-full max-w-4xl gap-10 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.95)] backdrop-blur-2xl md:grid-cols-[1.1fr,0.9fr] md:p-10">
        <div className="flex flex-col justify-center">
          <h2 className="bg-linear-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            Welcome back,
            <span className="block text-base font-normal text-slate-400 sm:text-lg">
              log in to find your next project or hire top talent.
            </span>
          </h2>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
              
            </span>
            <p>
              Stay signed in to track bids in real-time and never miss a hire notification.
            </p>
          </div>

          {!requiresVerification && (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-sky-400 via-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(56,189,248,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-90"
            >
              {isLoading ? 'Logging in...' : 'Continue to dashboard'}
            </button>
          </form>
          )}

          {requiresVerification && (
          <form onSubmit={handleVerify} className="mt-7 space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-200">
              {verificationInfo || 'Enter the 6-digit code sent to your email.'}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Verification Code
              </label>
              <input
                type="text"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResend}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                Resend code
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-emerald-400 via-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(6,182,212,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-90"
            >
              {isLoading ? 'Verifying...' : 'Verify and continue'}
            </button>
          </form>
          )}

          {!requiresVerification && (
          <p className="mt-4 text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              Create one in seconds
            </Link>
          </p>
          )}
        </div>

        <div className="hidden flex-col justify-between rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),rgba(15,23,42,1)_55%)] px-5 py-6 text-xs text-slate-300 md:flex">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Live marketplace
            </p>
            <p className="mt-2 text-base font-medium text-slate-50">
              Match with gigs in real time.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
              See new opportunities the moment they are posted, submit smarter bids,
              and get notified instantly when you&apos;re hired.
            </p>
          </div>

          <div className="mt-6 space-y-2 rounded-2xl bg-slate-900/60 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Today on Taskvra
            </p>
            <div className="flex items-center justify-between text-[13px] text-slate-300">
              <span>Median gig budget</span>
              <span className="font-semibold text-sky-400">₹70,000</span>
            </div>
            <div className="flex items-center justify-between text-[13px] text-slate-300">
              <span>Average time to hire</span>
              <span className="font-semibold text-emerald-400">3 hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}