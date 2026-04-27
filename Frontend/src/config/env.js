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

export function getRuntimeConfig() {
  const fallbackDev = 'http://localhost:5001'

  const apiFromEnv = normalizeBaseUrl(import.meta.env.VITE_API_URL)
  const apiBaseUrlRaw = apiFromEnv || (import.meta.env.DEV ? fallbackDev : '')

  if (!apiBaseUrlRaw) {
    return {
      apiBaseUrl: '',
      socketBaseUrl: '',
      error:
        'Deployment misconfigured: missing VITE_API_URL. Set it on Vercel to your Render backend URL (example: https://your-service.onrender.com) and redeploy.',
    }
  }

  let apiBaseUrl
  try {
    apiBaseUrl = assertAbsoluteHttpUrl(apiBaseUrlRaw, 'VITE_API_URL')
  } catch (e) {
    return { apiBaseUrl: '', socketBaseUrl: '', error: e?.message || String(e) }
  }

  const socketFromEnv = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL)
  const socketBaseUrlRaw = socketFromEnv || apiBaseUrl

  let socketBaseUrl
  try {
    socketBaseUrl = assertAbsoluteHttpUrl(socketBaseUrlRaw, 'VITE_SOCKET_URL')
  } catch (e) {
    return { apiBaseUrl, socketBaseUrl: '', error: e?.message || String(e) }
  }

  return { apiBaseUrl, socketBaseUrl, error: '' }
}

export function getApiBaseUrl() {
  return getRuntimeConfig().apiBaseUrl
}

export function getSocketBaseUrl() {
  return getRuntimeConfig().socketBaseUrl
}

