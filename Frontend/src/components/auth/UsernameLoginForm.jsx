export default function UsernameLoginForm({ username, onChange, onSubmit, error, loading }) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your username"
          autoComplete="username"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-400/50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 font-semibold text-white shadow-indigo-400/10 transition hover:brightness-105 disabled:opacity-60"
      >
        {loading ? 'Starting…' : 'Start Chatting'}
      </button>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}
    </form>
  )
}

