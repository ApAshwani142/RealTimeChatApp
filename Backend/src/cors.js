function parseAllowedOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function originAllowed(origin, allowed) {
  if (!origin) return true
  if (!allowed || allowed.length === 0) return true

  // Support wildcard entries like:
  // - https://*.vercel.app
  // - http://localhost:*
  for (const entry of allowed) {
    if (entry === origin) return true

    if (entry.includes('*')) {
      const escaped = entry
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*')
      const re = new RegExp(`^${escaped}$`)
      if (re.test(origin)) return true
    }
  }

  return false
}

function buildCorsOriginHandler() {
  const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_ORIGIN)

  return function corsOriginHandler(origin, callback) {
    const ok = originAllowed(origin, allowedOrigins)
    return callback(null, ok)
  }
}

module.exports = { buildCorsOriginHandler }

