'use client'

import { useEffect, useState, useRef } from 'react'
import { getMyTeachers, getMessages, sendMessage } from '@/app/actions/chat-actions'
import { Send, MessageCircle } from 'lucide-react'

export default function MensagensPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [myId, setMyId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  async function loadTeachers() {
    const data = await getMyTeachers()
    setTeachers(data)
  }

  async function loadMessages() {
    if (!selected) return
    const data = await getMessages(selected.courseId, selected.teacherId)
    setMessages(data)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadTeachers()
    // Pegar ID do usuário atual via cookie
    fetch('/api/me').then(r => r.json()).then(d => setMyId(d.id || ''))
  }, [])

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 30000)
    return () => clearInterval(interval)
  }, [selected])

  async function handleSend() {
    if (!content.trim() || !selected) return
    setSending(true)
    await sendMessage(selected.teacherId, selected.courseId, content)
    setContent('')
    await loadMessages()
    setSending(false)
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Lista de conversas */}
      <div className="w-64 shrink-0 bg-gray-800 border border-gray-700 rounded-xl overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-sm">Mensagens</h2>
        </div>
        {teachers.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">Nenhuma conversa ainda</p>
          </div>
        ) : (
          teachers.map((enrollment: any) => {
            const course = enrollment.courses
            const teacher = course?.teacher
            if (!teacher) return null
            const isSelected = selected?.teacherId === teacher.id && selected?.courseId === course.id
            return (
              <button
                key={`${course.id}-${teacher.id}`}
                onClick={() => setSelected({ teacherId: teacher.id, courseId: course.id, teacherName: teacher.full_name, courseTitle: course.title })}
                className={`w-full p-4 text-left border-b border-gray-700 hover:bg-gray-700 transition-colors ${isSelected ? 'bg-gray-700' : ''}`}
              >
                <p className="text-white text-sm font-medium truncate">{teacher.full_name || 'Professor'}</p>
                <p className="text-gray-400 text-xs truncate mt-0.5">{course.title}</p>
              </button>
            )
          })
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <p className="text-white font-semibold text-sm">{selected.teacherName || 'Professor'}</p>
              <p className="text-gray-400 text-xs">{selected.courseTitle}</p>
            </div>

            {/* Mensagens */}
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

            {/* Input */}
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
  )
}
