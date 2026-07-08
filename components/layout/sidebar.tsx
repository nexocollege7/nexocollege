'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { getUnreadCount } from '@/app/actions/chat-actions'
import { getPendingCommentsCount } from '@/app/actions/comment-actions'
import { getActivePendingCount } from '@/app/actions/pending-enrollments-actions'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/escola', label: 'Minha Escola', icon: '🏫' },
  { href: '/dashboard/cursos', label: 'Cursos', icon: '📚' },
  { href: '/dashboard/alunos', label: 'Alunos', icon: '👥' },
  { href: '/dashboard/pendencias', label: 'Pendências de Liberação', icon: '🧾' },
  { href: '/dashboard/comentarios', label: 'Comentários de Aulas', icon: '💬' },
  { href: '/dashboard/vitrine', label: 'Vitrine', icon: '🌐' },
  { href: '/dashboard/upgrade', label: 'Upgrade', icon: '⚡' },
  { href: '/dashboard/suporte', label: 'Suporte', icon: '🆘' },
]

export function Sidebar({ schoolSlug, onClose }: { schoolSlug?: string | null, onClose?: () => void } = {}) {
  const pathname = usePathname()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [unread, setUnread] = useState(0)
  const [pendingComments, setPendingComments] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [mentorModule, setMentorModule] = useState(false)
  const [planoEscola, setPlanoEscola] = useState<string>('starter')

  useEffect(() => {
    async function loadMentorModule() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ownedSchool } = await supabase
        .from('schools')
        .select('mentor_module, plan')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (ownedSchool) {
        setMentorModule(!!ownedSchool.mentor_module)
        setPlanoEscola(ownedSchool?.plan ?? 'starter')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single()

      if (!profile?.school_id) return

      const { data: school } = await supabase
        .from('schools')
        .select('mentor_module, plan')
        .eq('id', profile.school_id)
        .single()

      setMentorModule(!!school?.mentor_module)
      setPlanoEscola(school?.plan ?? 'starter')
    }
    loadMentorModule()
  }, [supabase])

  useEffect(() => {
    async function loadUnread() {
      const count = await getUnreadCount()
      setUnread(count)
    }
    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function loadPendingComments() {
      const count = await getPendingCommentsCount()
      setPendingComments(count)
    }
    loadPendingComments()
    const interval = setInterval(loadPendingComments, 30000)
    const handler = () => loadPendingComments()
    window.addEventListener('commentsUpdated', handler)
    return () => {
      clearInterval(interval)
      window.removeEventListener('commentsUpdated', handler)
    }
  }, [])

  useEffect(() => {
    async function loadPendingApprovals() {
      const count = await getActivePendingCount()
      setPendingApprovals(count)
    }
    loadPendingApprovals()
    const interval = setInterval(loadPendingApprovals, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    window.location.href = schoolSlug ? `/vitrine/${schoolSlug}/login` : '/login'
  }

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
      <div style={{
        height: '64px',
        boxSizing: 'border-box' as const,
        padding: '0 12px',
        borderBottom: '1px solid #2A2A2A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px',
      }}>
        {!collapsed && (
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#AEEA00', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
            Nexo<span style={{ color: '#F0F0F0' }}>College</span>
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555555', fontSize: '18px', padding: '4px', flexShrink: 0,
        }}>
          {collapsed ? '→' : '☰'}
        </button>
      </div>

      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {[
          ...menuItems.slice(0, 3),
          ...(['creator', 'pro', 'scale', 'enterprise'].includes(planoEscola) ? [{ href: '/dashboard/depoimentos', label: 'Depoimentos', icon: '🌟' }] : []),
          ...(mentorModule ? [{ href: '/dashboard/mentorias', label: 'Mentorias', icon: '🎓' }, { href: '/dashboard/mentores', label: 'Mentores', icon: '👨‍🏫' }, { href: '/dashboard/mensagens', label: 'Mensagens', icon: '💬' }] : []),
          ...(['pro', 'scale', 'enterprise'].includes(planoEscola) ? [{ href: '/dashboard/comunicados', label: 'Comunicados', icon: '📣' }, { href: '/dashboard/chamados', label: 'Suporte ao Aluno', icon: '🎫' }, { href: '/dashboard/ao-vivo', label: 'Ao Vivo', icon: '📡' }] : []),
          ...menuItems.slice(3),
        ].map((item) => {
          const isActive = pathname === item.href
          const isMensagens = item.href === '/dashboard/mensagens'
          const isComentarios = item.href === '/dashboard/comentarios'
          const isPendencias = item.href === '/dashboard/pendencias'
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px',
              marginBottom: '2px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? '#AEEA00' : '#888888',
              backgroundColor: isActive ? '#1A1A1A' : 'transparent',
              borderLeft: collapsed ? '3px solid transparent' : (isActive ? '3px solid #AEEA00' : '3px solid transparent'),
              transition: 'all 0.15s ease',
              position: 'relative',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0, position: 'relative' }}>
                {item.icon}
                {isMensagens && unread > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-6px',
                    backgroundColor: '#FF5555', color: '#fff',
                    fontSize: '9px', fontWeight: '700',
                    borderRadius: '10px', padding: '1px 4px',
                    minWidth: '14px', textAlign: 'center',
                    lineHeight: '14px',
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
                {isComentarios && pendingComments > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-6px',
                    backgroundColor: '#FF5555', color: '#fff',
                    fontSize: '9px', fontWeight: '700',
                    borderRadius: '10px', padding: '1px 4px',
                    minWidth: '14px', textAlign: 'center',
                    lineHeight: '14px',
                  }}>
                    {pendingComments > 9 ? '9+' : pendingComments}
                  </span>
                )}
                {isPendencias && pendingApprovals > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-6px',
                    backgroundColor: '#FF5555', color: '#fff',
                    fontSize: '9px', fontWeight: '700',
                    borderRadius: '10px', padding: '1px 4px',
                    minWidth: '14px', textAlign: 'center',
                    lineHeight: '14px',
                  }}>
                    {pendingApprovals > 9 ? '9+' : pendingApprovals}
                  </span>
                )}
              </span>
              {!collapsed && item.label}
              {!collapsed && isMensagens && unread > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: '#FF5555', color: '#fff',
                  fontSize: '10px', fontWeight: '700',
                  borderRadius: '10px', padding: '1px 6px',
                  minWidth: '18px', textAlign: 'center',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {!collapsed && isComentarios && pendingComments > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: '#FF5555', color: '#fff',
                  fontSize: '10px', fontWeight: '700',
                  borderRadius: '10px', padding: '1px 6px',
                  minWidth: '18px', textAlign: 'center',
                }}>
                  {pendingComments > 9 ? '9+' : pendingComments}
                </span>
              )}
              {!collapsed && isPendencias && pendingApprovals > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: '#FF5555', color: '#fff',
                  fontSize: '10px', fontWeight: '700',
                  borderRadius: '10px', padding: '1px 6px',
                  minWidth: '18px', textAlign: 'center',
                }}>
                  {pendingApprovals > 9 ? '9+' : pendingApprovals}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{
        padding: collapsed ? '16px 8px' : '16px 20px',
        borderTop: '1px solid #2A2A2A',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: collapsed ? 'center' : 'flex-start',
      }}>
        <button onClick={handleSair} title="Sair" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#FF5555', fontSize: '13px', padding: '6px 0',
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: 'inherit',
        }}>
          <span style={{ fontSize: '14px' }}>🚪</span>
          {!collapsed && 'Sair'}
        </button>
        {!collapsed && <span style={{ fontSize: '11px', color: '#333333' }}>NexoCollege v1.0</span>}
      </div>
    </aside>
  )
}
