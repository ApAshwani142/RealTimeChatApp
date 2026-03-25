import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'

import ChatSidebar from '../components/chat/ChatSidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import MessageComposer from '../components/chat/MessageComposer'

export default function Chat({
  currentUser,
  onLogout,
  selectedUserId,
  onSelectUser,
  onOpenContacts,
  onlineIds,
  socket,
}) {
  const apiUrl = import.meta.env.VITE_API_URL
  const currentUserId = currentUser.userId

  const bottomRef = useRef(null)
  const selectedUserIdRef = useRef(selectedUserId)
  const [contacts, setContacts] = useState([]) // from /api/contacts

  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [msgCtx, setMsgCtx] = useState(null) // {x,y,message}
  const [editingMessage, setEditingMessage] = useState(null) // {messageId,text}

  const [contactCtx, setContactCtx] = useState(null) // {x,y,contact}
  const [editingContact, setEditingContact] = useState(null) // {contactId, username, mobile}

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId
  }, [selectedUserId])

  const usersForSidebar = useMemo(() => {
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

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null
    return usersForSidebar.find((u) => String(u.userId) === String(selectedUserId)) || null
  }, [selectedUserId, usersForSidebar])

  // Load contacts once per login/session.
  useEffect(() => {
    if (!currentUserId) return
    axios
      .get(`${apiUrl}/api/contacts`, { headers: { 'x-user-id': currentUserId } })
      .then((res) => setContacts(res.data.contacts || []))
      .catch((err) => console.error('Failed to load contacts', err))
  }, [apiUrl, currentUserId])

  async function refreshContacts() {
    try {
      const res = await axios.get(`${apiUrl}/api/contacts`, { headers: { 'x-user-id': currentUserId } })
      setContacts(res.data.contacts || [])
    } catch (err) {
      console.error('Failed to refresh contacts', err)
    }
  }

  // Listen for realtime messages only (online/offline comes from onlineIds at App level).
  useEffect(() => {
    if (!socket) return

    const handlerReceive = (msg) => {
      const a = String(msg.senderId)
      const b = String(msg.receiverId)
      const cu = String(currentUserId)
      const su = selectedUserIdRef.current ? String(selectedUserIdRef.current) : null

      const isForThisChat = su && ((a === cu && b === su) || (a === su && b === cu))
      if (!isForThisChat) return

      setMessages((prev) => [
        ...prev,
        {
          messageId: msg.messageId,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          text: msg.text,
          timestamp: msg.timestamp,
        },
      ])
    }

    const handlerUpdated = (payload) => {
      const a = String(payload.senderId)
      const b = String(payload.receiverId)
      const cu = String(currentUserId)
      const su = selectedUserIdRef.current ? String(selectedUserIdRef.current) : null

      const isForThisChat = su && ((a === cu && b === su) || (a === su && b === cu))
      if (!isForThisChat) return

      setMessages((prev) =>
        prev.map((m) =>
          String(m.messageId) === String(payload.messageId)
            ? { ...m, text: payload.text, timestamp: payload.timestamp }
            : m,
        ),
      )
    }

    const handlerDeleted = (payload) => {
      const a = String(payload.senderId)
      const b = String(payload.receiverId)
      const cu = String(currentUserId)
      const su = selectedUserIdRef.current ? String(selectedUserIdRef.current) : null

      const isForThisChat = su && ((a === cu && b === su) || (a === su && b === cu))
      if (!isForThisChat) return

      setMessages((prev) => prev.filter((m) => String(m.messageId) !== String(payload.messageId)))
    }

    socket.on('receive_message', handlerReceive)
    socket.on('message_updated', handlerUpdated)
    socket.on('message_deleted', handlerDeleted)
    return () => {
      socket.off('receive_message', handlerReceive)
      socket.off('message_updated', handlerUpdated)
      socket.off('message_deleted', handlerDeleted)
    }
  }, [socket, currentUserId])

  // Load message history when selected contact changes.
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([])
      return
    }

    setChatLoading(true)
    setMessages([])

    axios
      .get(`${apiUrl}/api/messages/${selectedUserId}`, { headers: { 'x-user-id': currentUserId } })
      .then((res) =>
        setMessages(
          (res.data.messages || []).map((m) => ({
            ...m,
            messageId: String(m.messageId ?? m._id ?? ''),
          })),
        ),
      )
      .catch((err) => console.error('Failed to load messages', err))
      .finally(() => setChatLoading(false))
  }, [apiUrl, currentUserId, selectedUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSendMessage() {
    if (!selectedUserId) return
    const trimmed = messageText.trim()
    if (!trimmed) return

    if (!socket) return

    const receiverMobile = selectedUser?.mobile

    socket.emit('send_message', {
      senderId: currentUserId,
      receiverId: selectedUserId,
      receiverMobile,
      text: trimmed,
    })

    setMessageText('')
  }

  function handleMessageContextMenu(e, message) {
    e.preventDefault()
    setMsgCtx({ x: e.clientX, y: e.clientY, message })
  }

  async function handleDeleteMessage(messageId) {
    try {
      await axios.delete(`${apiUrl}/api/messages/${messageId}`, { headers: { 'x-user-id': currentUserId } })
      // Realtime will also update the other tab. For this tab we update optimistically by clearing.
      setMessages((prev) => prev.filter((m) => String(m.messageId) !== String(messageId)))
    } catch (err) {
      // no-op; UI could show toast
      console.error(err?.response?.data?.error || err)
    } finally {
      setMsgCtx(null)
    }
  }

  async function handleUpdateContact(contactId, nextUsername, nextMobile) {
    await axios.patch(
      `${apiUrl}/api/contacts/${contactId}`,
      { username: nextUsername, mobile: nextMobile },
      { headers: { 'x-user-id': currentUserId } },
    )
  }

  async function handleDeleteContact(contactId) {
    await axios.delete(`${apiUrl}/api/contacts/${contactId}`, { headers: { 'x-user-id': currentUserId } })
  }

  async function handleContactMenuAction(action) {
    if (!contactCtx) return
    const contact = contactCtx.contact
    const contactId = contact.userId

    if (action === 'edit') {
      setEditingContact({
        contactId,
        username: contact.username || '',
        mobile: contact.mobile || '',
      })
      setContactCtx(null)
      return
    }

    if (action === 'delete') {
      const ok = window.confirm(`Delete contact "${contact.username}"?`)
      if (!ok) return

      try {
        await handleDeleteContact(contactId)
        if (String(selectedUserId) === String(contactId)) onSelectUser(null)
        await refreshContacts()
        setContactCtx(null)
      } catch (err) {
        console.error(err?.response?.data?.error || err)
      }
    }
  }

  return (
    <div className="flex h-screen min-w-0 bg-slate-50 text-slate-900">
      <ChatSidebar
        currentUser={currentUser}
        users={usersForSidebar}
        selectedUserId={selectedUserId}
        onSelectUser={onSelectUser}
        onLogout={onLogout}
        onOpenContacts={onOpenContacts}
        onContactContextMenu={(e, contact) => {
          e.preventDefault()
          setContactCtx({ x: e.clientX, y: e.clientY, contact })
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader selectedUser={selectedUser} chatLoading={chatLoading} />

        {selectedUserId ? (
          <>
            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              bottomRef={bottomRef}
              onMessageContextMenu={handleMessageContextMenu}
            />
            <MessageComposer disabled={!selectedUserId} value={messageText} onChange={setMessageText} onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm animate-pop-in">
              <div className="text-sm text-slate-600">Welcome 👋</div>
              <div className="mt-2 text-xl font-semibold">Pick a contact to start chatting</div>
              <div className="mt-3 text-sm text-slate-500">
                Add contacts from the Contacts page, then chat instantly via Socket.io.
              </div>
            </div>
          </div>
        )}
      </div>

      {msgCtx ? (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setMsgCtx(null)} />
          <div className="fixed z-50" style={{ left: msgCtx.x, top: msgCtx.y }}>
            <div
              className="min-w-[220px] rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
            >
            {(() => {
              const isMine = String(msgCtx.message.senderId) === String(currentUserId)
              return (
                <>
                  <button
                    type="button"
                    disabled={!isMine}
                    onClick={() => {
                      setEditingMessage({ messageId: msgCtx.message.messageId, text: msgCtx.message.text })
                      setMsgCtx(null)
                    }}
                    className={[
                      'w-full px-4 py-3 text-left text-sm transition',
                      isMine ? 'hover:bg-slate-50' : 'opacity-50 cursor-not-allowed',
                    ].join(' ')}
                  >
                    Edit message
                  </button>
                  <button
                    type="button"
                    disabled={!isMine}
                    onClick={() => {
                      handleDeleteMessage(msgCtx.message.messageId)
                    }}
                    className={[
                      'w-full px-4 py-3 text-left text-sm transition text-red-600',
                      isMine ? 'hover:bg-red-50' : 'opacity-50 cursor-not-allowed',
                    ].join(' ')}
                  >
                    Delete message
                  </button>
                </>
              )
            })()}
            </div>
          </div>
        </>
      ) : null}

      {contactCtx ? (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setContactCtx(null)} />
          <div className="fixed z-50" style={{ left: contactCtx.x, top: contactCtx.y }}>
            <div
              className="min-w-[220px] rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handleContactMenuAction('edit')}
                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition"
              >
                Edit contact
              </button>
              <button
                type="button"
                onClick={() => handleContactMenuAction('delete')}
                className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 transition text-red-600"
              >
                Delete contact
              </button>
            </div>
          </div>
        </>
      ) : null}

      {editingContact ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onMouseDown={() => setEditingContact(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold">Edit contact</div>
            <div className="mt-1 text-sm text-slate-500">Update username and mobile number.</div>

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="editContactUsername">
                  Username
                </label>
                <input
                  id="editContactUsername"
                  value={editingContact.username}
                  onChange={(e) => setEditingContact((p) => (p ? { ...p, username: e.target.value } : p))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="editContactMobile">
                  Mobile number
                </label>
                <input
                  id="editContactMobile"
                  value={editingContact.mobile}
                  onChange={(e) => setEditingContact((p) => (p ? { ...p, mobile: e.target.value } : p))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const nextUsername = editingContact.username.trim()
                    const nextMobile = editingContact.mobile.trim()
                    if (!nextUsername || !nextMobile) return

                    await handleUpdateContact(editingContact.contactId, nextUsername, nextMobile)
                    setEditingContact(null)
                    await refreshContacts()
                  } catch (err) {
                    console.error(err?.response?.data?.error || err)
                  }
                }}
                className="rounded-2xl bg-linear-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onMouseDown={() => setEditingMessage(null)}>
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold">Edit message</div>
            <div className="mt-1 text-sm text-slate-500">Right click messages again to manage them.</div>

            <div className="mt-4 space-y-3">
              <textarea
                value={editingMessage.text}
                onChange={(e) => setEditingMessage((p) => (p ? { ...p, text: e.target.value } : p))}
                className="w-full min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = editingMessage.text.trim()
                    await axios.patch(
                      `${apiUrl}/api/messages/${editingMessage.messageId}`,
                      { text },
                      { headers: { 'x-user-id': currentUserId } },
                    )
                  } catch (err) {
                    console.error(err?.response?.data?.error || err)
                  } finally {
                    setEditingMessage(null)
                  }
                }}
                className="rounded-2xl bg-linear-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

