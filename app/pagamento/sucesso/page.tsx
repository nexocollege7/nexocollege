'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PagamentoSucessoConteudo() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`@media(max-width:480px){.sucesso-card{padding:32px 20px !important}}`}</style>
      <div className="sucesso-card" style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid #2A2A2A',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>
          {status === 'approved' ? '✅' : '⏳'}
        </div>
        <h1 style={{ color: '#AEEA00', fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>
          {status === 'approved' ? 'Pagamento aprovado!' : 'Pagamento em processamento'}
        </h1>
        <p style={{ color: '#888888', fontSize: '15px', lineHeight: '1.6', margin: '0 0 32px' }}>
          {status === 'approved'
            ? 'Sua matrícula foi confirmada. Você já pode acessar o curso.'
            : 'Assim que o pagamento for confirmado, sua matrícula será ativada.'}
        </p>
        <Link href="/dashboard/meus-cursos" style={{
          display: 'inline-block',
          backgroundColor: '#AEEA00',
          color: '#0D0D0D',
          fontWeight: '700',
          fontSize: '14px',
          padding: '12px 28px',
          borderRadius: '8px',
          textDecoration: 'none',
        }}>
          Acessar meus cursos
        </Link>
      </div>
    </div>
  )
}

export default function PagamentoSucessoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888888' }}>Carregando...</p>
      </div>
    }>
      <PagamentoSucessoConteudo />
    </Suspense>
  )
}