'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/escola', label: 'Minha Escola', icon: '🏫' },
  { href: '/dashboard/cursos', label: 'Cursos', icon: '📚' },
  { href: '/dashboard/alunos', label: 'Alunos', icon: '👥' },
  { href: '/dashboard/mensagens', label: 'Mensagens', icon: '💬' },
  { href: '/dashboard/certificados', label: 'Certificados', icon: '🏆' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        backgroundColor: '#111111',
        borderRight: '1px solid #2A2A2A',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        flexShrink: 0,
      }}
    >
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
      </div>

      {/* Menu */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {menuItems.map((item) => {
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
        fontSize: '12px',
        color: '#555555',
      }}>
        NexoCollege v1.0
      </div>
    </aside>
  )
}