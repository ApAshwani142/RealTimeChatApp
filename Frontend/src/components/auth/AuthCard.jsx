export default function AuthCard({ children }) {
  return (
    <div className="relative rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-2xl shadow-slate-400/20 backdrop-blur animate-pop-in">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl bg-[radial-gradient(closest-side,rgba(192,132,252,0.22),transparent)] opacity-70"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

