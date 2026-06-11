'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuMaster = [
  { href: '/master', label: 'Dashboard', icon: '⊞' },
  { href: '/master/escolas', label: 'Escolas', icon: '🏫' },
  { href: '/master/nova-escola', label: 'Nova Escola', icon: '➕' },
  { href: '/master/financeiro', label: 'Financeiro', icon: '💰' },
]

export function MasterSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      backgroundColor: '#111111',
      borderRight: '1px solid #2A2A2A',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #2A2A2A',
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#AEEA00',
          letterSpacing: '-0.5px',
        }}>
          Nexo<span style={{ color: '#F0F0F0' }}>College</span>
        </span>
        <div style={{
          fontSize: '11px',
          color: '#7C4DFF',
          marginTop: '2px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          ⚡ Painel Master
        </div>
      </div>

      {/* Menu */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {menuMaster.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '2px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#AEEA00' : '#888888',
                backgroundColor: isActive ? '#1A1A1A' : 'transparent',
                borderLeft: isActive ? '3px solid #AEEA00' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #2A2A2A',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <Link href="/dashboard" style={{
          fontSize: '12px',
          color: '#555555',
          textDecoration: 'none',
        }}>
          ← Voltar ao Dashboard
        </Link>
        <span style={{ fontSize: '11px', color: '#333333' }}>
          NexoCollege Master v1.0
        </span>
      </div>
    </aside>
  )
}