import { Link } from 'react-router-dom';
import logoSvg from '/taskvra-logo-dark.svg';

export default function Footer() {
  return (
    <footer className="relative z-10 mt-10 border-t border-slate-800/60 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Brand row */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoSvg} alt="Taskvra" className="h-8 w-auto" />
            <span className="sr-only">Taskvra</span>
          </Link>
          <span className="text-xs text-slate-400">Empowering clients and freelancers worldwide</span>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-400">Categories</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>Graphics & Design</li>
              <li>Digital Marketing</li>
              <li>Writing & Translation</li>
              <li>Video & Animation</li>
              <li>Music & Audio</li>
              <li>Programming & Tech</li>
              <li>AI Services</li>
              <li>Consulting</li>
              <li>Data</li>
              <li>Business</li>
            </ul>
          </div>

          {/* For Clients */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-400">For Clients</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link to="/about" className="hover:text-white">How Taskvra Works</Link></li>
              <li><Link to="/find-freelance" className="hover:text-white">Customer Success Stories</Link></li>
              <li><Link to="/gigs" className="hover:text-white">Browse Freelance By Skill</Link></li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-400">For Freelancers</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link to="/find-work" className="hover:text-white">Become a Freelancer</Link></li>
              <li><a href="#" className="hover:text-white">Community Hub</a></li>
              <li><a href="#" className="hover:text-white">Events</a></li>
            </ul>
          </div>

          {/* Business */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-400">Business</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white">Taskvra Pro</a></li>
              <li><a href="#" className="hover:text-white">Expert Sourcing</a></li>
              <li><a href="#" className="hover:text-white">Contact Sales</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 border-t border-slate-800/60 pt-6">
          <h3 className="text-sm font-semibold text-cyan-400">Stay in the loop</h3>
          <p className="mt-2 text-sm text-slate-300">
            Subscribe for tips and updates on Taskvra features.
          </p>

          <form className="mt-4 flex max-w-md gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500">
              Subscribe
            </button>
          </form>
        </div>

        <div className="mt-8 border-t border-slate-800/60 pt-4 flex items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Taskvra International Ltd.</p>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
