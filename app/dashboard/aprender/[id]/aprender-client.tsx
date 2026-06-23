'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getAulasDoAluno, marcarAulaConcluida } from '@/app/actions/aula-actions'
import { getLessonInteractions, toggleLessonLike, toggleLessonFavorite } from '@/app/actions/lesson-interactions-actions'
import { getStudentReview, submitCourseReview } from '@/app/actions/review-actions'
import { LessonComments } from '@/components/lesson/lesson-comments'
import { getEmbedUrl } from '@/lib/video-embed'

type Aula = {
  id: string
  title: string
  video_url: string | null
  position: number
  is_free: boolean
  type: string | null
  completed: boolean
  material_links?: string | null
}

export function AprenderClient({ planoEscola }: { planoEscola: string }) {
  const params = useParams()
  const id = params.id as string
  const searchParams = useSearchParams()

  const [modulos, setModulos] = useState<any[]>([])
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null)
  const [loading, setLoading] = useState(true)
  const [interacoes, setInteracoes] = useState({ likeCount: 0, liked: false, favorited: false })
  const [reviewExistente, setReviewExistente] = useState<{ content: string } | null>(null)
  const [reviewCarregado, setReviewCarregado] = useState(false)
  const [reviewTexto, setReviewTexto] = useState('')
  const [reviewEnviando, setReviewEnviando] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')

  useEffect(() => {
    async function load() {
      const data = await getAulasDoAluno(id)
      setModulos(data)
      const aulaParam = searchParams.get('aula')
      const todas = data.flatMap((m: any) => m.lessons || [])
      const aulaEscolhida = (aulaParam && todas.find((l: any) => l.id === aulaParam)) || data?.[0]?.lessons?.[0]
      if (aulaEscolhida) setAulaAtual(aulaEscolhida)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    getStudentReview(id).then((r) => {
      setReviewExistente(r ? { content: r.content } : null)
      setReviewCarregado(true)
    })
  }, [id])

  useEffect(() => {
    if (!aulaAtual) return
    getLessonInteractions(aulaAtual.id).then(setInteracoes)
  }, [aulaAtual?.id])

  async function handleToggleLike() {
    if (!aulaAtual) return
    const result = await toggleLessonLike(aulaAtual.id)
    if ('liked' in result) setInteracoes((prev) => ({ ...prev, liked: result.liked, likeCount: result.count }))
  }

  async function handleToggleFavorite() {
    if (!aulaAtual) return
    const result = await toggleLessonFavorite(aulaAtual.id)
    if ('favorited' in result) setInteracoes((prev) => ({ ...prev, favorited: result.favorited }))
  }

  // Monta lista plana de todas as aulas em ordem
  function getTodasAulas() {
    return modulos.flatMap((m) =>
      [...(m.lessons || [])].sort((a: any, b: any) => a.position - b.position)
    )
  }

  // Uma aula está liberada se for a primeira OU se a anterior estiver concluída
  function aulaLiberada(aula: any): boolean {
    const todas = getTodasAulas()
    const index = todas.findIndex((l) => l.id === aula.id)
    if (index === 0) return true
    return todas[index - 1]?.completed === true
  }

  async function handleSelecionarAula(aula: any) {
    if (!aulaLiberada(aula)) return
    setAulaAtual(aula)
  }

  async function handleConcluirAula() {
    if (!aulaAtual) return
    await marcarAulaConcluida(aulaAtual.id, id)
    setModulos((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons.map((l: any) =>
          l.id === aulaAtual.id ? { ...l, completed: true } : l
        ),
      }))
    )
    setAulaAtual({ ...aulaAtual, completed: true })
  }

  async function handleEnviarReview() {
    if (!reviewTexto.trim()) return
    setReviewEnviando(true)
    setReviewMsg('')
    const result = await submitCourseReview(id, reviewTexto)
    if (result?.error) {
      setReviewMsg(result.error)
    } else {
      setReviewExistente({ content: reviewTexto.trim() })
      setReviewTexto('')
    }
    setReviewEnviando(false)
  }

  const totalAulas = modulos.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)
  const aulasConcluidas = modulos.reduce(
    (acc, m) => acc + (m.lessons?.filter((l: any) => l.completed).length || 0), 0
  )
  const progresso = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <p style={{ color: '#888888' }}>Carregando aulas...</p>
    </div>
  )

  return (
    <div className="player-root" style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <style>{`
        @media (max-width: 768px) {
          .player-root { flex-direction: column !important; height: auto !important; overflow: visible !important; }
          .player-sidebar { width: 100% !important; max-height: 40vh; border-left: none !important; border-top: 1px solid #2A2A2A !important; }
          .player-info { padding: 12px 16px !important; }
          .player-info h1 { font-size: 15px !important; }
          .player-progress { padding: 8px 16px !important; }
        }
      `}</style>

      {/* Player principal — coluna inteira rola */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingBottom: '120px' }}>

        {/* Vídeo — flexShrink:0 para nunca encolher */}
        <div style={{ flexShrink: 0, padding: '16px 16px 0' }}>
        <div style={{ backgroundColor: '#000000', aspectRatio: '16/9', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
          {aulaAtual?.video_url ? (
            <iframe
              src={getEmbedUrl(aulaAtual.video_url)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px',
            }}>
              <span style={{ fontSize: '48px' }}>▶</span>
              <p style={{ color: '#555555', fontSize: '14px' }}>
                {totalAulas === 0 ? 'Nenhuma aula disponível ainda' : 'Selecione uma aula para começar'}
              </p>
            </div>
          )}
        </div>
        </div>

        {/* Info da aula */}
        {aulaAtual && (
          <div className="player-info" style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid #2A2A2A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#F0F0F0', margin: 0 }}>
                {aulaAtual.title}
              </h1>
              <button
                onClick={handleConcluirAula}
                disabled={aulaAtual.completed}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  backgroundColor: aulaAtual.completed ? '#1A2E00' : '#AEEA00',
                  color: aulaAtual.completed ? '#AEEA00' : '#0D0D0D',
                  fontWeight: '700', fontSize: '13px',
                  cursor: aulaAtual.completed ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {aulaAtual.completed ? '✓ Concluída' : 'Marcar como concluída'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={handleToggleLike}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '20px', border: '1px solid #2A2A2A',
                  backgroundColor: interacoes.liked ? 'rgba(255,68,68,0.1)' : 'transparent',
                  color: interacoes.liked ? '#FF4444' : '#888888',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {interacoes.liked ? '❤️' : '🤍'} {interacoes.likeCount}
              </button>
              <button
                onClick={handleToggleFavorite}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '20px', border: '1px solid #2A2A2A',
                  backgroundColor: interacoes.favorited ? 'rgba(174,234,0,0.1)' : 'transparent',
                  color: interacoes.favorited ? '#AEEA00' : '#888888',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {interacoes.favorited ? '⭐ Favoritado' : '☆ Favoritar'}
              </button>
            </div>
          </div>
        )}

        {/* Depoimento opcional — aparece após concluir a aula */}
        {aulaAtual?.completed && reviewCarregado && (
          <div style={{ flexShrink: 0, padding: '16px 24px', borderBottom: '1px solid #2A2A2A' }}>
            {reviewExistente ? (
              <div>
                <p style={{ color: '#888888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                  Seu depoimento sobre este curso
                </p>
                <p style={{ color: '#F0F0F0', fontSize: '13px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {reviewExistente.content}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ color: '#888888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                  Deixe seu depoimento sobre esta aula
                </p>
                <textarea
                  value={reviewTexto}
                  onChange={(e) => setReviewTexto(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Conte o que achou do curso até aqui... (opcional)"
                  style={{
                    width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
                    borderRadius: '8px', padding: '10px 14px', color: '#F0F0F0',
                    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  {reviewMsg ? (
                    <p style={{ fontSize: '12px', color: '#FF5555', margin: 0 }}>{reviewMsg}</p>
                  ) : <span />}
                  <button
                    onClick={handleEnviarReview}
                    disabled={reviewEnviando || !reviewTexto.trim()}
                    style={{
                      padding: '8px 20px', borderRadius: '8px', border: 'none',
                      backgroundColor: reviewEnviando || !reviewTexto.trim() ? '#1A2E00' : '#AEEA00',
                      color: reviewEnviando || !reviewTexto.trim() ? '#AEEA00' : '#0D0D0D',
                      fontWeight: '700', fontSize: '13px',
                      cursor: reviewEnviando || !reviewTexto.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {reviewEnviando ? 'Enviando...' : 'Enviar depoimento'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Barra de progresso */}
        <div className="player-progress" style={{ flexShrink: 0, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '6px', backgroundColor: '#2A2A2A', borderRadius: '3px' }}>
            <div style={{
              height: '6px', backgroundColor: '#AEEA00', borderRadius: '3px',
              width: `${progresso}%`, transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '12px', color: '#888888', whiteSpace: 'nowrap' }}>
            {aulasConcluidas}/{totalAulas} aulas — {progresso}%
          </span>
        </div>

        {/* Curso concluído */}
        {progresso === 100 && (
          <div style={{
            flexShrink: 0,
            margin: '0 24px 16px',
            padding: '16px 20px',
            backgroundColor: '#1A2E00',
            border: '1px solid #AEEA00',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '28px' }}>🎉</span>
            <div>
              <p style={{ color: '#AEEA00', fontWeight: '700', fontSize: '15px', margin: 0 }}>
                Curso concluído!
              </p>
              <p style={{ color: '#888888', fontSize: '13px', margin: '2px 0 0' }}>
                Parabéns! Acesse a aba Certificados para baixar seu certificado.
              </p>
            </div>
          </div>
        )}

        {/* Materiais da aula */}
        {aulaAtual && aulaAtual.material_links && (
          <div style={{ flexShrink: 0, padding: '16px 24px', borderBottom: '1px solid #2A2A2A' }}>
            <p style={{ color: '#888888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Materiais desta aula</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aulaAtual.material_links.split('\n').filter((l: string) => l.trim()).map((link: string, i: number) => (
                <a key={i} href={link.trim()} target="_blank" rel="noreferrer" style={{ color: '#AEEA00', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📎</span> {link.trim()}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comentários — flexShrink:0 garante tamanho real do conteúdo, sem disputa de espaço no flex */}
        {aulaAtual && (
          <div style={{ flexShrink: 0 }}>
            {planoEscola === 'starter' ? (
              <div style={{
                padding: '16px', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
                borderRadius: '12px', color: '#888888', fontSize: '13px', textAlign: 'center',
              }}>
                💬 Comentários disponíveis a partir do plano Creator
              </div>
            ) : (
              <LessonComments lessonId={aulaAtual.id} />
            )}
          </div>
        )}
      </div>

        {/* Lista de módulos e aulas */}
      <div className="player-sidebar" style={{
        width: '320px', flexShrink: 0,
        borderLeft: '1px solid #2A2A2A',
        backgroundColor: '#111111',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: 0 }}>
            Conteúdo do curso
          </p>
          <p style={{ color: '#888888', fontSize: '12px', margin: '2px 0 0' }}>
            {totalAulas} aula{totalAulas !== 1 ? 's' : ''}
          </p>
        </div>

        {modulos.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: '#555555', fontSize: '13px' }}>Nenhum módulo ainda</p>
          </div>
        ) : (
          modulos.map((modulo, mIndex) => (
            <div key={modulo.id}>
              <div style={{
                padding: '12px 20px',
                backgroundColor: '#1A1A1A',
                borderBottom: '1px solid #2A2A2A',
              }}>
                <p style={{ color: '#888888', fontSize: '11px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Módulo {mIndex + 1}
                </p>
                <p style={{ color: '#F0F0F0', fontSize: '13px', fontWeight: '600', margin: '2px 0 0' }}>
                  {modulo.title}
                </p>
              </div>

              {(modulo.lessons || [])
                .sort((a: any, b: any) => a.position - b.position)
                .map((aula: any, aIndex: number) => {
                  const isAtiva = aulaAtual?.id === aula.id
                  const liberada = aulaLiberada(aula)
                  return (
                    <button
                      key={aula.id}
                      onClick={() => handleSelecionarAula(aula)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '12px 20px',
                        backgroundColor: isAtiva ? '#1A2E00' : 'transparent',
                        borderBottom: '1px solid #1A1A1A',
                        border: 'none',
                        borderLeft: isAtiva ? '3px solid #AEEA00' : '3px solid transparent',
                        cursor: liberada ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontFamily: 'inherit',
                        opacity: liberada ? 1 : 0.4,
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        color: aula.completed ? '#AEEA00' : liberada ? '#888888' : '#555555',
                      }}>
                        {aula.completed ? '✓' : liberada ? '▶' : '🔒'}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        color: isAtiva ? '#AEEA00' : aula.completed ? '#888888' : liberada ? '#F0F0F0' : '#555555',
                        lineHeight: '1.4',
                      }}>
                        {aIndex + 1}. {aula.title}
                      </span>
                    </button>
                  )
                })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
