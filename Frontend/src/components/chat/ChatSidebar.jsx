import { useMemo, useState } from 'react'

function getInitials(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getAvatarGradient(username) {
  const gradients = [
    'from-fuchsia-500/20 to-indigo-500/20 ring-fuchsia-400/20',
    'from-emerald-500/20 to-teal-500/20 ring-emerald-400/20',
    'from-sky-500/20 to-cyan-500/20 ring-sky-400/20',
    'from-violet-500/20 to-purple-500/20 ring-violet-400/20',
    'from-orange-500/20 to-amber-500/20 ring-orange-400/20',
    'from-rose-500/20 to-pink-500/20 ring-rose-400/20',
  ]

  let hash = 0
  for (let i = 0; i < String(username).length; i += 1) hash = (hash * 31 + String(username).charCodeAt(i)) >>> 0

  return gradients[hash % gradients.length]
}

export default function ChatSidebar({
  currentUser,
  users,
  selectedUserId,
  onSelectUser,
  onLogout,
}) {
  const [query, setQuery] = useState('')

  const onlineCount = useMemo(() => users.filter((u) => u.isOnline).length, [users])
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => String(u.username || u.userId || u.email || '').toLowerCase().includes(q))
  }, [query, users])

  return (
    <aside className="w-[320px] shrink-0 border-r border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="text-xs text-slate-500">You</div>
          <div className="mt-1 text-base font-semibold text-slate-900">{currentUser.userId || currentUser.username}</div>
          <div className="mt-1 text-xs text-slate-500">
            <span className="text-emerald-500">●</span> {onlineCount} online
          </div>
        </div>
        <button
          onClick={onLogout}
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
        >
          Logout
        </button>
      </div>

      <div className="px-4 pb-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users</div>
      </div>

      <div className="px-4 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
        />
      </div>

      <div className="max-h-[calc(100svh-132px)] overflow-auto px-2 pb-4">
        <ul className="space-y-2">
          {filteredUsers.map((u, idx) => {
            const selected = u.userId === selectedUserId
            const displayName = u.username || u.userId || u.email || '?'
            const initials = getInitials(displayName)
            const avatarGradient = getAvatarGradient(displayName)
            const key = String(u.userId || u.email || `idx-${idx}`)
            return (
              <li
                key={key}
                className={[
                  'group flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2 transition',
                  'border border-slate-200 bg-white/0 hover:bg-slate-50',
                  selected ? 'ring-2 ring-fuchsia-400/35 bg-slate-50' : '',
                  'animate-fade-up',
                ].join(' ')}
                style={{ animationDelay: `${idx * 35}ms` }}
                onClick={() => onSelectUser(u.userId)}
                role="button"
                tabIndex={0}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={[
                      'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-slate-800',
                      avatarGradient,
                    ].join(' ')}
                  >
                    {initials}
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white',
                        u.isOnline ? 'bg-emerald-500' : 'bg-slate-400',
                      ].join(' ')}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{displayName}</div>
                    <div className="mt-1 text-xs text-slate-500">{u.isOnline ? 'Online' : 'Offline'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pr-1 text-xs text-slate-500">
                  {u.isOnline ? 'online' : ''}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

