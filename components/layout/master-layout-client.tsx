'use client'

import { useState } from 'react'
import { MasterSidebar } from './master-sidebar'
import { Header } from './header'

interface MasterLayoutClientProps {
  children: React.ReactNode
  userEmail: string
}

export function MasterLayoutClient({ children, userEmail }: MasterLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0D0D0D' }}>

      {/* Overlay mobile */}
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

      {/* Sidebar drawer (mobile) */}
      <div
        className="master-mobile-sidebar"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        <MasterSidebar />
      </div>

      {/* Sidebar fixa (desktop) */}
      <div className="master-desktop-sidebar">
        <MasterSidebar />
      </div>

      {/* Conteúdo principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar mobile */}
        <div className="master-mobile-topbar" style={{
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
              color: '#F0F0F0', fontSize: '22px', padding: '4px', flexShrink: 0,
            }}
          >
            ☰
          </button>
          <span style={{
            fontSize: '14px', fontWeight: '700', color: '#7C4DFF',
            flex: 1, textAlign: 'center', padding: '0 8px',
          }}>
            ⚡ Painel Master
          </span>
          <div style={{ width: '30px', flexShrink: 0 }} />
        </div>

        <Header user={{ email: userEmail, role: 'master' }} />
        <main className="master-main" style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .master-desktop-sidebar { display: none !important; }
          .master-mobile-topbar { display: flex !important; }
          .master-main { padding: 16px !important; }
        }
        @media (min-width: 769px) {
          .master-desktop-sidebar { display: block; }
          .master-mobile-topbar { display: none !important; }
          .master-mobile-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
