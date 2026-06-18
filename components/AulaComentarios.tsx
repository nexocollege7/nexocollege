'use client'

import { useEffect, useState } from 'react'
import { getComentariosAula, criarComentarioAula } from '@/app/actions/mentor-actions'

type Comentario = {
  id: string
  content: string
  created_at: string
  student_id: string
  student_name: string
}

export function AulaComentarios({ classId, podeComentar, expandidoPorPadrao = true }: {
  classId: string
  podeComentar: boolean
  expandidoPorPadrao?: boolean
}) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [carregado, setCarregado] = useState(false)
  const [expandido, setExpandido] = useState(expandidoPorPadrao)
  const [novoComentario, setNovoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!expandido || carregado) return
    getComentariosAula(classId).then((data) => {
      setComentarios(data as Comentario[])
      setCarregado(true)
    })
  }, [expandido, carregado, classId])

  async function handleEnviar() {
    if (!novoComentario.trim()) return
    setEnviando(true)
    setErro('')
    const result = await criarComentarioAula(classId, novoComentario.trim())
    setEnviando(false)
    if (result.error) {
      setErro(result.error)
      return
    }
    if (result.data) {
      setComentarios([...comentarios, result.data as Comentario])
      setNovoComentario('')
    }
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => setExpandido(!expandido)}
        style={{
          background: 'none', border: 'none', color: '#7C4DFF', fontSize: '12px',
          cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: '600',
        }}
      >
        {expandido ? '▾' : '▸'} Comentários{carregado ? ` (${comentarios.length})` : ''}
      </button>

      {expandido && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!carregado ? (
            <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>Carregando comentários...</p>
          ) : comentarios.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>Nenhum comentário ainda.</p>
          ) : (
            comentarios.map((c) => (
              <div key={c.id} style={{ padding: '8px 12px', backgroundColor: '#1A1A1A', borderRadius: '8px', border: '1px solid #2A2A2A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: '#CCCCCC', fontSize: '12px', fontWeight: '700' }}>{c.student_name}</span>
                  <span style={{ color: '#555555', fontSize: '11px' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p style={{ color: '#AAAAAA', fontSize: '13px', margin: '4px 0 0', lineHeight: '1.4' }}>{c.content}</p>
              </div>
            ))
          )}

          {podeComentar && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                placeholder="Escreva um comentário sobre este encontro..."
                maxLength={1000}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D', color: '#F0F0F0',
                  fontSize: '13px', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleEnviar}
                disabled={enviando || !novoComentario.trim()}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#7C4DFF', color: '#fff', fontWeight: '700', fontSize: '12px',
                  cursor: enviando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  opacity: enviando || !novoComentario.trim() ? 0.6 : 1, whiteSpace: 'nowrap',
                }}
              >
                {enviando ? '...' : 'Comentar'}
              </button>
            </div>
          )}
          {erro && <p style={{ color: '#FF5555', fontSize: '12px', margin: 0 }}>{erro}</p>}
        </div>
      )}
    </div>
  )
}
