import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateProfile } from '../../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import logo from '/taskvra-logo-dark.svg'; // SVG logo added
import ProfileEditModal from './ProfileEditModal';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, requiresVerification } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [openProfile, setOpenProfile] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(null);
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (name) fd.append('name', name);
    if (photo) fd.append('profilePhoto', photo);

    const res = await dispatch(updateProfile(fd));
    if (res.type.endsWith('fulfilled')) {
      setOpenProfile(false);
      setPhoto(null);
    }
  };

  const goAuthOr = (path) => {
    if (!isAuthenticated) {
      localStorage.setItem('intendedPath', path);
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="relative z-20 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            {!logoError ? (
              <img
                src={logo}
                alt="Taskvra"
                className="h-10 md:h-12 w-auto select-none"
                draggable="false"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-lg font-semibold text-cyan-400">Taskvra</span>
            )}
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-4 text-sm">

            {isAuthenticated ? (
              <>
                <Link to="/gigs" className="text-slate-300 hover:text-white">All Gigs</Link>
                <button onClick={() => goAuthOr('/create-gig')} className="text-slate-300 hover:text-white">Post Gig</button>
                <button onClick={() => goAuthOr('/my-gigs')} className="text-slate-300 hover:text-white">My Gigs</button>
                <button onClick={() => goAuthOr('/my-bids')} className="text-slate-300 hover:text-white">My Bids</button>
                <button onClick={() => goAuthOr('/messages')} className="text-slate-300 hover:text-white">Messages</button>
                <Link to="/about" className="text-slate-300 hover:text-white">About</Link>

                {/* Profile */}
                <button
                  onClick={() => setOpenProfile(true)}
                  className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 hover:bg-slate-700"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-cyan-600 flex items-center justify-center text-white font-bold">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="text-white">{user?.name}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/find-freelance" className="text-slate-300 hover:text-white">Find freelance</Link>
                <Link to="/find-work" className="text-slate-300 hover:text-white">Find work</Link>
                <Link to="/solutions" className="text-slate-300 hover:text-white">Solutions</Link>
                <Link to="/about" className="text-slate-300 hover:text-white">About</Link>

                <Link to="/login" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800">
                  Login
                </Link>
                <Link to="/register" className="rounded-full bg-cyan-600 px-4 py-1.5 text-white hover:bg-cyan-500">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setOpenMobile(!openMobile)}
            className="md:hidden text-slate-300"
          >
            ☰
          </button>
        </div>

        {/* MOBILE MENU */}
        {openMobile && (
          <div className="md:hidden mt-2 rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl p-4 space-y-3 text-sm">

            {isAuthenticated ? (
              <>
                <Link to="/gigs" className="block text-slate-300">All Gigs</Link>
                <button onClick={() => goAuthOr('/create-gig')} className="block text-slate-300">Post Gig</button>
                <button onClick={() => goAuthOr('/my-gigs')} className="block text-slate-300">My Gigs</button>
                <button onClick={() => goAuthOr('/my-bids')} className="block text-slate-300">My Bids</button>
                <button onClick={() => goAuthOr('/messages')} className="block text-slate-300">Messages</button>
                <Link to="/about" className="block text-slate-300">About</Link>

                <button
                  onClick={() => setOpenProfile(true)}
                  className="w-full rounded bg-slate-800 py-2 text-white"
                >
                  Edit Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full rounded bg-red-600 py-2 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/find-freelance" className="block text-slate-300">Find freelance</Link>
                <Link to="/find-work" className="block text-slate-300">Find work</Link>
                <Link to="/solutions" className="block text-slate-300">Solutions</Link>
                <Link to="/about" className="block text-slate-300">About</Link>

                <Link to="/login" className="block rounded border border-slate-700 py-2 text-center text-slate-200">
                  Login
                </Link>
                <Link to="/register" className="block rounded bg-cyan-600 py-2 text-center text-white">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Verification Banner */}
      {requiresVerification && (
        <div className="mx-4 mt-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-200">
          Verify your email to unlock all features.
        </div>
      )}

      {/* Profile Edit Modal */}
      {openProfile && (
        <ProfileEditModal onClose={() => setOpenProfile(false)} />
      )}
    </>
  );
}
