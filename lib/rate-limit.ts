import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache de instâncias por configuração para evitar recriar a cada request
const instanceCache = new Map<string, Ratelimit>()

function getInstance(limit: number, windowSeconds: number): Ratelimit {
  const key = `${limit}:${windowSeconds}`
  if (!instanceCache.has(key)) {
    instanceCache.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      })
    )
  }
  return instanceCache.get(key)!
}

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  return getInstance(limit, window).limit(identifier)
}

export const RATE_LIMITS = {
  ai:      { limit: 10, window: 60 },
  payment: { limit: 5,  window: 60 },
  daily:   { limit: 5,  window: 60 },
  default: { limit: 30, window: 60 },
} as const

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-vercel-forwarded-for') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}
