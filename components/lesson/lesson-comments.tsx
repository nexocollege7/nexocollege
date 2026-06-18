'use client'

import { useEffect, useState } from 'react'
import { getLessonComments, addLessonComment, toggleCommentLike } from '@/app/actions/comment-actions'

interface Comment {
  id: string
  content: string
  created_at: string
  user_name: string
  avatar_url: string | null
  reply_content: string | null
  reply_at: string | null
  likeCount: number
  likedByMe: boolean
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d}d`
  const sem = Math.floor(d / 7)
  if (sem < 4) return `há ${sem}sem`
  const mes = Math.floor(d / 30)
  if (mes < 12) return mes === 1 ? 'há 1 mês' : `há ${mes} meses`
  const ano = Math.floor(d / 365)
  return ano === 1 ? 'há 1 ano' : `há ${ano} anos`
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (parts[0]?.[0] || '?').toUpperCase()
}

export function LessonComments({ lessonId }: { lessonId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  async function fetchComments() {
    const data = await getLessonComments(lessonId)
    setComments(data as Comment[])
  }

  useEffect(() => {
    if (!lessonId) return
    fetchComments()
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
      await fetchComments()
    }
    setSending(false)
  }

  async function handleToggleLike(commentId: string) {
    const result = await toggleCommentLike(commentId)
    if ('liked' in result) {
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, likedByMe: result.liked, likeCount: result.count } : c))
    }
  }

  function toggleReplyExpanded(commentId: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) next.delete(commentId)
      else next.add(commentId)
      return next
    })
  }

  return (
    <div style={{ padding: '24px', borderTop: '1px solid #2A2A2A' }}>
      {/* Campo de novo comentário — fixo no topo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <p style={{ color: '#888888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
          Comentários ({comments.length})
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Deixe seu comentário sobre esta aula..."
          style={{
            width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: '8px', padding: '10px 14px', color: '#F0F0F0',
            fontSize: '14px', outline: 'none', resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit() }}
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
          {comments.map((c) => {
            const replyExpanded = expandedReplies.has(c.id)
            return (
              <div key={c.id}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                    backgroundColor: '#AEEA00', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700', color: '#0D0D0D',
                  }}>
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : getInitials(c.user_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ background: '#1A1A1A', borderRadius: '10px', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#F0F0F0' }}>{c.user_name}</span>
                        <span style={{ fontSize: '11px', color: '#555555' }} title={new Date(c.created_at).toLocaleString('pt-BR')}>
                          {formatRelative(c.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#CCCCCC', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {c.content}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', paddingLeft: '4px' }}>
                      <button
                        onClick={() => handleToggleLike(c.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none',
                          color: c.likedByMe ? '#FF4444' : '#666666', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                        }}
                      >
                        {c.likedByMe ? '❤️' : '🤍'} {c.likeCount > 0 ? c.likeCount : ''}
                      </button>

                      {c.reply_content && (
                        <button
                          onClick={() => toggleReplyExpanded(c.id)}
                          style={{ background: 'none', border: 'none', color: '#AEEA00', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                        >
                          {replyExpanded ? 'Ocultar resposta ▴' : 'Ver resposta do professor ▾'}
                        </button>
                      )}
                    </div>

                    {c.reply_content && replyExpanded && (
                      <div style={{
                        marginTop: '8px',
                        backgroundColor: '#0D1500', border: '1px solid #1A3A00',
                        borderRadius: '10px', padding: '12px 16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#1A3A00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '10px' }}>👨‍🏫</span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#AEEA00' }}>Professor</span>
                          {c.reply_at && (
                            <span style={{ fontSize: '11px', color: '#444444', marginLeft: 'auto' }}>{formatRelative(c.reply_at)}</span>
                          )}
                        </div>
                        <p style={{ fontSize: '13px', color: '#CCCCCC', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {c.reply_content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
