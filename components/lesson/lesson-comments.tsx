'use client'

import { useEffect, useState } from 'react'
import { getLessonComments, addLessonComment } from '@/app/actions/comment-actions'

interface Comment {
  id: string
  content: string
  created_at: string
  user_name: string
  reply_content: string | null
  reply_at: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function LessonComments({ lessonId }: { lessonId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!lessonId) return
    getLessonComments(lessonId).then(setComments)
  }, [lessonId])

  async function handleSubmit() {
    if (!text.trim()) return
    setSending(true)
    setMsg('')
    const result = await addLessonComment(lessonId, text)
    if (result?.error) {
      setMsg('Erro: ' + result.error)
    } else {
      setText('')
      const updated = await getLessonComments(lessonId)
      setComments(updated)
    }
    setSending(false)
  }

  return (
    <div style={{ padding: '24px', borderTop: '1px solid #2A2A2A' }}>
      <p style={{ color: '#888888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
        Comentários ({comments.length})
      </p>

      {/* Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Deixe seu comentário sobre esta aula..."
          style={{
            width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: '8px', padding: '10px 14px', color: '#F0F0F0',
            fontSize: '14px', outline: 'none', resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit() }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: '#444444' }}>Ctrl+Enter para enviar</span>
          <button
            onClick={handleSubmit}
            disabled={sending || !text.trim()}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: sending || !text.trim() ? '#1A2E00' : '#AEEA00',
              color: sending || !text.trim() ? '#AEEA00' : '#0D0D0D',
              fontWeight: '700', fontSize: '13px',
              cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {sending ? 'Enviando...' : 'Enviar comentário'}
          </button>
        </div>
        {msg && <p style={{ color: '#FF5555', fontSize: '12px', margin: 0 }}>{msg}</p>}
      </div>

      {/* Lista */}
      {comments.length === 0 ? (
        <p style={{ color: '#444444', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.map(c => (
            <div key={c.id}>
              {/* Comentário do aluno */}
              <div style={{ background: '#1A1A1A', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#AEEA00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#0D0D0D', flexShrink: 0 }}>
                    {c.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#F0F0F0' }}>{c.user_name}</span>
                  <span style={{ fontSize: '11px', color: '#555555', marginLeft: 'auto' }}>{formatDate(c.created_at)}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#CCCCCC', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {c.content}
                </p>
              </div>

              {/* Resposta do professor (se houver) */}
              {c.reply_content && (
                <div style={{
                  marginLeft: '20px',
                  marginTop: '4px',
                  backgroundColor: '#0D1500',
                  border: '1px solid #1A3A00',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#1A3A00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px' }}>👨‍🏫</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#AEEA00' }}>Professor</span>
                    {c.reply_at && (
                      <span style={{ fontSize: '11px', color: '#444444', marginLeft: 'auto' }}>{formatDate(c.reply_at)}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#CCCCCC', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {c.reply_content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
