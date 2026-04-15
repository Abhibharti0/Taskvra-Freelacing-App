import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError, verifyEmailCode, resendVerificationCode } from '../../features/auth/authSlice';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'client',
    bio: '',
    profilePhoto: null
  });
  const [code, setCode] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const nameHasNumbers = /\d/.test(formData.name);
  const emailHasCaps = /[A-Z]/.test(formData.email);
  const phoneIsInvalid = formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, requiresVerification, pendingUserId, verificationInfo } = useSelector((state) => state.auth);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If user had intended to go somewhere else before registration, go there
      const intendedPath = localStorage.getItem('intendedPath');
      if (intendedPath && intendedPath !== '/register') {
        localStorage.removeItem('intendedPath');
        navigate(intendedPath);
      } else {
        navigate('/gigs');
      }
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phoneNumber: digitsOnly });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePhoto: file });
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nameHasNumbers) {
      return;
    }

    if (emailHasCaps) {
      return;
    }

    if (phoneIsInvalid) {
      return;
    }
    
    // Create FormData to handle file upload
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    if (formData.phoneNumber) submitData.append('phoneNumber', formData.phoneNumber);
    submitData.append('password', formData.password);
    submitData.append('role', formData.role);
    if (formData.bio) submitData.append('bio', formData.bio);
    if (formData.profilePhoto) submitData.append('profilePhoto', formData.profilePhoto);
    
    const result = await dispatch(register(submitData));
    if (result.type === 'auth/register/fulfilled') {
      const payload = result.payload;
      if (payload?.requiresVerification) {
        return; // Show verification UI
      }
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
            Create your Taskvra profile
            <span className="block text-base font-normal text-slate-400 sm:text-lg">
              One account to manage gigs, bids, and hires.
            </span>
          </h2>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
              
            </span>
            <p>
              Free to sign up. Only pay when you hire or get hired — keep full control over your work.
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
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                pattern="^[^0-9]*$"
                title="Name cannot contain numbers"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              />
              <p className="mt-1 text-xs text-slate-500">Use letters and spaces only</p>
              {nameHasNumbers && (
                <p className="text-xs text-red-300">Name cannot contain numbers</p>
              )}
            </div>

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
                autoCapitalize="none"
                autoCorrect="off"
                pattern="^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                title="Email cannot contain capital letters"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              />
              <p className="mt-1 text-xs text-slate-500">Use lowercase letters only</p>
              {emailHasCaps && (
                <p className="text-xs text-red-300">Email cannot contain capital letters</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Phone Number <span className="text-slate-600">(Optional)</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                pattern="^[0-9]{10}$"
                title="Phone number must be exactly 10 digits"
                placeholder="Enter your phone number"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              />
              <p className="mt-1 text-xs text-slate-500">Digits only, exactly 10 characters</p>
              {phoneIsInvalid && (
                <p className="text-xs text-red-300">Phone number must be exactly 10 digits</p>
              )}
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
                minLength={6}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              />
              <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                I want to
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="client">Hire freelancers (Client)</option>
                <option value="freelancer">Work as a freelancer</option>
                <option value="both">Both hire and work</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Bio <span className="text-slate-600">(Optional)</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/40 resize-none"
              />
              <p className="mt-1 text-xs text-slate-500">{formData.bio.length}/500 characters</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Profile Photo <span className="text-slate-600">(Optional)</span>
              </label>
              <div className="flex items-center gap-4">
                {profilePhotoPreview && (
                  <img 
                    src={profilePhotoPreview} 
                    alt="Preview" 
                    className="h-16 w-16 rounded-full border-2 border-slate-700 object-cover"
                  />
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-400 transition hover:border-sky-500/50 hover:bg-slate-900/60">
                    <span>{formData.profilePhoto ? formData.profilePhoto.name : 'Choose a photo'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-sky-400 via-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(56,189,248,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-90"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
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
              {isLoading ? 'Verifying...' : 'Verify and create account'}
            </button>
          </form>
          )}

          {!requiresVerification && (
          <p className="mt-4 text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              Log in
            </Link>
          </p>
          )}
        </div>

        <div className="hidden flex-col justify-between rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.2),rgba(15,23,42,1)_55%)] px-5 py-6 text-xs text-slate-300 md:flex">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Build your crew
            </p>
            <p className="mt-2 text-base font-medium text-slate-50">
              Run your entire freelance workflow in one place.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
              Post roles, review bids, and collaborate with talent without leaving Taskvra.
              Perfect for solo founders and scaling teams.
            </p>
          </div>

          <div className="mt-6 space-y-2 rounded-2xl bg-slate-900/60 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Why teams choose Taskvra
            </p>
            <div className="flex items-center justify-between text-[13px] text-slate-300">
              <span>Verified professionals</span>
              <span className="font-semibold text-emerald-400">Top 10%</span>
            </div>
            <div className="flex items-center justify-between text-[13px] text-slate-300">
              <span>Avg. response time</span>
              <span className="font-semibold text-sky-400">&lt; 30 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}