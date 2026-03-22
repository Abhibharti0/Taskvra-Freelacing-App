import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="relative overflow-hidden">

      {/* Glow BG */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[380px] w-[380px] bg-cyan-500/20 blur-3xl rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[380px] w-[380px] bg-purple-500/20 blur-3xl rounded-full animate-pulse" />
      </div>

      {/* ================= HERO ================= */}
      <section className="text-center py-28 px-6">

        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Taskvra Freelance Marketplace
        </h1>

        <p className="mt-6 text-slate-300 max-w-2xl mx-auto">
          Hire freelancers, post projects, collaborate in real-time, and grow
          with AI-powered freelancing tools.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/gigs"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition shadow-lg shadow-cyan-500/20"
          >
            Browse Gigs
          </Link>

          <Link
            to="/register"
            className="px-6 py-3 rounded-lg border border-slate-700 hover:border-cyan-400 transition"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="py-16 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-6">
          {[
            ["10K+", "Freelancers"],
            ["5K+", "Projects Posted"],
            ["98%", "Success Rate"],
            ["24/7", "Support"],
          ].map(([num, label]) => (
            <div
              key={label}
              className="rounded-xl bg-slate-900/70 border border-slate-800 p-6 backdrop-blur shadow-md"
            >
              <h3 className="text-3xl font-bold text-cyan-400">{num}</h3>
              <p className="text-slate-400 mt-1 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-10 text-center">
          Browse by Category
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            "Web Development",
            "App Development",
            "UI/UX Design",
            "Graphic Design",
            "Content Writing",
            "Video Editing",
            "SEO Marketing",
            "AI Services",
          ].map((c) => (
            <div
              key={c}
              className="p-6 rounded-xl border border-slate-800 bg-slate-900/70 hover:-translate-y-1 transition hover:shadow-cyan-500/20"
            >
              <p className="font-semibold">{c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-20 bg-slate-950/60">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto px-6">
          {[
            ["Post a Job", "Describe your project & budget"],
            ["Get Bids", "Freelancers send proposals"],
            ["Hire & Work", "Chat & collaborate easily"],
            ["Pay Securely", "Release payment after approval"],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur shadow-md text-center"
            >
              <h3 className="font-semibold text-cyan-400">{title}</h3>
              <p className="text-slate-400 mt-2 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 text-center">

        <h2 className="text-4xl font-bold">
          Start your freelance journey today
        </h2>

        <p className="mt-4 text-slate-400">
          Join thousands of freelancers and clients already using Taskvra.
        </p>

        <Link
          to="/register"
          className="inline-block mt-8 px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition shadow-lg shadow-cyan-500/20"
        >
          Get Started Now
        </Link>

      </section>

    </div>
  );
}
