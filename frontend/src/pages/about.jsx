export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">

      {/* Animated Glow Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[380px] w-[380px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[380px] w-[380px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* HERO */}
        <div className="text-center animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
            About Taskvra
          </h1>

          <p className="mt-5 text-slate-300 max-w-2xl mx-auto">
            A next-generation freelance marketplace built for speed, trust, and clarity.
            Connect talent with opportunity using modern tools, real-time collaboration,
            and AI-powered assistance.
          </p>
        </div>

        {/* GLASS CARD */}
        <section className="mt-14 rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-500/10">

          {/* MISSION + FEATURES */}
          <div className="grid gap-6 md:grid-cols-2">

            <div className="group rounded-xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:shadow-indigo-500/20 shadow-lg">
              <h2 className="text-xl font-semibold group-hover:text-indigo-400 transition">Mission</h2>
              <p className="mt-3 text-slate-300 text-sm">
                Empower freelancers and clients to collaborate seamlessly through
                transparent workflows, secure authentication, and real-time communication.
              </p>
            </div>

            <div className="group rounded-xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:shadow-pink-500/20 shadow-lg">
              <h2 className="text-xl font-semibold group-hover:text-pink-400 transition">Core Features</h2>
              <ul className="mt-3 space-y-2 text-slate-300 text-sm">
                <li>⚡ Gig posting & smart bidding</li>
                <li>🔐 Secure login & email verification</li>
                <li>💬 Real-time chat & notifications</li>
                <li>🖼️ Profile & portfolio management</li>
                <li>🤖 AI freelancing assistant</li>
              </ul>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              ["10K+", "Freelancers"],
              ["5K+", "Projects Posted"],
              ["98%", "Success Rate"],
              ["24/7", "AI Support"],
            ].map(([num, label]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-indigo-500/5"
              >
                <div className="text-2xl font-bold text-violet-400">{num}</div>
                <div className="text-xs text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* BRAND */}
          <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner shadow-pink-500/10">
            <h2 className="text-xl font-semibold">Brand</h2>
            <p className="mt-3 text-slate-300 text-sm">
              Taskvra represents a modern, reliable ecosystem where talent meets
              opportunity. Clean UI, fast workflows, and intelligent assistance
              ensure a smooth freelancing experience.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-14 text-center">
          <h3 className="text-2xl font-semibold">Start Your Journey with Taskvra</h3>
          <p className="text-slate-400 mt-2">Join thousands of freelancers and clients today.</p>

          <button className="mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 transition shadow-lg shadow-indigo-500/20">
            Get Started
          </button>
        </div>

      </div>

      {/* SIMPLE FADE ANIMATION */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
