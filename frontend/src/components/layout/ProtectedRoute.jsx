import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  // If auth check is still in progress, show loading screen
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-3 text-sm text-slate-300 shadow-[0_20px_55px_rgba(15,23,42,0.95)]">
          <span className="h-2 w-2 animate-ping rounded-full bg-sky-400" />
          <span>Loading your workspace...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, save the intended path and redirect to login
  if (!isAuthenticated) {
    localStorage.setItem('intendedPath', location.pathname);
    return <Navigate to="/login" />;
  }

  // User is authenticated, render the protected component
  return children;
}