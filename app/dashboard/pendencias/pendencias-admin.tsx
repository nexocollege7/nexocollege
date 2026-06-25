'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { releasePendingEnrollment, refusePendingEnrollment } from '@/app/actions/pending-enrollments-actions'
import type { PendingEnrollmentWithDetails } from '@/lib/pending-enrollments'

type Props = {
  aguardandoLiberacaoInicial: PendingEnrollmentWithDetails[]
  aguardandoPagamentoInicial: PendingEnrollmentWithDetails[]
  whatsappContact: string | null
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function PendenciaCard({
  pendencia,
  whatsappContact,
  onRemover,
}: {
  pendencia: PendingEnrollmentWithDetails
  whatsappContact: string | null
  onRemover: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLiberar() {
    setLoading(true)
    setErro('')
    const result = await releasePendingEnrollment(pendencia.id)
    if (result.error) {
      setErro(result.error)
      setLoading(false)
    } else {
      onRemover(pendencia.id)
    }
  }

  async function handleRecusar() {
    const note = prompt('Motivo da recusa (visível para o aluno):')
    if (!note) return
    setLoading(true)
    setErro('')
    const result = await refusePendingEnrollment(pendencia.id, note)
    if (result.error) {
      setErro(result.error)
      setLoading(false)
    } else {
      onRemover(pendencia.id)
    }
  }

  function handleWhatsapp() {
    if (!whatsappContact) return
    const numero = whatsappContact.replace(/\D/g, '')
    window.open(`https://wa.me/${numero}`, '_blank')
  }

  const isAwaitingRelease = pendencia.status === 'awaiting_release'

  return (
    <Card style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <CardTitle style={{ color: '#F0F0F0' }}>{pendencia.student.full_name || 'Sem nome'}</CardTitle>
          <Badge
            style={
              isAwaitingRelease
                ? { backgroundColor: 'rgba(174,234,0,0.1)', color: '#AEEA00', border: 'none' }
                : { backgroundColor: 'rgba(255,184,0,0.1)', color: '#FFB800', border: 'none' }
            }
          >
            {isAwaitingRelease ? 'Aguardando liberação' : 'Aguardando pagamento'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
          <p style={{ color: '#CCCCCC', margin: 0 }}>{pendencia.course.title}</p>
          <p style={{ color: '#555555', margin: 0 }}>
            Inscrito em {formatarData(pendencia.created_at)} · Expira em {formatarData(pendencia.expires_at)}
          </p>
        </div>

        {erro && <p style={{ color: '#FF5555', fontSize: '13px', margin: 0 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isAwaitingRelease ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Visualização de comprovante em breve')}
              >
                Ver comprovante
              </Button>
              <Button
                size="sm"
                disabled={loading}
                onClick={handleLiberar}
                style={{ backgroundColor: '#AEEA00', color: '#0D0D0D', fontWeight: 700 }}
              >
                {loading ? '...' : 'Liberar'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={handleRecusar}
              >
                {loading ? '...' : 'Recusar'}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              disabled={!whatsappContact}
              onClick={handleWhatsapp}
              style={{ backgroundColor: '#25D366', color: '#0D0D0D', fontWeight: 700 }}
            >
              Falar no WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PendenciasAdmin({
  aguardandoLiberacaoInicial,
  aguardandoPagamentoInicial,
  whatsappContact,
}: Props) {
  const [aguardandoLiberacao, setAguardandoLiberacao] = useState(aguardandoLiberacaoInicial)
  const [aguardandoPagamento, setAguardandoPagamento] = useState(aguardandoPagamentoInicial)

  function handleRemover(id: string) {
    setAguardandoLiberacao((prev) => prev.filter((p) => p.id !== id))
    setAguardandoPagamento((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Pendências de Liberação</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          Acompanhe matrículas via Pix manual aguardando comprovante ou liberação
        </p>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          Aguardando liberação ({aguardandoLiberacao.length})
        </h2>
        {aguardandoLiberacao.length === 0 ? (
          <p style={{ color: '#444444', fontSize: '13px', margin: 0 }}>Nenhuma pendência aguardando liberação.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {aguardandoLiberacao.map((p) => (
              <PendenciaCard key={p.id} pendencia={p} whatsappContact={whatsappContact} onRemover={handleRemover} />
            ))}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          Aguardando pagamento ({aguardandoPagamento.length})
        </h2>
        {aguardandoPagamento.length === 0 ? (
          <p style={{ color: '#444444', fontSize: '13px', margin: 0 }}>Nenhuma pendência aguardando pagamento.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {aguardandoPagamento.map((p) => (
              <PendenciaCard key={p.id} pendencia={p} whatsappContact={whatsappContact} onRemover={handleRemover} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
