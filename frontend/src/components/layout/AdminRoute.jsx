import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-3 text-sm text-slate-300">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
          <span>Loading admin workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    localStorage.setItem('intendedPath', location.pathname);
    return <Navigate to="/admin/login" replace />;
  }

  const hasAdminAccess = ['admin', 'moderator'].includes(user?.role);
  if (!hasAdminAccess) {
    return <Navigate to="/gigs" replace />;
  }

  return children;
}
