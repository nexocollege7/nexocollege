'use client'

import { useEffect, useState, useRef } from 'react'
import { getLiveStatus } from '@/app/actions/vitrine-actions'
import { sendLiveComment } from '@/app/actions/school-actions'
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
  const [initialized, setInitialized] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentMsg, setCommentMsg] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [userName, setUserName] = useState('Aluno')
  const videoRef = useRef<HTMLVideoElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserName(user.email.split('@')[0])
    })
    getLiveStatus(schoolId).then((status) => {
      setLiveActive(status.liveActive)
      setLiveUrl(status.liveUrl)
      setLiveType(status.liveType)
      setSessionId(status.sessionId)
      setDailyRoomUrl(status.dailyRoomUrl)
      setDailyRoomName(status.dailyRoomName ?? null)
      setInitialized(true)
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
    if (!initialized) return
    if (liveType !== 'native') return
    if (!dailyRoomUrl || !dailyRoomName) return
    initViewer(dailyRoomUrl, dailyRoomName, userName)
    return () => {
      const obj = (window as any).__dailyViewerObj
      if (obj) { try { obj.leave(); obj.destroy() } catch {} ; (window as any).__dailyViewerObj = null }
    }
  }, [initialized, liveType, dailyRoomUrl, dailyRoomName, userName])

  useEffect(() => {
    if (liveType === 'native' && sessionId) {
      const channel = supabase
        .channel('live-comments-vitrine-' + sessionId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'live_comments',
          filter: 'live_session_id=eq.' + sessionId,
        }, (payload) => {
          setComments((prev) => [...prev, payload.new as Comment])
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [liveType, sessionId])

  function attachTrack(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack | null) {
    if (!videoRef.current) return
    if (!streamRef.current) {
      streamRef.current = new MediaStream()
    }
    // Remover tracks antigas do mesmo tipo
    streamRef.current.getVideoTracks().forEach(t => streamRef.current!.removeTrack(t))
    streamRef.current.addTrack(videoTrack)
    if (audioTrack) {
      streamRef.current.getAudioTracks().forEach(t => streamRef.current!.removeTrack(t))
      streamRef.current.addTrack(audioTrack)
    }
    videoRef.current.srcObject = streamRef.current
    setHasVideo(true)
  }

  async function initViewer(roomUrl: string, roomName: string, viewerName: string) {
    const Daily = (await import('@daily-co/daily-js')).default

    // Destruir TODAS as instâncias existentes do Daily antes de criar nova
    const existing = (window as any).__dailyViewerObj
    if (existing) {
      try { await existing.leave() } catch {}
      try { existing.destroy() } catch {}
      ;(window as any).__dailyViewerObj = null
    }
    // Garantir que não há instâncias órfãs
    try { Daily.getCallInstance()?.destroy() } catch {}

    // Sala pública — entrar direto sem token
    const call = Daily.createCallObject({ url: roomUrl })

    function processParticipant(p: any) {
      if (p.local) return
      const vState = p.tracks?.video?.state
      const vTrack = p.tracks?.video?.persistentTrack ?? p.tracks?.video?.track
      const aTrack = p.tracks?.audio?.persistentTrack ?? p.tracks?.audio?.track
      // Aceitar qualquer estado exceto off/blocked
      if (vTrack && vState !== 'off' && vState !== 'blocked' && vState !== undefined) {
        attachTrack(vTrack, aTrack)
      }
    }

    call.on('track-started', (e: any) => {
      if (!e?.participant || e.participant.local) return
      processParticipant(e.participant)
    })

    call.on('participant-updated', (e: any) => {
      if (!e?.participant || e.participant.local) return
      processParticipant(e.participant)
    })

    call.on('participant-counts-updated', (e: any) => {
      setViewerCount(Math.max(0, (e?.participantCounts?.present ?? 1) - 1))
    })

    await call.join({ startVideoOff: true, startAudioOff: true })
    ;(window as any).__dailyViewerObj = call

    // Verificar participants já presentes
    // Verificar múltiplas vezes para garantir que as tracks chegaram
    const checkParticipants = () => {
      const participants = call.participants()
      Object.values(participants).forEach((p: any) => processParticipant(p))
    }
    setTimeout(checkParticipants, 1500)
    setTimeout(checkParticipants, 3000)
    setTimeout(checkParticipants, 5000)
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
      <div style={{ backgroundColor: '#000' }}>
        <style>{`
          @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .live-badge-dot { animation: live-pulse 1.4s ease-in-out infinite; }
        `}</style>

        {/* Player */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000', display: hasVideo ? 'block' : 'none' }}
          />
          {!hasVideo && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#555', fontSize: '14px' }}>Conectando à transmissão...</p>
            </div>
          )}
          <div style={{ position: 'absolute', top: '60px', left: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(255,68,68,0.9)' }}>
            <span className="live-badge-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px' }}>🔴 AO VIVO</span>
          </div>
          {viewerCount > 0 && (
            <div style={{ position: 'absolute', top: '60px', right: '16px', zIndex: 10, padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <span style={{ color: '#fff', fontSize: '13px' }}>👁 {viewerCount}</span>
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={{ background: '#0D0D0D', borderTop: '1px solid #1e1e1e', padding: '32px 48px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>💬 Comentários ao vivo</h3>
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {comments.length === 0 && (
              <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>Nenhum comentário ainda...</p>
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
            <input value={commentMsg} onChange={e => setCommentMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sendingComment && handleSendComment()}
              placeholder="Digite um comentário..."
              style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              maxLength={500} />
            <button onClick={handleSendComment} disabled={sendingComment || !commentMsg.trim()}
              style={{ background: cor, color: '#000', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: sendingComment || !commentMsg.trim() ? 0.6 : 1 }}>
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
          @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .live-badge-dot { animation: live-pulse 1.4s ease-in-out infinite; }
        `}</style>
        <iframe src={getEmbedUrl(liveUrl, { autoplay: true, mute: true })}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen />
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(255,68,68,0.9)' }}>
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
    <div style={{ height: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '48px' }}>📚</p>
      <p style={{ color: '#888888', fontSize: '18px' }}>Nenhum curso disponível ainda</p>
    </div>
  )
}
