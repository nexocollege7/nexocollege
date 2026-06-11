'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Props = {
  slug: string
  cor: string
  nomeEscola: string
}

export default function HeaderVitrine({ slug, cor, nomeEscola }: Props) {
  const [user, setUser] = useState<{ nome: string } | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      setUser({ nome: profile?.full_name || user.email || 'Aluno' })
    }
    load()
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    router.push(`/vitrine/${slug}`)
    router.refresh()
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
      padding: '16px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          backgroundColor: cor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: '700', color: '#0D0D0D',
        }}>
          {nomeEscola.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '18px', fontWeight: '700', color: '#F0F0F0' }}>
          {nomeEscola}
        </span>
      </div>

      {/* Lado direito */}
      {user ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 16px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: `1px solid rgba(255,255,255,0.15)`,
              cursor: 'pointer', color: '#F0F0F0',
            }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: cor, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#0D0D0D',
            }}>
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Olá, {user.nome.split(' ')[0]}
            </span>
            <span style={{ fontSize: '10px', color: '#888888' }}>▼</span>
          </button>

          {menuAberto && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: '12px', overflow: 'hidden', minWidth: '200px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {[
                { label: '📚 Meus Cursos', href: '/dashboard/meus-cursos' },
                { label: '💬 Mensagens', href: '/dashboard/mensagens' },
                { label: '🏆 Certificados', href: '/dashboard/certificados' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAberto(false)}
                  style={{
                    display: 'block', padding: '12px 16px',
                    color: '#F0F0F0', textDecoration: 'none',
                    fontSize: '14px', borderBottom: '1px solid #2A2A2A',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSair}
                style={{
                  display: 'block', width: '100%', padding: '12px 16px',
                  color: '#FF5555', textAlign: 'left',
                  fontSize: '14px', background: 'none', border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href={`/vitrine/${slug}/login`} style={{
          padding: '8px 20px', borderRadius: '8px',
          backgroundColor: cor, color: '#0D0D0D',
          fontWeight: '700', fontSize: '14px', textDecoration: 'none',
        }}>
          Entrar
        </Link>
      )}
    </header>
  )
}
