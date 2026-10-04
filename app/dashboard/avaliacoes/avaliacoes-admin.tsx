'use client'

import { useEffect, useState } from 'react'
import {
  listarCursosParaAvaliacao,
  getResumoAvaliacoesCurso,
  type ResumoCurso,
} from '@/app/actions/lesson-feedback-admin-actions'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function AvaliacoesAdmin() {
  const [cursos, setCursos] = useState<{ id: string; title: string }[]>([])
  const [cursoId, setCursoId] = useState('')
  const [resumo, setResumo] = useState<ResumoCurso | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarCursosParaAvaliacao().then((lista) => {
      setCursos(lista)
      if (lista.length > 0) setCursoId(lista[0].id)
      else setCarregando(false)
    })
  }, [])

  useEffect(() => {
    if (!cursoId) return
    setCarregando(true)
    setErro('')
    getResumoAvaliacoesCurso(cursoId).then((r) => {
      if ('error' in r) { setErro(r.error); setResumo(null) } else setResumo(r)
      setCarregando(false)
    })
  }, [cursoId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ color: '#F0F0F0', fontSize: '24px', fontWeight: 700, margin: 0 }}>Avaliações das Aulas</h1>
        <p style={{ color: '#888888', fontSize: '14px', margin: '4px 0 0' }}>
          Veja como os alunos avaliam cada aula: estrelas de 1 a 5 e a resposta do &quot;Como está a aula até aqui?&quot;.
        </p>
      </div>

      {cursos.length === 0 && !carregando ? (
        <p style={{ color: '#666666', fontSize: '14px' }}>Nenhum curso encontrado.</p>
      ) : (
        <select
          value={cursoId}
          onChange={(e) => setCursoId(e.target.value)}
          style={{ maxWidth: '480px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: '#111111', color: '#F0F0F0', fontSize: '14px', fontFamily: 'inherit' }}
        >
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      )}

      {erro && <p style={{ color: '#FF5555', fontSize: '14px' }}>{erro}</p>}

      {carregando ? (
        <p style={{ color: '#666666', fontSize: '14px' }}>Carregando avaliações...</p>
      ) : resumo && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px' }}>
              <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>Média do curso</p>
              <p style={{ color: '#FFB800', fontSize: '24px', fontWeight: 700, margin: '4px 0 0' }}>{resumo.media != null ? `${fmt(resumo.media)} ★` : '—'}</p>
            </div>
            <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px' }}>
              <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>Avaliações (estrelas)</p>
              <p style={{ color: '#F0F0F0', fontSize: '24px', fontWeight: 700, margin: '4px 0 0' }}>{resumo.totalNotas}</p>
            </div>
            <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px' }}>
              <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>Respostas do pulso</p>
              <p style={{ color: '#F0F0F0', fontSize: '24px', fontWeight: 700, margin: '4px 0 0' }}>{resumo.totalPulsos}</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '8px 16px' }}>
            {resumo.aulas.length === 0 ? (
              <p style={{ color: '#666666', fontSize: '14px', padding: '12px 0', margin: 0 }}>Este curso ainda não tem aulas.</p>
            ) : resumo.aulas.map((a, i) => {
              const totalPulso = a.pulso.otima + a.pulso.boa + a.pulso.confusa
              const pct = (n: number) => (totalPulso ? Math.round((n / totalPulso) * 100) : 0)
              return (
                <div key={a.lessonId} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid #1e1e1e', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    {a.modulo && <p style={{ color: '#555555', fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.modulo}</p>}
                    <p style={{ color: '#F0F0F0', fontSize: '14px', margin: '2px 0 0' }}>{a.titulo}</p>
                  </div>
                  <div style={{ width: '160px', flexShrink: 0 }}>
                    {a.media != null ? (
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: a.media < 4 ? '#FF5555' : '#FFB800' }}>
                        {fmt(a.media)} ★ <span style={{ color: '#666666', fontWeight: 400, fontSize: '12px' }}>({a.totalNotas})</span>
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '12px', color: '#555555' }}>Sem avaliações ainda</p>
                    )}
                  </div>
                  <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                    {totalPulso > 0 ? (
                      <>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#1e1e1e' }}>
                          <div style={{ width: `${pct(a.pulso.otima)}%`, backgroundColor: '#AEEA00' }} />
                          <div style={{ width: `${pct(a.pulso.boa)}%`, backgroundColor: '#888888' }} />
                          <div style={{ width: `${pct(a.pulso.confusa)}%`, backgroundColor: '#FF5555' }} />
                        </div>
                        <p style={{ color: '#666666', fontSize: '11px', margin: '4px 0 0' }}>
                          Ótima {pct(a.pulso.otima)}% · Boa {pct(a.pulso.boa)}% · Confusa {pct(a.pulso.confusa)}% ({totalPulso})
                        </p>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '12px', color: '#555555' }}>Sem respostas do pulso</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
