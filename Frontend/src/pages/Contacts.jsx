import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

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

export default function Contacts({ currentUser, onLogout, onlineIds, onStartChat, onBack }) {
  const apiUrl = import.meta.env.VITE_API_URL
  const currentUserId = currentUser.userId

  const [contacts, setContacts] = useState([])
  const [username, setUsername] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState(null) // { x, y, contactId } for right-click menu
  const [editing, setEditing] = useState(null) // { contactId, username, mobile }

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/contacts`, { headers: { 'x-user-id': currentUserId } })
      .then((res) => setContacts(res.data.contacts || []))
      .catch((err) => console.error('Failed to load contacts', err))
  }, [apiUrl, currentUserId])

  const contactsWithOnline = useMemo(() => {
    return contacts.map((c) => {
      const id = c.contactId ?? c.userId
      const userId = String(id)
      return {
        userId,
        username: c.username,
        mobile: c.mobile,
        isOnline: onlineIds?.has(userId) ? true : Boolean(c.isOnline),
      }
    })
  }, [contacts, onlineIds])

  async function handleAddContact(e) {
    e.preventDefault()
    setError('')

    const trimmedUsername = username.trim()
    const trimmedMobile = mobile.trim()
    if (!trimmedUsername || !trimmedMobile) {
      setError('Username and mobile are required')
      return
    }

    setLoading(true)
    try {
      await axios.post(
        `${apiUrl}/api/contacts`,
        { username: trimmedUsername, mobile: trimmedMobile },
        { headers: { 'x-user-id': currentUserId } },
      )
      setUsername('')
      setMobile('')
      const res = await axios.get(`${apiUrl}/api/contacts`, { headers: { 'x-user-id': currentUserId } })
      setContacts(res.data.contacts || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Back to chat
          </button>
          <div>
            <div className="text-xs text-slate-500">Contacts</div>
            <div className="text-lg font-semibold">Add people to chat</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
        >
          Logout
        </button>
      </div>

      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-semibold">Add a contact</div>
            <div className="mt-1 text-sm text-slate-500">
              Enter a username. If it doesn’t exist, we create it automatically.
            </div>
          </div>

          <form onSubmit={handleAddContact} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="contactUsername">
                Username
              </label>
              <input
                id="contactUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Alice Chen"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="contactMobile">
                Mobile number
              </label>
              <input
                id="contactMobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +1 5551234567"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? 'Adding…' : 'Add contact'}
            </button>

            {error ? <div className="text-sm text-red-500">{error}</div> : null}
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="font-semibold text-slate-800">Tip</div>
            <div className="mt-1">
              After adding, click <span className="font-semibold">Start chat</span> to open the conversation.
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Your contacts</div>
              <div className="mt-1 text-sm text-slate-500">
                Online: {contactsWithOnline.filter((c) => c.isOnline).length} / {contactsWithOnline.length}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {contactsWithOnline.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No contacts yet. Add one on the left.
              </div>
            ) : (
              contactsWithOnline.map((c, idx) => (
                <div
                  key={c.userId}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 animate-fade-up hover:shadow-sm transition-shadow cursor-context-menu"
                  style={{ animationDelay: `${idx * 35}ms` }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setCtx({ x: e.clientX, y: e.clientY, contactId: c.userId })
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={[
                        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold ring-1',
                        getAvatarGradient(c.username),
                      ].join(' ')}
                    >
                      {getInitials(c.username)}
                      <span
                        aria-hidden="true"
                        className={[
                          'absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white',
                          c.isOnline ? 'bg-emerald-500' : 'bg-slate-400',
                        ].join(' ')}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.username}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {c.isOnline ? 'Online' : 'Offline'} • {c.mobile ? c.mobile : '—'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartChat(c.userId)}
                    className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
                  >
                    Start chat
                  </button>
                </div>
              ))
            )}
          </div>

          {ctx ? (
            <>
              <div className="fixed inset-0 z-40" onMouseDown={() => setCtx(null)} />
              <div
                className="fixed z-50"
                style={{ left: ctx.x, top: ctx.y }}
                onMouseDown={(e) => e.stopPropagation()}
              >
              <div className="min-w-[200px] rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    const found = contactsWithOnline.find((u) => u.userId === ctx.contactId)
                    setEditing(found ? { contactId: found.userId, username: found.username, mobile: found.mobile || '' } : null)
                    setCtx(null)
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition"
                >
                  Edit contact
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await axios.delete(`${apiUrl}/api/contacts/${ctx.contactId}`, {
                        headers: { 'x-user-id': currentUserId },
                      })
                      const res = await axios.get(`${apiUrl}/api/contacts`, { headers: { 'x-user-id': currentUserId } })
                      setContacts(res.data.contacts || [])
                    } catch (err) {
                      setError(err?.response?.data?.error || 'Failed to delete contact')
                    } finally {
                      setCtx(null)
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Delete contact
                </button>
              </div>
              </div>
              </>

          ) : null}

          {editing ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
              onMouseDown={() => setEditing(null)}
            >
              <div
                className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="text-lg font-semibold">Edit contact</div>
                <div className="mt-1 text-sm text-slate-500">Right click contacts to edit or delete.</div>

                <div className="mt-5 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="editUsername">
                      Username
                    </label>
                    <input
                      id="editUsername"
                      value={editing.username}
                      onChange={(e) => setEditing((p) => (p ? { ...p, username: e.target.value } : p))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="editMobile">
                      Mobile number
                    </label>
                    <input
                      id="editMobile"
                      value={editing.mobile}
                      onChange={(e) => setEditing((p) => (p ? { ...p, mobile: e.target.value } : p))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await axios.patch(
                          `${apiUrl}/api/contacts/${editing.contactId}`,
                          { username: editing.username.trim(), mobile: editing.mobile.trim() },
                          { headers: { 'x-user-id': currentUserId } },
                        )
                        const res = await axios.get(`${apiUrl}/api/contacts`, { headers: { 'x-user-id': currentUserId } })
                        setContacts(res.data.contacts || [])
                        setEditing(null)
                      } catch (err) {
                        setError(err?.response?.data?.error || 'Failed to update contact')
                      }
                    }}
                    className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105 transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

