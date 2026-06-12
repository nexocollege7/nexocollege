'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { getUnreadCount } from '@/app/actions/chat-actions'

const menuAluno = [
  { href: '/dashboard/meus-cursos', label: 'Meus Cursos', icon: '📚' },
  { href: '/dashboard/certificados', label: 'Certificados', icon: '🏆' },
  { href: '/dashboard/mensagens', label: 'Mensagens', icon: '💬' },
]

export function SidebarAluno({ onClose }: { onClose?: () => void } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [unread, setUnread] = useState(0)
  const [escola, setEscola] = useState<{ name: string, slug: string, primary_color: string } | null>(null)

  useEffect(() => {
    async function load() {
      const count = await getUnreadCount()
      setUnread(count)

      // Buscar escola do aluno
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single()

      if (profile?.school_id) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('name, slug, primary_color')
          .eq('id', profile.school_id)
          .single()

        if (schoolData) setEscola(schoolData)
      }
    }
    load()
    const interval = setInterval(async () => {
      const count = await getUnreadCount()
      setUnread(count)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const corEscola = escola?.primary_color || '#AEEA00'

  return (
    <aside style={{
      width: collapsed ? '60px' : '240px',
      minHeight: '100vh',
      backgroundColor: '#111111',
      borderRight: '1px solid #2A2A2A',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Logo da escola */}
      <div style={{
        padding: '20px 12px',
        borderBottom: '1px solid #2A2A2A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px',
        cursor: escola ? 'pointer' : 'default',
      }}
        onClick={() => escola && router.push('/vitrine/' + escola.slug)}
        title={escola ? 'Ver vitrine da escola' : ''}
      >
        {!collapsed && (
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: corEscola, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
              {escola ? escola.name : 'NexoCollege'}
            </span>
            <div style={{ fontSize: '11px', color: '#555555', marginTop: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Area do Aluno
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: corEscola + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '800', color: corEscola,
          }}>
            {escola ? escola.name.charAt(0).toUpperCase() : 'N'}
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555555', fontSize: '18px', padding: '4px', flexShrink: 0,
        }}>
          {collapsed ? '>' : '☰'}
        </button>
      </div>

      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {menuAluno.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isMensagens = item.href === '/dashboard/mensagens'
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: collapsed ? '10px' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px', marginBottom: '2px', textDecoration: 'none',
              fontSize: '14px', fontWeight: isActive ? '600' : '400',
              color: isActive ? corEscola : '#888888',
              backgroundColor: isActive ? '#1A1A1A' : 'transparent',
              borderLeft: collapsed ? '3px solid transparent' : (isActive ? '3px solid ' + corEscola : '3px solid transparent'),
              transition: 'all 0.15s ease', position: 'relative',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0, position: 'relative' }}>
                {item.icon}
                {isMensagens && unread > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-6px', backgroundColor: '#FF5555', color: '#fff', fontSize: '9px', fontWeight: '700', borderRadius: '10px', padding: '1px 4px', minWidth: '14px', textAlign: 'center', lineHeight: '14px' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              {!collapsed && item.label}
              {!collapsed && isMensagens && unread > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: '#FF5555', color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '1px 6px', minWidth: '18px', textAlign: 'center' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )
        })}

        {/* Botao Vitrine */}
        {escola && (
          <Link href={'/vitrine/' + escola.slug} title={collapsed ? 'Ver Vitrine' : undefined} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '10px' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '8px', marginBottom: '2px', textDecoration: 'none',
            fontSize: '14px', fontWeight: '400', color: '#888888',
            backgroundColor: 'transparent',
            borderLeft: '3px solid transparent',
            transition: 'all 0.15s ease',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>🏫</span>
            {!collapsed && 'Vitrine'}
          </Link>
        )}
      </nav>

      <div style={{
        padding: collapsed ? '16px 8px' : '16px 20px',
        borderTop: '1px solid #2A2A2A',
        display: 'flex', flexDirection: 'column', gap: '8px',
        alignItems: collapsed ? 'center' : 'flex-start',
      }}>
        {!collapsed && (
          <p style={{ color: '#333333', fontSize: '10px', margin: 0 }}>
            Powered by NexoCollege
          </p>
        )}
        <button onClick={handleSair} title="Sair" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#FF5555', fontSize: '13px', padding: '6px 0',
          display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
        }}>
          <span style={{ fontSize: '14px' }}>🚪</span>
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}
