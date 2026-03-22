import { Link } from 'react-router-dom';

export default function FindWork() {
  return (
    <div className="relative z-10">
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-cyan-400">Find Work</h1>
        <p className="mt-3 text-slate-300">
          Discover gigs that match your skills. Craft compelling bids and build lasting client relationships on Taskvra.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold text-white">How it works</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-300">
              <li>Browse gigs and review requirements</li>
              <li>Submit bids with pricing and timeline</li>
              <li>Chat with clients and get hired</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold text-white">Tips</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-300">
              <li>Show relevant portfolio samples</li>
              <li>Be clear and professional</li>
              <li>Set realistic timelines</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">Get Started</h2>
          <p className="mt-2 text-slate-300">Create an account to bid on gigs and message clients.</p>
          <div className="mt-4 flex gap-2">
            <Link to="/login" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800">
              Login
            </Link>
            <Link to="/register" className="rounded-full bg-cyan-600 px-4 py-1.5 text-white hover:bg-cyan-500">
              Register
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
