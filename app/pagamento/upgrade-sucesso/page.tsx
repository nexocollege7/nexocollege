'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function UpgradeSucessoContent() {
  const params = useSearchParams()
  const plano = params.get('plano') || 'pro'
  const nomes: Record<string, string> = { pro: 'Pro', enterprise: 'Enterprise' }

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px 24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#F0F0F0', marginBottom: '12px' }}>
          Upgrade realizado!
        </h1>
        <p style={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>
          Sua escola agora está no plano
        </p>
        <div style={{
          display: 'inline-block', padding: '6px 20px', borderRadius: '100px',
          background: 'rgba(174,234,0,0.1)', border: '1px solid rgba(174,234,0,0.3)',
          color: '#AEEA00', fontWeight: '800', fontSize: '18px', marginBottom: '32px',
        }}>
          {nomes[plano] || plano}
        </div>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
          Seu plano foi atualizado. Os novos recursos já estão disponíveis na sua escola.
        </p>
        <Link href="/dashboard" style={{
          display: 'inline-block', padding: '14px 36px',
          background: '#AEEA00', color: '#0D0D0D',
          fontWeight: '800', fontSize: '15px',
          borderRadius: '12px', textDecoration: 'none',
        }}>
          Ir para o dashboard →
        </Link>
      </div>
    </div>
  )
}

export default function UpgradeSucessoPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D0D0D' }} />}>
      <UpgradeSucessoContent />
    </Suspense>
  )
}
