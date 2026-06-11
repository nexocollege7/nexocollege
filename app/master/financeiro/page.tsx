'use client'

import { useEffect, useState } from 'react'
import { getEscolas } from '@/app/actions/master-actions'

export default function FinanceiroPage() {
  const [escolas, setEscolas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getEscolas()
      setEscolas(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Financeiro
        </h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
          Visão financeira da plataforma
        </p>
      </div>

      {/* Aviso gateway */}
      <div style={{
        backgroundColor: '#1A1A0A', border: '1px solid #AEEA00',
        borderRadius: '12px', padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: '16px',
      }}>
        <span style={{ fontSize: '24px' }}>💡</span>
        <div>
          <p style={{ color: '#AEEA00', fontWeight: '600', fontSize: '14px', margin: '0 0 4px' }}>
            Gateway de pagamento por escola
          </p>
          <p style={{ color: '#888888', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            Cada escola configura seu próprio Mercado Pago. Os pagamentos dos alunos
            vão direto para a conta do professor — o NexoCollege cobra uma mensalidade
            separada pelo uso da plataforma.
          </p>
        </div>
      </div>

      {/* Lista de escolas com status do gateway */}
      <div style={{
        backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #2A2A2A',
          display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px',
          gap: '16px',
        }}>
          {['Escola', 'Plano', 'Status', 'Gateway MP'].map((h) => (
            <p key={h} style={{ color: '#555555', fontSize: '12px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {h}
            </p>
          ))}
        </div>

        {escolas.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#555555', fontSize: '14px' }}>Nenhuma escola cadastrada ainda.</p>
          </div>
        ) : (
          escolas.map((escola, index) => (
            <div key={escola.id} style={{
              padding: '16px 20px',
              borderBottom: index < escolas.length - 1 ? '1px solid #1A1A1A' : 'none',
              display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px',
              gap: '16px', alignItems: 'center',
            }}>
              <div>
                <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                  {escola.name}
                </p>
                <p style={{ color: '#555555', fontSize: '12px', margin: '2px 0 0' }}>
                  {escola.courses?.[0]?.count || 0} curso(s)
                </p>
              </div>
              <span style={{
                fontSize: '12px', fontWeight: '600', padding: '4px 10px',
                borderRadius: '20px', backgroundColor: '#1E0E3F', color: '#7C4DFF',
                display: 'inline-block',
              }}>
                {escola.plan || 'starter'}
              </span>
              <span style={{
                fontSize: '12px', fontWeight: '600', padding: '4px 10px',
                borderRadius: '20px', display: 'inline-block',
                backgroundColor: escola.is_active ? '#1A2E00' : '#2A1A1A',
                color: escola.is_active ? '#AEEA00' : '#FF5555',
              }}>
                {escola.is_active ? 'Ativa' : 'Suspensa'}
              </span>
              <span style={{
                fontSize: '12px', fontWeight: '600', padding: '4px 10px',
                borderRadius: '20px', display: 'inline-block',
                backgroundColor: escola.mp_access_token ? '#1A2E00' : '#2A1A1A',
                color: escola.mp_access_token ? '#AEEA00' : '#888888',
              }}>
                {escola.mp_access_token ? '✓ Configurado' : '— Pendente'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}