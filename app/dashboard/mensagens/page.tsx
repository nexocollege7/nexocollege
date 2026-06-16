'use client'

import { useEffect, useState, useRef } from 'react'
import { getMyTeachers, getMyStudents, getMessages, sendMessage, marcarMensagensLidas } from '@/app/actions/chat-actions'
import { getMyAnnouncements } from '@/app/actions/announcement-actions'
import { Send, MessageCircle } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MensagensPage() {
  const [aba, setAba] = useState<'chat' | 'comunicados'>('chat')
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [myId, setMyId] = useState('')
  const [isTeacher, setIsTeacher] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  async function loadConversations(role: string) {
    if (role === 'admin') {
      const data = await getMyStudents()
      setConversations(data)
    } else {
      const data = await getMyTeachers()
      setConversations(data)
    }
  }

  async function loadMessages(sel?: any) {
    const s = sel || selected
    if (!s) return
    const data = await getMessages(s.courseId, s.otherId)
    setMessages(data)
    await marcarMensagensLidas(s.otherId, s.courseId)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      setMyId(d.id || '')
      const role = d.role || 'student'
      setIsTeacher(role === 'admin')
      loadConversations(role)
    })
    getMyAnnouncements().then(setAnnouncements)
  }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages(selected)
    const interval = setInterval(() => loadMessages(selected), 30000)
    return () => clearInterval(interval)
  }, [selected])

  async function handleSend() {
    if (!content.trim() || !selected) return
    setSending(true)
    await sendMessage(selected.otherId, selected.courseId, content)
    setContent('')
    await loadMessages(selected)
    setSending(false)
  }

  function renderConversations() {
    if (conversations.length === 0) return (
      <div className="p-4 text-center">
        <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-xs">Nenhuma conversa ainda</p>
      </div>
    )

    if (isTeacher) {
      return conversations.map((msg: any) => {
        const course = msg.courses
        const student = msg.sender
        const isSelected = selected?.otherId === student?.id && selected?.courseId === course?.id
        return (
          <button
            key={`${course?.id}-${student?.id}`}
            onClick={() => setSelected({
              otherId: student?.id,
              courseId: course?.id,
              otherName: student?.full_name || 'Aluno',
              courseTitle: course?.title,
            })}
            className={`w-full p-4 text-left border-b border-gray-700 hover:bg-gray-700 transition-colors ${isSelected ? 'bg-gray-700' : ''}`}
          >
            <p className="text-white text-sm font-medium truncate">{student?.full_name || 'Aluno'}</p>
            <p className="text-gray-400 text-xs truncate mt-0.5">{course?.title}</p>
          </button>
        )
      })
    } else {
      return conversations.map((enrollment: any) => {
        const course = enrollment.courses
        const teacher = course?.teacher
        if (!teacher) return null
        const isSelected = selected?.otherId === teacher.id && selected?.courseId === course.id
        return (
          <button
            key={`${course.id}-${teacher.id}`}
            onClick={() => setSelected({
              otherId: teacher.id,
              courseId: course.id,
              otherName: teacher.full_name || 'Professor',
              courseTitle: course.title,
            })}
            className={`w-full p-4 text-left border-b border-gray-700 hover:bg-gray-700 transition-colors ${isSelected ? 'bg-gray-700' : ''}`}
          >
            <p className="text-white text-sm font-medium truncate">{teacher.full_name || 'Professor'}</p>
            <p className="text-gray-400 text-xs truncate mt-0.5">{course.title}</p>
          </button>
        )
      })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)' }}>
      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', background: '#111111', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {([
          { id: 'chat', label: '💬 Mensagens' },
          { id: 'comunicados', label: '📣 Comunicados' + (announcements.length > 0 ? ` (${announcements.length})` : '') },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: aba === tab.id ? '700' : '500',
              background: aba === tab.id ? '#AEEA00' : 'transparent',
              color: aba === tab.id ? '#0D0D0D' : '#666666',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

    {aba === 'comunicados' ? (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {announcements.length === 0 ? (
          <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', margin: '0 0 12px' }}>📣</p>
            <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>Nenhum comunicado da escola ainda</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map(a => (
              <div key={a.id} style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
                    {a.title}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#444444', flexShrink: 0 }}>
                    {formatDate(a.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#AAAAAA', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    ) : (
    <div className="flex gap-4" style={{ flex: 1, minHeight: 0 }}>
      <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-64 shrink-0 bg-gray-800 border border-gray-700 rounded-xl overflow-y-auto flex-col`}>
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-sm">Mensagens</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {isTeacher ? 'Mensagens dos alunos' : 'Fale com seus professores'}
          </p>
        </div>
        {renderConversations()}
      </div>

      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-800 border border-gray-700 rounded-xl overflow-hidden`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-700 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="md:hidden text-gray-400 hover:text-white">
                ← 
              </button>
              <div>
                <p className="text-white font-semibold text-sm">{selected.otherName}</p>
                <p className="text-gray-400 text-xs">{selected.courseTitle}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-sm">Nenhuma mensagem ainda. Diga olá!</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = msg.sender_id === myId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(msg.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-gray-700 flex gap-3">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={sending || !content.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    )}
  </div>
  )
}
