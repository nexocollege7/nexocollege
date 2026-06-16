'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Props = {
  slug: string
  cor: string
  nomeEscola: string
  basePath: string
  logoUrl?: string | null
}

export default function HeaderVitrine({ slug, cor, nomeEscola, basePath, logoUrl }: Props) {
  const [user, setUser] = useState<{ nome: string, avatar_url: string | null } | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      setUser({
        nome: profile?.full_name || user.email || 'Aluno',
        avatar_url: profile?.avatar_url || null,
      })
    }
    load()
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    window.location.href = `${basePath}/login`
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '8px',
    }}>
      <style>{`
        @media (min-width: 640px) {
          .vitrine-header { padding: 16px 48px !important; }
          .vitrine-nome { font-size: 18px !important; }
        }
      `}</style>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={nomeEscola} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            backgroundColor: cor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '700', color: '#0D0D0D',
          }}>
            {nomeEscola.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="vitrine-nome" style={{ fontSize: '14px', fontWeight: '700', color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nomeEscola}
        </span>
      </div>

      {/* Lado direito */}
      {user ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer', color: '#F0F0F0', flexShrink: 0,
            }}
          >
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.nome}
                style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                backgroundColor: cor, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#0D0D0D',
              }}>
                {user.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: '13px', fontWeight: '500', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                { label: '📚 Meus Cursos', href: 'https://nexocollege.com.br/dashboard/meus-cursos' },
                { label: '💬 Mensagens', href: 'https://nexocollege.com.br/dashboard/mensagens' },
                { label: '🏆 Certificados', href: 'https://nexocollege.com.br/dashboard/certificados' },
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
        <Link href={`${basePath}/login`} style={{
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
