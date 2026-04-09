import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '/taskvra-logo-dark.svg';
import ProfileEditModal from './ProfileEditModal';

export default function Navbar() {
  const { user, isAuthenticated, requiresVerification } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminView = location.pathname.startsWith('/admin');
  const hasAdminAccess = ['admin', 'moderator'].includes(user?.role);

  const [openProfile, setOpenProfile] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const goAuthOr = (path) => {
    if (!isAuthenticated) {
      localStorage.setItem('intendedPath', path);
      navigate('/login');
      return;
    }

    navigate(path);
    setOpenMobile(false);
  };

  return (
    <>
      <nav className="relative z-20 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
          <Link to={isAdminView && hasAdminAccess ? '/admin' : '/'} className="flex items-center gap-2">
            {!logoError ? (
              <img
                src={logo}
                alt="Taskvra"
                className="h-10 w-auto select-none md:h-12"
                draggable="false"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-lg font-semibold text-cyan-400">Taskvra</span>
            )}
          </Link>

          <div className="hidden items-center gap-4 text-sm md:flex">
            {isAuthenticated ? (
              <>
                {isAdminView && hasAdminAccess ? (
                  <button onClick={() => goAuthOr('/admin')} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-100 hover:bg-cyan-400/20">
                    Admin Panel
                  </button>
                ) : (
                  <>
                    <Link to="/gigs" className="text-slate-300 hover:text-white">All Gigs</Link>
                    <button onClick={() => goAuthOr('/create-gig')} className="text-slate-300 hover:text-white">Post Gig</button>
                    <button onClick={() => goAuthOr('/my-gigs')} className="text-slate-300 hover:text-white">My Gigs</button>
                    <button onClick={() => goAuthOr('/my-bids')} className="text-slate-300 hover:text-white">My Bids</button>
                    <button onClick={() => goAuthOr('/messages')} className="text-slate-300 hover:text-white">Messages</button>
                    {hasAdminAccess ? (
                      <button onClick={() => goAuthOr('/admin')} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-100 hover:bg-cyan-400/20">
                        Admin Panel
                      </button>
                    ) : null}
                    <Link to="/about" className="text-slate-300 hover:text-white">About</Link>
                  </>
                )}

                <button
                  onClick={() => setOpenProfile(true)}
                  className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 hover:bg-slate-700"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-cyan-600 font-bold text-white">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
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

          <button
            onClick={() => setOpenMobile((prev) => !prev)}
            className="rounded-full border border-slate-800 px-3 py-1.5 text-sm text-slate-300 md:hidden"
          >
            Menu
          </button>
        </div>

        {openMobile && (
          <div className="mt-2 space-y-3 rounded-xl border border-slate-800 bg-slate-950/95 p-4 text-sm backdrop-blur-xl md:hidden">
            {isAuthenticated ? (
              <>
                {isAdminView && hasAdminAccess ? (
                  <button onClick={() => goAuthOr('/admin')} className="block rounded bg-cyan-500/15 py-2 text-center text-cyan-100">
                    Admin Panel
                  </button>
                ) : (
                  <>
                    <Link to="/gigs" onClick={() => setOpenMobile(false)} className="block text-slate-300">All Gigs</Link>
                    <button onClick={() => goAuthOr('/create-gig')} className="block text-slate-300">Post Gig</button>
                    <button onClick={() => goAuthOr('/my-gigs')} className="block text-slate-300">My Gigs</button>
                    <button onClick={() => goAuthOr('/my-bids')} className="block text-slate-300">My Bids</button>
                    <button onClick={() => goAuthOr('/messages')} className="block text-slate-300">Messages</button>
                    {hasAdminAccess ? (
                      <button onClick={() => goAuthOr('/admin')} className="block rounded bg-cyan-500/15 py-2 text-center text-cyan-100">
                        Admin Panel
                      </button>
                    ) : null}
                    <Link to="/about" onClick={() => setOpenMobile(false)} className="block text-slate-300">About</Link>
                  </>
                )}

                <button
                  onClick={() => {
                    setOpenProfile(true);
                    setOpenMobile(false);
                  }}
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
                <Link to="/find-freelance" onClick={() => setOpenMobile(false)} className="block text-slate-300">Find freelance</Link>
                <Link to="/find-work" onClick={() => setOpenMobile(false)} className="block text-slate-300">Find work</Link>
                <Link to="/solutions" onClick={() => setOpenMobile(false)} className="block text-slate-300">Solutions</Link>
                <Link to="/about" onClick={() => setOpenMobile(false)} className="block text-slate-300">About</Link>
                <Link to="/login" onClick={() => setOpenMobile(false)} className="block rounded border border-slate-700 py-2 text-center text-slate-200">
                  Login
                </Link>
                <Link to="/register" onClick={() => setOpenMobile(false)} className="block rounded bg-cyan-600 py-2 text-center text-white">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {requiresVerification && (
        <div className="mx-4 mt-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-200">
          Verify your email to unlock all features.
        </div>
      )}

      {openProfile && <ProfileEditModal onClose={() => setOpenProfile(false)} />}
    </>
  );
}
