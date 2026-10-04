'use client'

import { useEffect, useRef, useState } from 'react'
import { getLessonFeedback, rateLesson, answerLessonPulse, getLessonNote, saveLessonNote } from '@/app/actions/lesson-feedback-actions'

// ── Estrelas de avaliação da aula ────────────────────────────────────────
export function LessonStars({ lessonId, onRated }: { lessonId: string; onRated?: (nota: number) => void }) {
  const [nota, setNota] = useState<number | null>(null)
  const [hover, setHover] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let ativo = true
    getLessonFeedback(lessonId).then((r) => { if (ativo) setNota(r.myRating) }).catch(() => {})
    return () => { ativo = false }
  }, [lessonId])

  async function avaliar(n: number) {
    if (salvando) return
    const anterior = nota
    setNota(n)
    setSalvando(true)
    const r = await rateLesson(lessonId, n).catch(() => ({ error: 'erro' }))
    setSalvando(false)
    if (r.error) {
      setNota(anterior)
      setMsg('Não foi possível salvar')
      return
    }
    setMsg('Obrigado!')
    setTimeout(() => setMsg(''), 2500)
    onRated?.(n)
  }

  const destaque = hover || nota || 0

  return (
    <div
      onMouseLeave={() => setHover(0)}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', border: '1px solid #2A2A2A' }}
    >
      <span style={{ color: '#888888', fontSize: '13px', fontWeight: 600 }}>{nota ? 'Sua nota' : 'Avalie esta aula'}</span>
      <div style={{ display: 'flex', gap: '1px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => avaliar(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', fontSize: '17px', lineHeight: 1, color: n <= destaque ? '#FFB800' : '#444444', fontFamily: 'inherit' }}
          >
            ★
          </button>
        ))}
      </div>
      {msg && <span style={{ color: msg === 'Obrigado!' ? '#AEEA00' : '#FF5555', fontSize: '12px' }}>{msg}</span>}
    </div>
  )
}

