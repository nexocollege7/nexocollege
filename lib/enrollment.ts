export function matriculaValida(e: { status: string; expires_at: string | null }): boolean {
  if (e.status !== 'active') return false
  if (!e.expires_at) return true
  return new Date(e.expires_at) > new Date()
}

export function diasRestantes(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
}

export function corDiasRestantes(dias: number | null): string {
  if (dias === null) return '#AEEA00'
  if (dias <= 7) return '#FF4444'
  if (dias <= 30) return '#FFB800'
  return '#AEEA00'
}
