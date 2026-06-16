'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { SidebarAluno } from './sidebar-aluno'
import { Header } from './header'
import { SessionProvider } from '@/components/auth/session-provider'

interface AdminLayoutProps {
  children: React.ReactNode
  user: {
    email: string
    role?: string
    full_name?: string
    avatar_url?: string | null
  }
  title?: string
}

export function AdminLayout({ children, user, title }: AdminLayoutProps) {
  const isAluno = user.role === 'student'
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0D0D0D' }}>
      <SessionProvider />

      {/* OVERLAY — aparece atrás do drawer no mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* SIDEBAR — drawer no mobile, fixa no desktop */}
      <div style={{
        position: 'fixed' as const,
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}
        className="mobile-sidebar"
      >
        {isAluno
          ? <SidebarAluno onClose={() => setMobileOpen(false)} />
          : <Sidebar onClose={() => setMobileOpen(false)} />
        }
      </div>

      {/* SIDEBAR DESKTOP — sempre visível acima de 768px */}
      <div className="desktop-sidebar">
        {isAluno ? <SidebarAluno /> : <Sidebar />}
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* TOPBAR MOBILE */}
        <div className="mobile-topbar" style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '56px',
          backgroundColor: '#111111',
          borderBottom: '1px solid #2A2A2A',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#F0F0F0', fontSize: '22px', padding: '4px',
              flexShrink: 0,
            }}
          >
            ☰
          </button>
          <span style={{
            fontSize: '14px', fontWeight: '700', color: '#AEEA00',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1, textAlign: 'center', padding: '0 8px',
          }}>
            Nexo<span style={{ color: '#F0F0F0' }}>College</span>
          </span>
          <div style={{ width: '30px', flexShrink: 0 }} />
        </div>

        <Header user={user} title={title} />
        <main style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-sidebar { transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'}; }
          main { padding: 16px !important; }
        }
        @media (max-width: 480px) {
          main { padding: 12px !important; }
        }
        @media (min-width: 769px) {
          .desktop-sidebar { display: block; }
          .mobile-topbar { display: none !important; }
          .mobile-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
