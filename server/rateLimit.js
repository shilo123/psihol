// In-memory rate limiter — no external dependencies
// Tracks request counts per IP within sliding time windows

const buckets = new Map() // key → { count, resetAt }

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}, 5 * 60_000)

/**
 * Creates a rate-limiting middleware.
 * @param {object} opts
 * @param {number} opts.windowMs  - Time window in milliseconds (default 60 000)
 * @param {number} opts.max       - Max requests per window (default 30)
 * @param {string} [opts.prefix]  - Bucket prefix to separate limits per route group
 * @param {string} [opts.message] - Error message returned when limited
 */
export function rateLimit({ windowMs = 60_000, max = 30, prefix = 'global', message } = {}) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress
    const key = `${prefix}:${ip}`
    const now = Date.now()

    let bucket = buckets.get(key)
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }

    bucket.count++

    // Set standard rate-limit headers
    const remaining = Math.max(0, max - bucket.count)
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    res.set('X-RateLimit-Limit', String(max))
    res.set('X-RateLimit-Remaining', String(remaining))
    res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

    if (bucket.count > max) {
      res.set('Retry-After', String(retryAfter))
      return res.status(429).json({
        error: message || 'יותר מדי בקשות. נסו שוב בעוד מספר שניות.',
      })
    }

    next()
  }
}
