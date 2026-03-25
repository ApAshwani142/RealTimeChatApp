export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative w-full max-w-md animate-pop-in">{children}</div>
      </div>
    </div>
  )
}

