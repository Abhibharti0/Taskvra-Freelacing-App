import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './features/auth/authSlice';

// Components
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import NotificationToast from './components/notifications/NotificationToast';
import ChatBotWidget from './components/layout/ChatBotWidget';
import Footer from './components/layout/Footer';

// Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import GigList from './components/gigs/GigList';
import CreateGig from './components/gigs/CreateGig';
import BidList from './components/bids/BidList';
import MyGigs from './pages/MyGigs';
import MyBids from './pages/MyBids';
import Messages from './pages/Messages';
import About from './pages/about';
import FindFreelance from './pages/FindFreelance';
import FindWork from './pages/FindWork';
import Solutions from './pages/Solutions';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

import Landing from './pages/Landing';


function AppRoutes() {
  const dispatch = useDispatch();
  const { hasCheckedAuth } = useSelector((state) => state.auth);
  const location = useLocation();

  // Check authentication once on app mount
  useEffect(() => {
    if (!hasCheckedAuth) {
      dispatch(getMe());
    }
  }, [dispatch, hasCheckedAuth]);

  // Debug: log current location
  useEffect(() => {
    console.log('Current location:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.18)_0,rgba(2,6,23,1)_60%,rgba(0,0,0,1)_100%)] text-slate-100">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Glow background */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-0 flex justify-center overflow-hidden">
          <div className="h-75 w-225 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.25),transparent_65%)] blur-3xl" />
        </div>

        <Navbar />

        {/* Global notification toast */}
        <NotificationToast />

        <main className="relative z-10 pb-10 pt-6 sm:pt-8">
          <Routes>
            {/* Default route: send root to gigs list */}
            <Route path="/" element={<Landing />} />

            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login mode="admin" />} />
            <Route path="/register" element={<Register />} />

            <Route path="/gigs" element={<GigList />} />
            <Route path="/about" element={<About />} />
            <Route path="/find-freelance" element={<FindFreelance />} />
            <Route path="/find-work" element={<FindWork />} />
            <Route path="/solutions" element={<Solutions />} />

            {/* Public profile page */}
            <Route path="/profile/:userId" element={<Profile />} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

            <Route
              path="/create-gig"
              element={
                <ProtectedRoute>
                  <CreateGig />
                </ProtectedRoute>
              }
            />

            <Route
              path="/gig/:gigId/bids"
              element={
                <ProtectedRoute>
                  <BidList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-gigs"
              element={
                <ProtectedRoute>
                  <MyGigs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-bids"
              element={
                <ProtectedRoute>
                  <MyBids />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Fallback: any unknown path goes to gigs */}
            <Route path="*" element={<Navigate to="/gigs" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Corner chatbot */}
        <ChatBotWidget />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
