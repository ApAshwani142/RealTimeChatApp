import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { getApiBaseUrl } from '../config/env'

import ChatSidebar from '../components/chat/ChatSidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import MessageComposer from '../components/chat/MessageComposer'

export default function UserChat({ currentUser, onLogout, socket }) {
  const apiUrl = getApiBaseUrl()
  const currentUserId = currentUser.userId

  const bottomRef = useRef(null)
  const selectedUserIdRef = useRef(null)

  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId
  }, [selectedUserId])

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/users`, { headers: { 'x-user-id': currentUserId } })
      .then((res) => {
        const list = res.data.users || []
        setUsers(list.map((u) => ({ ...u, username: u.userId })))
      })
      .catch((err) => console.error('Failed to load users', err))
  }, [apiUrl, currentUserId])

  // Realtime online/offline + messages
  useEffect(() => {
    if (!socket) return

    const onUserOnline = ({ userId, email }) => {
      if (String(userId) === String(currentUserId)) return
      setUsers((prev) => {
        const exists = prev.some((u) => String(u.userId) === String(userId))
        if (exists) {
          return prev.map((u) =>
            String(u.userId) === String(userId) ? { ...u, isOnline: true, email, username: u.username || userId } : u,
          )
        }
        return [...prev, { userId, email, isOnline: true, username: userId }]
      })
    }

    const onUserOffline = ({ userId, email }) => {
      if (String(userId) === String(currentUserId)) return
      setUsers((prev) =>
        prev.map((u) => (String(u.userId) === String(userId) ? { ...u, isOnline: false, email: email || u.email } : u)),
      )
    }

    const onReceiveMessage = (msg) => {
      const a = String(msg.senderId)
      const b = String(msg.receiverId)
      const cu = String(currentUserId)
      const su = selectedUserIdRef.current ? String(selectedUserIdRef.current) : null

      const isForThisChat = su && ((a === cu && b === su) || (a === su && b === cu))
      if (!isForThisChat) return

      setMessages((prev) => [
        ...prev,
        {
          messageId: String(msg.messageId),
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          text: msg.text,
          timestamp: msg.timestamp,
        },
      ])
    }

    socket.on('user_online', onUserOnline)
    socket.on('user_offline', onUserOffline)
    socket.on('receive_message', onReceiveMessage)

    return () => {
      socket.off('user_online', onUserOnline)
      socket.off('user_offline', onUserOffline)
      socket.off('receive_message', onReceiveMessage)
    }
  }, [socket, apiUrl, currentUserId])

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([])
      return
    }

    setChatLoading(true)
    setMessages([])

    axios
      .get(`${apiUrl}/api/messages/${selectedUserId}`, { headers: { 'x-user-id': currentUserId } })
      .then((res) => setMessages(res.data.messages || []))
      .catch((err) => console.error('Failed to load messages', err))
      .finally(() => setChatLoading(false))
  }, [apiUrl, currentUserId, selectedUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedUser = useMemo(() => users.find((u) => String(u.userId) === String(selectedUserId)) || null, [users, selectedUserId])

  function handleSendMessage() {
    if (!selectedUserId) return
    const trimmed = messageText.trim()
    if (!trimmed) return
    if (!socket) return

    socket.emit('send_message', {
      senderId: currentUserId,
      receiverId: selectedUserId,
      text: trimmed,
    })

    setMessageText('')
  }

  return (
    <div className="flex h-screen min-w-0 bg-slate-50 text-slate-900">
      <ChatSidebar
        currentUser={{ ...currentUser, username: currentUser.userId }}
        users={users}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader selectedUser={selectedUser ? { ...selectedUser, username: selectedUser.userId } : null} chatLoading={chatLoading} />

        {selectedUserId ? (
          <>
            <MessageList messages={messages} currentUserId={currentUserId} bottomRef={bottomRef} />
            <MessageComposer disabled={!selectedUserId} value={messageText} onChange={setMessageText} onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm animate-pop-in">
              <div className="text-sm text-slate-600">Welcome 👋</div>
              <div className="mt-2 text-xl font-semibold">Pick a user to start chatting</div>
              <div className="mt-3 text-sm text-slate-500">All users on the platform appear in the sidebar with online status.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

