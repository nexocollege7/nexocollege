type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Limpa entradas expiradas periodicamente para evitar vazamento de memória
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Retorna true se a requisição for permitida, false se exceder o limite.
 * @param key    Identificador (ex: IP + rota)
 * @param max    Máximo de tentativas permitidas
 * @param windowMs  Janela de tempo em ms
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false

  entry.count++
  return true
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
