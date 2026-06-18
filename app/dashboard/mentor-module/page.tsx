'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMySchool } from '@/app/actions/school-actions'
import { elegivelParaMentorModule, MENTOR_MODULE_PRICE_YEARLY } from '@/lib/mentor-module'

const BENEFICIOS = [
  'Venda mentorias individuais ou em grupo, além dos seus cursos',
  'Abra turmas com vagas limitadas e datas de inscrição',
  'Cronograma de encontros com materiais de apoio',
  'Pagamento direto na sua conta do Mercado Pago',
  'Menu "Mentorias" dedicado no seu painel',
]

function MentorModuleContent() {
  const params = useSearchParams()
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comprando, setComprando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function load() {
      const data = await getMySchool()
      setSchool(data)
      setLoading(false)
    }
    load()
    if (params.get('erro') === 'pagamento') setErro('Pagamento não foi concluído. Tente novamente.')
  }, [params])

  async function handleComprar() {
    setComprando(true)
    setErro('')
    try {
      const res = await fetch('/api/criar-preferencia-mentor-addon', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao iniciar pagamento.')
        setComprando(false)
        return
      }
      window.location.href = data.url
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setComprando(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p style={{ color: '#888' }}>Carregando...</p>
      </div>
    )
  }

  const elegivel = elegivelParaMentorModule(school?.plan)

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7C4DFF', marginBottom: '8px' }}>
          Add-on
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#F0F0F0', marginBottom: '12px' }}>
          Módulo Mentor
        </h1>
        <p style={{ color: '#888', fontSize: '16px' }}>
          Transforme seu conhecimento em mentorias pagas, com turmas e cronograma próprios.
        </p>
      </div>

      {erro && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', borderRadius: '10px', padding: '12px 16px',
          marginBottom: '24px', textAlign: 'center', fontSize: '14px',
        }}>
          {erro}
        </div>
      )}

      <div style={{
        background: '#141414', border: '1px solid rgba(124,77,255,0.3)',
        borderRadius: '20px', padding: '36px', boxShadow: '0 0 40px rgba(124,77,255,0.08)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {BENEFICIOS.map((b) => (
            <div key={b} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#CCCCCC' }}>
              <span style={{ color: '#7C4DFF', fontWeight: '900' }}>✓</span> {b}
            </div>
          ))}
        </div>

        <div style={{ fontSize: '38px', fontWeight: '900', color: '#F0F0F0', marginBottom: '4px' }}>
          R$ {MENTOR_MODULE_PRICE_YEARLY.toLocaleString('pt-BR')}
          <span style={{ fontSize: '15px', color: '#555', fontWeight: '400' }}>/ano</span>
        </div>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '28px' }}>
          Cobrado anualmente, além da sua assinatura atual
        </p>

        {!elegivel ? (
          <div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
              O Módulo Mentor está disponível a partir do plano <strong style={{ color: '#F0F0F0' }}>Creator</strong>.
            </p>
            <Link href="/dashboard/upgrade" style={{
              display: 'block', textAlign: 'center', padding: '14px',
              background: '#AEEA00', color: '#0D0D0D', fontWeight: '800', fontSize: '15px',
              borderRadius: '12px', textDecoration: 'none',
            }}>
              Ver planos →
            </Link>
          </div>
        ) : school?.mentor_module ? (
          <div>
            <p style={{ color: '#AEEA00', fontSize: '14px', marginBottom: '16px', fontWeight: '700' }}>
              ✅ Módulo já ativo na sua escola
            </p>
            <Link href="/dashboard/mentorias" style={{
              display: 'block', textAlign: 'center', padding: '14px',
              background: '#7C4DFF', color: '#fff', fontWeight: '800', fontSize: '15px',
              borderRadius: '12px', textDecoration: 'none',
            }}>
              Ir para Mentorias →
            </Link>
          </div>
        ) : (
          <button
            onClick={handleComprar}
            disabled={comprando}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '12px',
              background: comprando ? '#333' : '#7C4DFF', color: '#fff',
              fontWeight: '800', fontSize: '15px', cursor: comprando ? 'not-allowed' : 'pointer',
            }}
          >
            {comprando ? 'Aguarde...' : 'Ativar Módulo Mentor'}
          </button>
        )}

        <p style={{ textAlign: 'center', color: '#555', fontSize: '12px', marginTop: '16px' }}>
          Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  )
}

export default function MentorModulePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <MentorModuleContent />
    </Suspense>
  )
}
