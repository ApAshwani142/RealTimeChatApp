export default function MessageComposer({ disabled, value, onChange, onSend }) {
  return (
    <div className="border-t border-slate-200/70 bg-white/60 px-6 py-4">
      <div className="flex items-center gap-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? 'Select a user first' : 'Type a message…'}
          disabled={disabled}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-400/40 disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) onSend()
          }}
        />
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={onSend}
          className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  )
}

