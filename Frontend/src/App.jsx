import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

import Login from './pages/Login'
import UserChat from './pages/UserChat'
import { getSocketBaseUrl } from './config/env'

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const userId = localStorage.getItem('userId')
    const email = localStorage.getItem('email')
    if (!userId || !email) return null
    return { userId, email }
  })

  const socketUrl = getSocketBaseUrl()

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

  if (!currentUser) return <Login onLogin={setCurrentUser} />
  return <UserChat currentUser={currentUser} onLogout={handleLogout} socket={socket} />
}
