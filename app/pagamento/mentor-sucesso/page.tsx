'use client'

import Link from 'next/link'

export default function MentorSucessoPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px 24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎓</div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#F0F0F0', marginBottom: '12px' }}>
          Módulo Mentor ativado!
        </h1>
        <p style={{ color: '#888', fontSize: '16px', marginBottom: '32px' }}>
          Sua escola já pode criar mentorias e abrir turmas. O menu "Mentorias" apareceu no seu painel.
        </p>
        <Link href="/dashboard/mentorias" style={{
          display: 'inline-block', padding: '14px 36px',
          background: '#7C4DFF', color: '#fff',
          fontWeight: '800', fontSize: '15px',
          borderRadius: '12px', textDecoration: 'none',
        }}>
          Ir para Mentorias →
        </Link>
      </div>
    </div>
  )
}
