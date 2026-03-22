import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="relative overflow-hidden">

      {/* ================= HERO SECTION ================= */}
      <div className="relative overflow-hidden">

        {/* Glow Background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-40 h-[380px] w-[380px] bg-cyan-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="absolute -bottom-40 -right-40 h-[380px] w-[380px] bg-purple-500/20 blur-3xl rounded-full animate-pulse" />
        </div>

        <div className="text-center py-24 px-6">

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
          >
            Taskvra Freelance Marketplace
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-slate-300 max-w-2xl mx-auto"
          >
            Hire freelancers, post projects, collaborate in real-time, and grow
            with AI-powered freelancing tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex justify-center gap-4"
          >
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
          </motion.div>

          {/* Feature Cards */}
          <div className="mt-20 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              ["⚡ Fast Hiring", "Post gigs and receive bids instantly."],
              ["💬 Real-time Chat", "Collaborate live with freelancers."],
              ["🔐 Secure Login", "Safe authentication & verification."],
              ["🤖 AI Assistant", "Smart freelancing help anytime."],
              ["📊 Dashboard", "Track work & progress easily."],
              ["🖼️ Profiles", "Showcase skills & portfolio."],
            ].map(([title, desc], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 shadow-lg hover:-translate-y-1 transition hover:shadow-cyan-500/20"
              >
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-slate-400 mt-2 text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>


      {/* ================= SECOND SECTION ================= */}
      <section className="relative py-28 overflow-hidden">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg-freelancer.webp')" }}
        />

        {/* Soft overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

        <div className="relative max-w-6xl mx-auto px-6 text-white">

          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            <span className="text-pink-600">Make it real</span> <br />
            with Freelancer
          </h2>

          <div className="grid md:grid-cols-2 gap-10 text-slate-100">

            <div>
              <h3 className="text-xl font-semibold">The best talent</h3>
              <p className="mt-2 text-sm">
                Discover reliable professionals by exploring their portfolios
                and feedback shared on their profiles.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Fast bids</h3>
              <p className="mt-2 text-sm">
                Get quick, no-obligation quotes from skilled freelancers.
                80% of jobs receive bids within 60 seconds.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Quality work</h3>
              <p className="mt-2 text-sm">
                With millions of professionals, you'll find quality talent to
                get what you need done.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Be in control</h3>
              <p className="mt-2 text-sm">
                Chat with freelancers and get real-time updates anytime,
                anywhere.
              </p>
            </div>

          </div>

          <div className="mt-16">
            <Link
              to="/register"
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition"
            >
              Get started now
            </Link>
          </div>

        </div>
      </section>


      {/* ================= THIRD SECTION ================= */}
      <section className="relative py-32 overflow-hidden">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg-world.webp')" }}
        />

        {/* Contrast overlay */}
        <div className="absolute inset-0 bg-black/75" />

        <div className="relative max-w-6xl mx-auto px-6 text-white">

          <h2 className="text-5xl md:text-6xl font-bold mb-16 leading-tight">
            Tap into a <br />
            <span className="text-pink-600">global talent network</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-14 text-slate-100">

            <div>
              <h3 className="text-2xl font-semibold">Post your job</h3>
              <p className="mt-3 text-base">
                It's free and easy! Get competitive bids that suit your budget
                in minutes. Start making your dreams reality.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">Choose freelancers</h3>
              <p className="mt-3 text-base">
                We've got freelancers for jobs of any size or budget across
                2700+ skills. Let our talent bring your ideas to life.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">Pay safely</h3>
              <p className="mt-3 text-base">
                Only pay when you're 100% satisfied. Our milestone system
                protects you every step of the way.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">We're here to help</h3>
              <p className="mt-3 text-base">
                Let our expert recruiters and co-pilots save you time finding
                and managing talent.
              </p>
            </div>

          </div>

          <div className="mt-20">
            <h3 className="text-2xl font-semibold">Create the future.</h3>

            <Link
              to="/register"
              className="inline-block mt-6 px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition"
            >
              Get started now
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
