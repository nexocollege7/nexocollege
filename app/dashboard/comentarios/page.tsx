'use client'

import { useEffect, useState } from 'react'
import { getAllSchoolComments, replyToComment } from '@/app/actions/comment-actions'

type Comment = {
  id: string
  content: string
  created_at: string
  user_name: string
  lesson_title: string
  course_title: string
  reply_content: string | null
  reply_at: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ComentariosPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const data = await getAllSchoolComments()
    setComments(data as Comment[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleReply(commentId: string) {
    if (!replyText.trim()) return
    setSending(true)
    setMsg('')
    const result = await replyToComment(commentId, replyText)
    if (result?.error) {
      setMsg('Erro: ' + result.error)
    } else {
      setReplyingId(null)
      setReplyText('')
      await load()
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#555555' }}>Carregando comentários...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Comentários de Aulas
        </h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          {comments.length} comentário{comments.length !== 1 ? 's' : ''} · Responda diretamente abaixo de cada um
        </p>
      </div>

      {comments.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>💬</p>
          <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>
            Nenhum comentário ainda. Os alunos poderão comentar nas aulas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map(c => (
            <div key={c.id} style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '16px 20px' }}>
              {/* Cabeçalho */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#AEEA00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#0D0D0D', flexShrink: 0 }}>
                    {c.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: 0 }}>{c.user_name}</p>
                    <p style={{ color: '#555555', fontSize: '12px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.course_title && <><span style={{ color: '#666666' }}>{c.course_title}</span><span style={{ color: '#333333' }}> · </span></>}
                      <span style={{ color: '#888888' }}>{c.lesson_title}</span>
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#444444', flexShrink: 0 }}>{formatDate(c.created_at)}</span>
              </div>

              {/* Conteúdo do comentário */}
              <p style={{ fontSize: '13px', color: '#CCCCCC', margin: '0 0 12px', lineHeight: '1.6', whiteSpace: 'pre-wrap', paddingLeft: '42px' }}>
                {c.content}
              </p>

              {/* Resposta existente */}
              {c.reply_content && (
                <div style={{ marginLeft: '42px', marginBottom: '12px', backgroundColor: '#0D0D0D', border: '1px solid #1A3A00', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#AEEA00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professor</span>
                    {c.reply_at && (
                      <span style={{ fontSize: '11px', color: '#444444' }}>· {formatDate(c.reply_at)}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#CCCCCC', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {c.reply_content}
                  </p>
                </div>
              )}

              {/* Área de resposta */}
              {replyingId === c.id ? (
                <div style={{ marginLeft: '42px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Escreva sua resposta..."
                    autoFocus
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #AEEA00', borderRadius: '8px', padding: '10px 12px', color: '#F0F0F0', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setReplyingId(null); setReplyText(''); setMsg('') }}
                      style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #333333', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleReply(c.id)}
                      disabled={sending || !replyText.trim()}
                      style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#AEEA00', color: '#0D0D0D', fontWeight: '700', fontSize: '13px', cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: sending ? 0.7 : 1 }}
                    >
                      {sending ? 'Enviando...' : 'Responder'}
                    </button>
                  </div>
                  {msg && <p style={{ color: '#FF5555', fontSize: '12px', margin: 0 }}>{msg}</p>}
                </div>
              ) : (
                <div style={{ paddingLeft: '42px' }}>
                  <button
                    onClick={() => { setReplyingId(c.id); setReplyText(c.reply_content || ''); setMsg('') }}
                    style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #2A2A2A', backgroundColor: 'transparent', color: '#888888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {c.reply_content ? '✏️ Editar resposta' : '↩ Responder'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
