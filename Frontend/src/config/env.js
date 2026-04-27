function normalizeBaseUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

function assertAbsoluteHttpUrl(url, name) {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error(`${name} must start with http:// or https://`)
    }
    return url
  } catch (e) {
    throw new Error(`${name} must be an absolute URL. Got: "${url}"`)
  }
}

export function getApiBaseUrl() {
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_API_URL)
  const fallbackDev = 'http://localhost:5001'
  const value = fromEnv || (import.meta.env.DEV ? fallbackDev : '')

  if (!value) {
    throw new Error(
      'Missing VITE_API_URL. In production you must set it on Vercel to your Render backend URL (e.g. https://your-service.onrender.com).',
    )
  }

  return assertAbsoluteHttpUrl(value, 'VITE_API_URL')
}

export function getSocketBaseUrl() {
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL)
  const value = fromEnv || getApiBaseUrl()
  return assertAbsoluteHttpUrl(value, 'VITE_SOCKET_URL')
}

