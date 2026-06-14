'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const menuMaster = [
  { href: '/master', label: 'Dashboard', icon: '⊞' },
  { href: '/master/escolas', label: 'Escolas', icon: '🏫' },
  { href: '/master/nova-escola', label: 'Nova Escola', icon: '➕' },
  { href: '/master/financeiro', label: 'Financeiro', icon: '💰' },
  { href: '/master/planos', label: 'Planos', icon: '⭐' },
  { href: '/master/analise', label: 'Analise', icon: '📊' },
  { href: '/master/suporte', label: 'Suporte', icon: '🎫' },
]

export function MasterSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [pendentes, setPendentes] = useState(0)

  useEffect(() => {
    async function loadPendentes() {
      const supabase = createClient()
      const { data } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('ticket_type', 'escola_master')
        .eq('status', 'aberto')
      setPendentes(data?.length || 0)
    }
    loadPendentes()
    const interval = setInterval(loadPendentes, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
      {/* Logo + hamburguer */}
      <div style={{
        padding: '20px 12px',
        borderBottom: '1px solid #2A2A2A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px',
      }}>
        {!collapsed && (
          <div>
            <img src="/logo.png" alt="NexoCollege" style={{ height: '32px', mixBlendMode: 'lighten', display: 'block', marginBottom: '4px' }} />
            <div style={{ fontSize: '11px', color: '#7C4DFF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ⚡ Painel Master
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555555', fontSize: '18px', padding: '4px', flexShrink: 0,
        }}>
          {collapsed ? '→' : '☰'}
        </button>
      </div>

      {/* Menu */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {menuMaster.map((item) => {
          const isActive = pathname === item.href
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
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0, position: 'relative' }}>
                {item.icon}
                {item.href === '/master/suporte' && pendentes > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-6px', backgroundColor: '#FF5555', color: '#fff', fontSize: '9px', fontWeight: '700', borderRadius: '10px', padding: '1px 4px', minWidth: '14px', textAlign: 'center', lineHeight: '14px' }}>
                    {pendentes > 9 ? '9+' : pendentes}
                  </span>
                )}
              </span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé com botão Sair */}
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
        {!collapsed && <span style={{ fontSize: '11px', color: '#333333' }}>NexoCollege Master v1.0</span>}
      </div>
    </aside>
  )
}
