'use client'

import { useEffect, useState, useRef } from 'react'
import { getLiveStatus } from '@/app/actions/vitrine-actions'
import { generateViewerToken, sendLiveComment } from '@/app/actions/school-actions'
import { getEmbedUrl } from '@/lib/video-embed'
import { createClient } from '@/lib/supabase/client'
import BannerRotativo, { type Slide } from './banner-rotativo'

type Course = Extract<Slide, { tipo: 'curso' }>
type Mentoria = Omit<Extract<Slide, { tipo: 'mentoria' }>, 'tipo'>

type Comment = { id: string; user_name: string; message: string; created_at: string }

type Props = {
  schoolId: string
  liveUrlInitial: string | null
  liveActiveInitial: boolean
  courses: Omit<Course, 'tipo'>[]
  mentorias: Mentoria[]
  slug: string
  cor: string
  basePath: string
}

export function LiveBanner({ schoolId, liveUrlInitial, liveActiveInitial, courses, mentorias, slug, cor, basePath }: Props) {
  const supabase = createClient()
  const [liveActive, setLiveActive] = useState(liveActiveInitial)
  const [liveUrl, setLiveUrl] = useState(liveUrlInitial)
  const [liveType, setLiveType] = useState<'youtube' | 'native'>('youtube')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dailyRoomUrl, setDailyRoomUrl] = useState<string | null>(null)
  const [dailyRoomName, setDailyRoomName] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentMsg, setCommentMsg] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [userName, setUserName] = useState('Aluno')
  const dailyContainerRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserName(user.email.split('@')[0])
    })
  }, [])

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await getLiveStatus(schoolId)
      setLiveActive(status.liveActive)
      setLiveUrl(status.liveUrl)
      setLiveType(status.liveType)
      setSessionId(status.sessionId)
      setDailyRoomUrl(status.dailyRoomUrl)
      setDailyRoomName(status.dailyRoomName ?? null)
    }, 30000)
    return () => clearInterval(interval)
  }, [schoolId])

  useEffect(() => {
    if (liveType === 'native' && dailyRoomUrl && dailyRoomName && dailyContainerRef.current) {
      initDailyViewer(dailyRoomUrl, dailyRoomName)
    }
  }, [liveType, dailyRoomUrl, dailyRoomName])

  useEffect(() => {
    if (liveType === 'native' && sessionId) {
      const channel = supabase
        .channel('live-comments-vitrine-' + sessionId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'live_comments',
          filter: 'live_session_id=eq.' + sessionId,
        }, (payload) => {
          setComments((prev) => [...prev, payload.new as Comment])
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [liveType, sessionId])

  async function initDailyViewer(roomUrl: string, roomName: string) {
    if (!dailyContainerRef.current) return
    const DailyIframe = (await import('@daily-co/daily-js')).default
    const existing = (window as any).__dailyViewerObject
    if (existing) { existing.destroy(); (window as any).__dailyViewerObject = null }
    const token = await generateViewerToken(roomName, userName)
    const callObject = DailyIframe.createFrame(dailyContainerRef.current, {
      url: roomUrl,
      token,
      showLeaveButton: false,
      showFullscreenButton: false,
      showLocalVideo: false,
      showParticipantsBar: false,
      iframeStyle: { width: '100%', height: '100%', border: 'none', borderRadius: '0', minHeight: '480px' },
    })
    const iframe = dailyContainerRef.current.querySelector('iframe')
    if (iframe) {
      iframe.setAttribute('allow', 'autoplay; picture-in-picture')
    }
    await callObject.join({ startVideoOff: true, startAudioOff: true })
    ;(window as any).__dailyViewerObject = callObject
  }

  async function handleSendComment() {
    if (!sessionId || !commentMsg.trim()) return
    setSendingComment(true)
    await sendLiveComment({ sessionId, message: commentMsg, userName })
    setCommentMsg('')
    setSendingComment(false)
  }

  // Live nativa
  if (liveActive && liveType === 'native') {
    return (
      <div style={{ position: 'relative', backgroundColor: '#000' }}>
        <style>{`
          @keyframes live-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .live-badge-dot { animation: live-pulse 1.4s ease-in-out infinite; }
        `}</style>

        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', top: '16px', left: '24px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '20px',
            backgroundColor: 'rgba(255,68,68,0.9)',
          }}>
            <span className="live-badge-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px', letterSpacing: '0.04em' }}>🔴 AO VIVO</span>
          </div>
          <div ref={dailyContainerRef} style={{ width: '100%', minHeight: '480px', backgroundColor: '#000' }} />
        </div>

        {/* Chat */}
        <div style={{ background: '#111', borderTop: '1px solid #1e1e1e', padding: '24px 48px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>💬 Comentários ao vivo</h3>
          <div style={{ height: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {comments.length === 0 && (
              <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', marginTop: '70px' }}>Nenhum comentário ainda...</p>
            )}
            {comments.map((c) => (
              <div key={c.id} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '10px 14px' }}>
                <span style={{ color: cor, fontSize: '12px', fontWeight: '700' }}>{c.user_name}</span>
                <p style={{ color: '#ddd', fontSize: '13px', margin: '4px 0 0' }}>{c.message}</p>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={commentMsg}
              onChange={e => setCommentMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sendingComment && handleSendComment()}
              placeholder="Digite um comentário..."
              style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              maxLength={500}
            />
            <button
              onClick={handleSendComment}
              disabled={sendingComment || !commentMsg.trim()}
              style={{ background: cor, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: sendingComment || !commentMsg.trim() ? 0.6 : 1 }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Live YouTube
  if (liveActive && liveUrl) {
    return (
      <div style={{ position: 'relative', height: '85vh', minHeight: '500px', backgroundColor: '#000000' }}>
        <style>{`
          @keyframes live-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .live-badge-dot { animation: live-pulse 1.4s ease-in-out infinite; }
        `}</style>
        <iframe
          src={getEmbedUrl(liveUrl)}
          style={{ position: 'absolute', top: '90px', left: 0, right: 0, bottom: 0, width: '100%', height: 'calc(100% - 90px)', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div style={{
          position: 'absolute', top: '90px', left: '24px', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '20px',
          backgroundColor: 'rgba(255,68,68,0.9)',
        }}>
          <span className="live-badge-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px', letterSpacing: '0.04em' }}>🔴 AO VIVO</span>
        </div>
      </div>
    )
  }

  if (courses.length > 0 || mentorias.length > 0) {
    const slides: Slide[] = [
      ...courses.map((c): Slide => ({ tipo: 'curso', ...c })),
      ...mentorias.map((m): Slide => ({ tipo: 'mentoria', ...m })),
    ]
    return <BannerRotativo slides={slides} slug={slug} cor={cor} basePath={basePath} />
  }

  return (
    <div style={{
      height: '85vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '16px',
    }}>
      <p style={{ fontSize: '48px' }}>📚</p>
      <p style={{ color: '#888888', fontSize: '18px' }}>Nenhum curso disponível ainda</p>
    </div>
  )
}
