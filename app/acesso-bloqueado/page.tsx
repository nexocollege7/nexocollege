'use client'

import { createClient } from '@/lib/supabase/client'

export default function AcessoBloqueadoPage() {
  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          backgroundColor: '#1A0A0A', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px',
        }}>
          🔒
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 12px' }}>
          Acesso bloqueado
        </h1>
        <p style={{ color: '#888888', fontSize: '14px', lineHeight: '1.7', margin: '0 0 32px' }}>
          Sua conta foi temporariamente bloqueada. Entre em contato com a escola para reativar seu acesso.
        </p>
        <button
          onClick={handleSair}
          style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: '10px',
            backgroundColor: '#FF5555', color: '#fff', border: 'none',
            fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Sair
        </button>
      </div>
    </div>
  )
}
