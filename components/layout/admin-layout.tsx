'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { SidebarAluno } from './sidebar-aluno'
import { Header } from './header'
import { SessionProvider } from '@/components/auth/session-provider'
import { ProfessorOnlineBanner } from '@/components/ProfessorOnlineBanner'

interface AdminLayoutProps {
  children: React.ReactNode
  user: {
    email: string
    role?: string
    full_name?: string
    avatar_url?: string | null
    school_name?: string | null
    school_logo_url?: string | null
    school_slug?: string | null
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
          : <Sidebar schoolSlug={user.school_slug ?? null} onClose={() => setMobileOpen(false)} />
        }
      </div>

      {/* SIDEBAR DESKTOP — sempre visível acima de 768px */}
      <div className="desktop-sidebar">
        {isAluno ? <SidebarAluno /> : <Sidebar schoolSlug={user.school_slug ?? null} />}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, overflow: 'hidden', padding: '0 8px' }}>
            {isAluno && user.school_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.school_logo_url}
                alt={user.school_name ?? ''}
                style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : isAluno && user.school_name ? (
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                backgroundColor: '#AEEA00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '800', color: '#0D0D0D',
              }}>
                {user.school_name.charAt(0).toUpperCase()}
              </div>
            ) : null}
            <span style={{
              fontSize: '14px', fontWeight: '700',
              color: isAluno && user.school_name ? '#F0F0F0' : '#AEEA00',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isAluno && user.school_name
                ? user.school_name
                : <><span style={{ color: '#AEEA00' }}>Nexo</span><span style={{ color: '#F0F0F0' }}>College</span></>
              }
            </span>
          </div>
          <div style={{ width: '30px', flexShrink: 0 }} />
        </div>

        <Header user={user} title={title} />
        <main style={{ flex: 1, padding: '24px' }}>
          {isAluno && <ProfessorOnlineBanner />}
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
