import { useState } from 'react'
import axios from 'axios'
import AuthShell from '../components/AuthShell'
import AuthCard from '../components/auth/AuthCard'
import BrandHeader from '../components/auth/BrandHeader'
import { getApiBaseUrl } from '../config/env'

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const apiUrl = getApiBaseUrl()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedUserId = userId.trim()
    const trimmedEmail = email.trim()
    if (!trimmedUserId) {
      setError('UserId is required')
      return
    }
    if (!trimmedEmail) {
      setError('Email is required')
      return
    }

    try {
      const res = await axios.post(`${apiUrl}/api/login`, {
        userId: trimmedUserId,
        email: trimmedEmail,
      })

      const user = { userId: res.data.userId, email: res.data.email }

      localStorage.setItem('userId', user.userId)
      localStorage.setItem('email', user.email)

      onLogin(user)
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <BrandHeader />

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">⚡</span>
            <span>No signup needed — just enter your username to start</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="userId">
              UserId
            </label>
            <input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your userId"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-linear-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] shadow-indigo-400/10 transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? 'Starting…' : 'Start Chatting'}
          </button>

          {error ? <div className="text-sm text-red-500">{error}</div> : null}
        </form>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2">
            <div className="font-semibold text-slate-900">Real-time</div>
            <div className="mt-1">Instant messages</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2">
            <div className="font-semibold text-slate-900">Private</div>
            <div className="mt-1">1-to-1 chat</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2">
            <div className="font-semibold text-slate-900">Simple</div>
            <div className="mt-1">Just type & send</div>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  )
}

