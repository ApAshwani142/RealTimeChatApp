export default function ChatHeader({ selectedUser, chatLoading }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 bg-white/60 px-6 py-4">
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{selectedUser ? 'Chat with' : 'Welcome'}</div>
        <div className="mt-1 truncate text-lg font-semibold text-slate-900">
          {selectedUser ? selectedUser.username : 'Pick a user to start messaging'}
        </div>
        {selectedUser ? (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1',
                selectedUser.isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              <span
                className={[
                  'h-2 w-2 rounded-full',
                  selectedUser.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400',
                ].join(' ')}
              />
              <span className="font-medium">{selectedUser.isOnline ? 'Online' : 'Offline'}</span>
              {selectedUser.isOnline ? <span className="font-medium text-xs opacity-80">(Active)</span> : null}
            </span>

            {selectedUser.email ? <span className="text-slate-500">• {selectedUser.email}</span> : null}
          </div>
        ) : null}
      </div>
      {chatLoading && selectedUser ? (
        <div className="text-xs text-slate-500 animate-pulse">Loading history…</div>
      ) : null}
    </div>
  )
}

