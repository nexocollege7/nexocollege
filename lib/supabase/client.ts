import { createBrowserClient } from '@supabase/ssr'

const NEXO_DOMAIN = 'nexocollege.com.br'

function isNexoHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === NEXO_DOMAIN || host.endsWith('.' + NEXO_DOMAIN)
}

// Remove cookies de sessão antigos presos a um único endereço (host-only),
// que conflitam com os cookies compartilhados entre subdomínios.
// Só apaga a versão sem domínio — o cookie compartilhado é preservado.
function limparCookiesLegados() {
  document.cookie.split(';').forEach((c) => {
    const nome = c.split('=')[0].trim()
    if (nome.startsWith('sb-')) {
      document.cookie = `${nome}=; Max-Age=0; path=/`
    }
  })
}

export function createClient() {
  const compartilhar = isNexoHost()
  if (compartilhar) limparCookiesLegados()
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    compartilhar
      ? { cookieOptions: { domain: '.' + NEXO_DOMAIN, sameSite: 'lax', secure: true, path: '/' } }
      : undefined
  )
}
