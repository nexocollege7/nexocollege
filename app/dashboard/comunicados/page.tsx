'use client'

import { useEffect, useState } from 'react'
import {
  createAnnouncement,
  getSchoolAnnouncements,
  getMyAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/app/actions/announcement-actions'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  updated_at?: string | null
  author?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ComunicadosPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  // edição inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load(admin: boolean) {
    const data = admin ? await getSchoolAnnouncements() : await getMyAnnouncements()
    setAnnouncements(data as Announcement[])
  }

  useEffect(() => {
    async function init() {
      const me = await fetch('/api/me').then(r => r.json())
      const admin = ['admin', 'collaborator'].includes(me.role)
      setIsAdmin(admin)
      await load(admin)
      setLoading(false)
    }
    init()
  }, [])

  async function handleSend() {
    if (!title.trim() || !content.trim()) return
    setSending(true)
    setMsg('')
    const result = await createAnnouncement(title, content)
    if (result?.error) {
      setMsg('Erro: ' + result.error)
    } else {
      setTitle('')
      setContent('')
      await load(true)
      setMsg('✅ Comunicado enviado para todos os alunos!')
      setTimeout(() => setMsg(''), 4000)
    }
    setSending(false)
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id)
    setEditTitle(a.title)
    setEditContent(a.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return
    setEditSaving(true)
    const result = await updateAnnouncement(id, editTitle, editContent)
    if (!result?.error) {
      await load(true)
      cancelEdit()
    }
    setEditSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza? O comunicado será removido para todos os alunos.')) return
    setDeletingId(id)
    await deleteAnnouncement(id)
    await load(true)
    setDeletingId(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: '8px', padding: '10px 14px', color: '#F0F0F0',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <p style={{ color: '#888888' }}>Carregando comunicados...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Comunicados
        </h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          {isAdmin ? 'Envie mensagens para todos os alunos da sua escola' : 'Avisos e novidades da sua escola'}
        </p>
      </div>

      {/* Formulário de novo comunicado — apenas admin/colaborador */}
      {isAdmin && (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#F0F0F0', margin: '0 0 20px' }}>
            Novo comunicado
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                Título
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Ex: Atualização dos horários de aula" />
            </div>
            <div>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                Mensagem
              </label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Escreva o comunicado aqui..." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {msg ? (
                <p style={{ fontSize: '13px', color: msg.startsWith('Erro') ? '#FF5555' : '#AEEA00', margin: 0 }}>{msg}</p>
              ) : <span />}
              <button
                onClick={handleSend}
                disabled={sending || !title.trim() || !content.trim()}
                style={{
                  padding: '10px 28px', borderRadius: '8px', border: 'none',
                  backgroundColor: sending || !title.trim() || !content.trim() ? '#1A2E00' : '#AEEA00',
                  color: sending || !title.trim() || !content.trim() ? '#AEEA00' : '#0D0D0D',
                  fontWeight: '700', fontSize: '14px',
                  cursor: sending || !title.trim() || !content.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {sending ? 'Enviando...' : 'Enviar para todos os alunos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de comunicados */}
      <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#888888', margin: '0 0 16px' }}>
        {isAdmin ? `Comunicados enviados (${announcements.length})` : `Comunicados (${announcements.length})`}
      </h2>

      {announcements.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '28px', margin: '0 0 8px' }}>📣</p>
          <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>Nenhum comunicado ainda</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {announcements.map(a => (
            <div key={a.id} style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '16px 20px' }}>
              {isAdmin && editingId === a.id ? (
                /* Modo de edição inline */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{ ...inputStyle, background: '#0D0D0D', fontSize: '14px', fontWeight: '700' }}
                    placeholder="Título"
                  />
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={5}
                    style={{ ...inputStyle, background: '#0D0D0D', resize: 'vertical' }}
                    placeholder="Conteúdo"
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={cancelEdit}
                      style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #333333', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(a.id)}
                      disabled={editSaving || !editTitle.trim() || !editContent.trim()}
                      style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#AEEA00', color: '#0D0D0D', fontSize: '13px', fontWeight: '700', cursor: editSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: editSaving ? 0.7 : 1 }}
                    >
                      {editSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo de visualização */
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>{a.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: '#444444' }}>{formatDate(a.created_at)}</span>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => startEdit(a)}
                            style={{ padding: '3px 10px', borderRadius: '5px', border: '1px solid #333333', backgroundColor: 'transparent', color: '#888888', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deletingId === a.id}
                            style={{ padding: '3px 10px', borderRadius: '5px', border: '1px solid rgba(255,85,85,0.3)', backgroundColor: 'transparent', color: '#FF5555', fontSize: '11px', cursor: deletingId === a.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deletingId === a.id ? 0.6 : 1 }}
                          >
                            {deletingId === a.id ? '...' : 'Excluir'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 8px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{a.content}</p>
                  {a.author && (
                    <p style={{ fontSize: '11px', color: '#444444', margin: 0 }}>
                      por {a.author}
                      {a.updated_at && <span style={{ marginLeft: '8px', color: '#333333' }}>· editado em {formatDate(a.updated_at)}</span>}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
