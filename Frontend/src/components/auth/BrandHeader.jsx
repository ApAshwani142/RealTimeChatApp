export default function BrandHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 ring-1 ring-slate-200 flex items-center justify-center">
          <span className="text-xl">💬</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">QuickChat</h1>
          <p className="text-sm text-slate-600">Real-time messaging, 1-to-1</p>
        </div>
      </div>
    </div>
  )
}

