import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

import Login from './pages/Login'
import UserChat from './pages/UserChat'
import { getRuntimeConfig } from './config/env'

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const userId = localStorage.getItem('userId')
    const email = localStorage.getItem('email')
    if (!userId || !email) return null
    return { userId, email }
  })

  const { socketBaseUrl: socketUrl, error: configError } = getRuntimeConfig()

  const socketRef = useRef(null)
  const [socket, setSocket] = useState(null)

  function handleLogout() {
    localStorage.removeItem('userId')
    localStorage.removeItem('email')
    if (socketRef.current) socketRef.current.disconnect()
    socketRef.current = null
    setSocket(null)
    setCurrentUser(null)
  }

  useEffect(() => {
    if (!currentUser) return

    const s = io(socketUrl, { transports: ['websocket'] })
    socketRef.current = s
    setSocket(s)

    s.on('connect', () => {
      s.emit('user_connected', { userId: currentUser.userId, email: currentUser.email })
    })

    return () => {
      s.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [currentUser, socketUrl])

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold">Config error</div>
            <div className="mt-2 text-sm text-slate-700">{configError}</div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Vercel Project → Settings → Environment Variables:
              <div className="mt-2 font-mono text-xs">
                VITE_API_URL=https://&lt;your-render-backend&gt;.onrender.com
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) return <Login onLogin={setCurrentUser} />
  return <UserChat currentUser={currentUser} onLogout={handleLogout} socket={socket} />
}
