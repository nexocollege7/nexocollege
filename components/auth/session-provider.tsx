'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Mantém a sessão Supabase viva enquanto o usuário está em páginas estáticas
// (ex: assistindo vídeo por 30+ min sem navegar). Sem este componente,
// o access token expira e o próximo clique redireciona para login.
export function SessionProvider() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    // O createBrowserClient já faz auto-refresh internamente; este intervalo
    // garante que getSession() seja chamado proativamente a cada 4 min,
    // evitando que o token expire em abas que ficam abertas sem navegação.
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }, 4 * 60 * 1000)

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [router])

  return null
}
