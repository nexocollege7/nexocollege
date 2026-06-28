// LIMITAÇÃO CONHECIDA: este store é um Map em memória, isolado por processo.
// Em ambiente serverless (múltiplas instâncias/cold starts), cada instância tem
// seu próprio contador — o limite NÃO é global e pode ser contornado distribuindo
// requisições entre instâncias. Para um rate limit real e global, seria necessário
// um store compartilhado (ex: Redis/Upstash). Mantido assim por simplicidade até
// que o volume de abuso justifique a complexidade adicional.
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
    headers.get('x-vercel-forwarded-for') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}
