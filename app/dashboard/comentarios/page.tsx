'use client'

import { useEffect, useState, useMemo } from 'react'
import { getAllSchoolComments, replyToComment, deleteComment } from '@/app/actions/comment-actions'

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
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const BADGE_PENDING = {
  fontSize: '10px', fontWeight: '700' as const,
  padding: '2px 7px', borderRadius: '8px',
  backgroundColor: '#3A1F00', color: '#FF8C00',
  border: '1px solid #5A2E00',
}

const BADGE_REPLIED = {
  fontSize: '10px', fontWeight: '700' as const,
  padding: '2px 7px', borderRadius: '8px',
  backgroundColor: '#0D2500', color: '#AEEA00',
  border: '1px solid #2A5000',
}

export default function ComentariosPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'replied'>('all')
  const [filterText, setFilterText] = useState('')
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({})
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function load() {
    const data = await getAllSchoolComments()
    const typed = data as Comment[]
    setComments(typed)
    setExpandedCourses(prev => {
      const next = { ...prev }
      typed.forEach(c => {
        const key = c.course_title || 'Sem curso'
        if (!(key in next)) next[key] = true
      })
      return next
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function toggleCourse(course: string) {
    setExpandedCourses(prev => ({ ...prev, [course]: !prev[course] }))
  }

  const courses = useMemo(
    () => [...new Set(comments.map(c => c.course_title || 'Sem curso'))].sort(),
    [comments]
  )

  const pendingCount = useMemo(() => comments.filter(c => !c.reply_content).length, [comments])

  const filtered = useMemo(() => {
    const q = filterText.toLowerCase()
    return comments.filter(c => {
      const matchCourse = filterCourse === 'all' || (c.course_title || 'Sem curso') === filterCourse
      const matchStatus = filterStatus === 'all'
        ? true
        : filterStatus === 'pending' ? !c.reply_content : !!c.reply_content
      const matchText = !q || c.content.toLowerCase().includes(q) || c.user_name.toLowerCase().includes(q)
      return matchCourse && matchStatus && matchText
    })
  }, [comments, filterCourse, filterStatus, filterText])

  const grouped = useMemo(() => {
    return filtered.reduce((acc, c) => {
      const course = c.course_title || 'Sem curso'
      const lesson = c.lesson_title || 'Aula'
      if (!acc[course]) acc[course] = {}
      if (!acc[course][lesson]) acc[course][lesson] = []
      acc[course][lesson].push(c)
      return acc
    }, {} as Record<string, Record<string, Comment[]>>)
  }, [filtered])

  async function handleDelete(commentId: string) {
    if (!confirm('Tem certeza? O comentário será removido permanentemente.')) return
    setDeletingId(commentId)
    await deleteComment(commentId)
    setDeletingId(null)
    window.dispatchEvent(new CustomEvent('commentsUpdated'))
    await load()
  }

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
      window.dispatchEvent(new CustomEvent('commentsUpdated'))
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

  const isFiltered = filterCourse !== 'all' || filterStatus !== 'all' || filterText !== ''

  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 4px' }}>
          Comentários de Aulas
        </h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>
          {comments.length} comentário{comments.length !== 1 ? 's' : ''}
          {pendingCount > 0 && (
            <span style={{ color: '#FF8C00' }}> · {pendingCount} aguardando resposta</span>
          )}
          {pendingCount === 0 && comments.length > 0 && (
            <span style={{ color: '#AEEA00' }}> · todos respondidos</span>
          )}
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        marginBottom: '24px', padding: '14px 16px',
        backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px',
      }}>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          style={{
            padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #2A2A2A', backgroundColor: '#1A1A1A',
            color: '#F0F0F0', fontSize: '13px', outline: 'none',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <option value="all">Todos os cursos</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'pending', 'replied'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '7px 12px', borderRadius: '8px',
                border: filterStatus === s ? 'none' : '1px solid #2A2A2A',
                fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: filterStatus === s ? '700' : '400',
                backgroundColor: filterStatus === s ? '#AEEA00' : 'transparent',
                color: filterStatus === s ? '#0D0D0D' : '#888888',
              }}
            >
              {s === 'all' ? 'Todos' : s === 'pending' ? '⏳ Aguardando' : '✓ Respondidos'}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Buscar por texto ou nome do aluno..."
          style={{
            flex: 1, minWidth: '180px',
            padding: '7px 12px', borderRadius: '8px',
            border: '1px solid #2A2A2A', backgroundColor: '#1A1A1A',
            color: '#F0F0F0', fontSize: '13px', outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        {isFiltered && (
          <button
            onClick={() => { setFilterCourse('all'); setFilterStatus('all'); setFilterText('') }}
            style={{
              padding: '7px 12px', borderRadius: '8px',
              border: '1px solid #2A2A2A', backgroundColor: 'transparent',
              color: '#555555', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {isFiltered && (
        <p style={{ color: '#555555', fontSize: '12px', marginBottom: '16px' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} com os filtros ativos
        </p>
      )}

      {/* Empty state */}
      {Object.keys(grouped).length === 0 && (
        <div style={{
          backgroundColor: '#111111', border: '1px solid #2A2A2A',
          borderRadius: '16px', padding: '48px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>💬</p>
          <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>
            {comments.length === 0
              ? 'Nenhum comentário ainda. Os alunos poderão comentar nas aulas.'
              : 'Nenhum comentário encontrado com esses filtros.'}
          </p>
        </div>
      )}

      {/* Acordeão por curso */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(grouped).map(([course, lessons]) => {
          const allInCourse = Object.values(lessons).flat()
          const pendingInCourse = allInCourse.filter(c => !c.reply_content).length
          const isOpen = expandedCourses[course] !== false

          return (
            <div key={course} style={{
              backgroundColor: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              {/* Cabeçalho do curso */}
              <button
                onClick={() => toggleCourse(course)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '14px 20px',
                  background: '#161616', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  borderBottom: isOpen ? '1px solid #2A2A2A' : 'none',
                }}
              >
                <span style={{ fontSize: '15px' }}>📚</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#F0F0F0', flex: 1 }}>
                  {course}
                </span>
                <span style={{ fontSize: '12px', color: '#555555', flexShrink: 0 }}>
                  {allInCourse.length} comentário{allInCourse.length !== 1 ? 's' : ''}
                </span>
                {pendingInCourse > 0 && (
                  <span style={{ ...BADGE_PENDING, flexShrink: 0 }}>
                    {pendingInCourse} pendente{pendingInCourse !== 1 ? 's' : ''}
                  </span>
                )}
                <span style={{ color: '#444444', fontSize: '12px', flexShrink: 0, marginLeft: '4px' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Conteúdo do curso */}
              {isOpen && (
                <div style={{ padding: '12px 16px 16px' }}>
                  {Object.entries(lessons).map(([lesson, lessonComments]) => {
                    const pendingInLesson = lessonComments.filter(c => !c.reply_content).length
                    return (
                      <div key={lesson} style={{ marginTop: '12px' }}>
                        {/* Cabeçalho da aula */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          marginBottom: '8px', padding: '7px 12px',
                          backgroundColor: '#1A1A1A', borderRadius: '8px',
                        }}>
                          <span style={{ fontSize: '12px', color: '#AEEA00' }}>▶</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#CCCCCC', flex: 1 }}>
                            {lesson}
                          </span>
                          <span style={{ fontSize: '11px', color: '#555555', flexShrink: 0 }}>
                            {lessonComments.length} comentário{lessonComments.length !== 1 ? 's' : ''}
                          </span>
                          {pendingInLesson > 0 && (
                            <span style={{ fontSize: '10px', color: '#FF8C00', flexShrink: 0 }}>
                              · {pendingInLesson} pendente{pendingInLesson !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Cards de comentários */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {lessonComments.map(c => (
                            <div key={c.id} style={{
                              backgroundColor: '#131313',
                              border: '1px solid #252525',
                              borderRadius: '10px',
                              padding: '14px 16px',
                            }}>
                              {/* Cabeçalho do comentário */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  backgroundColor: '#AEEA00', flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '12px', fontWeight: '700', color: '#0D0D0D',
                                }}>
                                  {c.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#F0F0F0' }}>
                                      {c.user_name}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#444444' }}>
                                      {formatDate(c.created_at)}
                                    </span>
                                    {c.reply_content
                                      ? <span style={BADGE_REPLIED}>✓ Respondido</span>
                                      : <span style={BADGE_PENDING}>⏳ Aguardando resposta</span>
                                    }
                                  </div>
                                </div>
                              </div>

                              {/* Texto do comentário */}
                              <p style={{
                                fontSize: '13px', color: '#CCCCCC',
                                margin: '0 0 12px', lineHeight: '1.6',
                                whiteSpace: 'pre-wrap', paddingLeft: '42px',
                              }}>
                                {c.content}
                              </p>

                              {/* Resposta (se existir) */}
                              {c.reply_content && (
                                <div style={{
                                  marginLeft: '42px', marginBottom: '12px',
                                  backgroundColor: '#0D1500', border: '1px solid #1A3A00',
                                  borderRadius: '8px', padding: '12px 14px',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <span style={{
                                      fontSize: '11px', fontWeight: '700', color: '#AEEA00',
                                      textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                                    }}>
                                      Professor
                                    </span>
                                    {c.reply_at && (
                                      <span style={{ fontSize: '11px', color: '#444444' }}>
                                        · {formatDate(c.reply_at)}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{
                                    fontSize: '13px', color: '#CCCCCC',
                                    margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap',
                                  }}>
                                    {c.reply_content}
                                  </p>
                                </div>
                              )}

                              {/* Área de ação */}
                              {replyingId === c.id ? (
                                <div style={{ marginLeft: '42px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    rows={3}
                                    placeholder="Escreva sua resposta..."
                                    autoFocus
                                    style={{
                                      width: '100%', background: '#0D0D0D',
                                      border: '1px solid #AEEA00', borderRadius: '8px',
                                      padding: '10px 12px', color: '#F0F0F0',
                                      fontSize: '13px', outline: 'none', resize: 'vertical',
                                      fontFamily: 'inherit', boxSizing: 'border-box',
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                      onClick={() => { setReplyingId(null); setReplyText(''); setMsg('') }}
                                      style={{
                                        padding: '7px 16px', borderRadius: '6px',
                                        border: '1px solid #333333', backgroundColor: 'transparent',
                                        color: '#888888', fontSize: '13px',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleReply(c.id)}
                                      disabled={sending || !replyText.trim()}
                                      style={{
                                        padding: '7px 16px', borderRadius: '6px',
                                        border: 'none', backgroundColor: '#AEEA00',
                                        color: '#0D0D0D', fontWeight: '700', fontSize: '13px',
                                        cursor: sending ? 'not-allowed' : 'pointer',
                                        fontFamily: 'inherit', opacity: sending ? 0.7 : 1,
                                      }}
                                    >
                                      {sending ? 'Enviando...' : 'Responder'}
                                    </button>
                                  </div>
                                  {msg && (
                                    <p style={{ color: '#FF5555', fontSize: '12px', margin: 0 }}>{msg}</p>
                                  )}
                                </div>
                              ) : (
                                <div style={{
                                  paddingLeft: '42px',
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                  <button
                                    onClick={() => { setReplyingId(c.id); setReplyText(c.reply_content || ''); setMsg('') }}
                                    style={{
                                      padding: '5px 12px', borderRadius: '6px',
                                      border: '1px solid #2A2A2A', backgroundColor: 'transparent',
                                      color: '#888888', fontSize: '12px',
                                      cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                  >
                                    {c.reply_content ? '✏️ Editar resposta' : '↩ Responder'}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(c.id)}
                                    disabled={deletingId === c.id}
                                    style={{
                                      padding: '5px 12px', borderRadius: '6px',
                                      border: '1px solid #3A1A1A', backgroundColor: 'transparent',
                                      color: '#FF5555', fontSize: '12px',
                                      cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                                      fontFamily: 'inherit',
                                      opacity: deletingId === c.id ? 0.5 : 1,
                                    }}
                                  >
                                    {deletingId === c.id ? 'Excluindo...' : '🗑 Excluir'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