// ── Pulso "Como está a aula até aqui?" ───────────────────────────────────
// Aparece uma vez por aula, após 4 a 10 minutos (sorteado) com a aba visível.
export function LessonPulse({ lessonId }: { lessonId: string }) {
  const [visivel, setVisivel] = useState(false)
  const [agradecido, setAgradecido] = useState(false)

  useEffect(() => {
    let cancelado = false
    let timer: ReturnType<typeof setInterval> | null = null
    let segundos = 0
    const alvo = 240 + Math.floor(Math.random() * 361)

    try {
      if (localStorage.getItem(`pulso-fechado-${lessonId}`)) return
    } catch {}

    getLessonFeedback(lessonId)
      .then((r) => {
        if (cancelado || r.pulseAnswered) return
        timer = setInterval(() => {
          if (document.visibilityState !== 'visible') return
          segundos += 5
          if (segundos >= alvo) {
            if (timer) clearInterval(timer)
            if (!cancelado) setVisivel(true)
          }
        }, 5000)
      })
      .catch(() => {})

    return () => {
      cancelado = true
      if (timer) clearInterval(timer)
    }
  }, [lessonId])

  function fechar() {
    setVisivel(false)
    try { localStorage.setItem(`pulso-fechado-${lessonId}`, '1') } catch {}
  }

  function responder(answer: 'confusa' | 'boa' | 'otima') {
    setAgradecido(true)
    answerLessonPulse(lessonId, answer).catch(() => {})
    setTimeout(() => setVisivel(false), 2000)
  }

  if (!visivel) return null

  const botao = { flex: 1, padding: '7px 0', borderRadius: '8px', border: '1px solid #2A2A2A', background: 'transparent', color: '#F0F0F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as const

  return (
    <div style={{ flexShrink: 0, margin: '12px 24px 0', backgroundColor: 'rgba(174,234,0,0.06)', border: '1px solid rgba(174,234,0,0.35)', borderRadius: '12px', padding: '12px 16px' }}>
      {agradecido ? (
        <p style={{ color: '#AEEA00', fontSize: '13px', fontWeight: 600, margin: 0, textAlign: 'center' }}>Obrigado pelo retorno! 💚</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: 600, margin: 0, flex: '1 1 200px' }}>💬 Como está a aula até aqui?</p>
            <div style={{ display: 'flex', gap: '6px', flex: '1 1 260px', maxWidth: '360px' }}>
            <button onClick={() => responder('confusa')} style={botao}>Confusa</button>
            <button onClick={() => responder('boa')} style={botao}>Boa</button>
            <button onClick={() => responder('otima')} style={botao}>Ótima</button>
            </div>
            <button onClick={fechar} aria-label="Fechar" style={{ background: 'none', border: 'none', color: '#666666', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Convite discreto para depoimento ─────────────────────────────────────
export function ReviewInviteCard({ stage, onDeixar, onFechar }: { stage: string; onDeixar: () => void; onFechar: () => void }) {
  const titulo =
    stage === 'estrelas' ? 'Que bom que você gostou! Quer contar isso num depoimento?'
    : stage === 'conclusao' ? 'Parabéns por concluir o curso! Que tal deixar seu depoimento?'
    : 'O que você está achando do curso?'

  return (
    <div style={{ flexShrink: 0, margin: '12px 24px 0', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(174,234,0,0.35)', backgroundColor: 'rgba(174,234,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>💬 {titulo}</p>
        <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>Seu depoimento ajuda outras pessoas a conhecerem a escola.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onDeixar} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#AEEA00', color: '#0D0D0D', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Deixar depoimento</button>
        <button onClick={onFechar} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Agora não</button>
      </div>
    </div>
  )
}

// ── Minhas anotações desta aula (salva sozinho) ─────────────────────────
export function LessonNotes({ lessonId }: { lessonId: string }) {
  const [texto, setTexto] = useState('')
  const [status, setStatus] = useState<'' | 'salvando' | 'salvo' | 'erro'>('')
  const [carregado, setCarregado] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimo = useRef('')
  const pendente = useRef(false)

  useEffect(() => {
    let ativo = true
    getLessonNote(lessonId)
      .then((r) => { if (ativo) { setTexto(r.content); ultimo.current = r.content; setCarregado(true) } })
      .catch(() => { if (ativo) setCarregado(true) })
    return () => {
      ativo = false
      if (timer.current) clearTimeout(timer.current)
      if (pendente.current) saveLessonNote(lessonId, ultimo.current).catch(() => {})
    }
  }, [lessonId])

  async function salvar(valor: string) {
    pendente.current = false
    const r = await saveLessonNote(lessonId, valor).catch(() => ({ error: 'erro' }))
    setStatus(r.error ? 'erro' : 'salvo')
  }

  function aoDigitar(valor: string) {
    setTexto(valor)
    ultimo.current = valor
    pendente.current = true
    setStatus('salvando')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => salvar(valor), 1200)
  }

  function aoSair() {
    if (!pendente.current) return
    if (timer.current) clearTimeout(timer.current)
    salvar(ultimo.current)
  }

  return (
    <div style={{ flexShrink: 0, padding: '16px 24px', borderBottom: '1px solid #2A2A2A' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <p style={{ color: '#888888', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          📝 Minhas anotações desta aula
        </p>
        <span style={{ fontSize: '12px', color: status === 'erro' ? '#FF5555' : status === 'salvo' ? '#AEEA00' : '#666666' }}>
          {status === 'salvando' ? 'Salvando…' : status === 'salvo' ? '✓ Salvo' : status === 'erro' ? 'Não foi possível salvar' : ''}
        </span>
      </div>
      <textarea
        value={texto}
        onChange={(e) => aoDigitar(e.target.value)}
        onBlur={aoSair}
        disabled={!carregado}
        maxLength={5000}
        rows={3}
        placeholder={carregado ? 'Escreva aqui enquanto assiste. O vídeo não para e tudo fica salvo só para você.' : 'Carregando…'}
        style={{
          width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px',
          padding: '10px 12px', color: '#F0F0F0', fontSize: '13px', lineHeight: '1.6', resize: 'vertical',
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
