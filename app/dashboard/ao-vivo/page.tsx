'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getMySchool,
  updateLiveStatus,
  verificarPermissaoFeature,
  startNativeLive,
  endNativeLive,
  sendLiveComment,
  getActiveLiveSession,
} from '@/app/actions/school-actions'
import { getMyCourses } from '@/app/actions/course-actions'
import { PlanLock } from '@/components/PlanLock'
import type { PermissaoPlano } from '@/lib/plan-permissions'
import { SkeletonCard } from '@/components/ui/skeleton'

type Course = { id: string; title: string }
type LiveSession = { id: string; daily_room_url: string; daily_room_name: string; status: string; live_type: string; visibility: string }
type Comment = { id: string; user_name: string; message: string; created_at: string }

export default function AoVivoPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  // YouTube
  const [liveUrl, setLiveUrl] = useState('')
  const [liveActive, setLiveActive] = useState(false)
  const [savingLive, setSavingLive] = useState(false)

  // Permissões
  const [permissaoLive, setPermissaoLive] = useState<PermissaoPlano | null>(null)
  const [permissaoNativa, setPermissaoNativa] = useState<PermissaoPlano | null>(null)

  // Tab ativa
  const [activeTab, setActiveTab] = useState<'youtube' | 'native'>('youtube')

  // Live nativa
  const [courses, setCourses] = useState<Course[]>([])
  const [visibility, setVisibility] = useState<'public' | 'restricted'>('public')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [nativeSession, setNativeSession] = useState<LiveSession | null>(null)
  const [nativeLoading, setNativeLoading] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentMsg, setCommentMsg] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [userName, setUserName] = useState('')
  const dailyContainerRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [schoolData, liveAllowed, nativeAllowed, coursesData] = await Promise.all([
      getMySchool(),
      verificarPermissaoFeature('live_events'),
      verificarPermissaoFeature('live_native'),
      getMyCourses(),
    ])

    if (schoolData) {
      setLiveUrl(schoolData.live_url || '')
      setLiveActive(schoolData.live_active || false)
    }

    setPermissaoLive(liveAllowed)
    setPermissaoNativa(nativeAllowed)
    setCourses((coursesData as Course[]).map((c) => ({ id: c.id, title: c.title })))
    setUserName(user.email ?? 'Professor')

    // Verificar se há live nativa ativa
    if (schoolData?.id) {
      const session = await getActiveLiveSession(schoolData.id)
      if (session && session.live_type === 'native') {
        setNativeSession(session as LiveSession)
        setActiveTab('native')
        initDailyRoom(session.daily_room_url)
        subscribeComments(session.id)
      }
    }

    setLoading(false)
  }

  async function initDailyRoom(roomUrl: string, token?: string) {
    if (!dailyContainerRef.current) return
    const DailyIframe = (await import('@daily-co/daily-js')).default
    const existing = (window as any).__dailyCallObject
    if (existing) { existing.destroy(); (window as any).__dailyCallObject = null }
    const callObject = DailyIframe.createFrame(dailyContainerRef.current, {
      url: roomUrl,
      token,
      showLeaveButton: false,
      showFullscreenButton: true,
      showLocalVideo: true,
      showParticipantsBar: false,
      iframeStyle: { width: '100%', height: '480px', border: 'none', borderRadius: '8px' },
    })

    callObject.on('participant-counts-updated', (e: any) => {
      const count = e?.participantCounts?.present ?? 0
      const el = document.getElementById('live-viewer-count')
      if (el) el.textContent = count > 1 ? String(count - 1) : '0'
    })
    const iframe = dailyContainerRef.current.querySelector('iframe')
    if (iframe) {
      iframe.setAttribute('allow', 'camera; microphone; autoplay; display-capture; picture-in-picture')
    }
    await callObject.join({ startVideoOff: false, startAudioOff: false })
    ;(window as any).__dailyCallObject = callObject
  }

  function subscribeComments(sessionId: string) {
    supabase
      .channel('live-comments-' + sessionId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_comments',
        filter: 'live_session_id=eq.' + sessionId,
      }, (payload) => {
        setComments((prev) => [...prev, payload.new as Comment])
      })
      .subscribe()
  }

  function showMsg(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 4000)
  }

  async function alternarTransmissao() {
    setSavingLive(true)
    const novoStatus = !liveActive
    const result = await updateLiveStatus(liveUrl, novoStatus)
    setSavingLive(false)
    if ((result as any)?.error) { showMsg('Erro: ' + (result as any).error); return }
    setLiveActive(novoStatus)
    showMsg(novoStatus ? '🔴 Transmissão iniciada!' : '✅ Transmissão encerrada!')
  }

  async function handleStartNative() {
    if (visibility === 'restricted' && selectedCourses.length === 0) {
      showMsg('Selecione ao menos um curso para transmissão restrita.')
      return
    }
    setNativeLoading(true)
    const result = await startNativeLive({ visibility, courseIds: selectedCourses })
    if ((result as any)?.error) {
      showMsg('Erro: ' + (result as any).error)
      setNativeLoading(false)
      return
    }
    const { sessionId, roomUrl, token } = result as any
    setNativeSession({ id: sessionId, daily_room_url: roomUrl, daily_room_name: '', status: 'live', live_type: 'native', visibility })
    await initDailyRoom(roomUrl, token)
    subscribeComments(sessionId)
    setNativeLoading(false)
    showMsg('🔴 Transmissão ao vivo iniciada!')
  }

  async function handleEndNative() {
    if (!nativeSession) return
    setNativeLoading(true)
    const existing = (window as any).__dailyCallObject
    if (existing) { await existing.leave(); existing.destroy(); (window as any).__dailyCallObject = null }
    await endNativeLive(nativeSession.id)
    setNativeSession(null)
    setComments([])
    setNativeLoading(false)
    showMsg('✅ Transmissão encerrada!')
  }

  async function handleSendComment() {
    if (!nativeSession || !commentMsg.trim()) return
    setSendingComment(true)
    await sendLiveComment({ sessionId: nativeSession.id, message: commentMsg, userName })
    setCommentMsg('')
    setSendingComment(false)
  }

  function toggleCourse(id: string) {
    setSelectedCourses((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const inputStyle = {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  }
  const labelStyle = { color: '#aaa', fontSize: '13px', display: 'block' as const, marginBottom: '6px' }
  const btnStyle = {
    background: '#AEEA00', color: '#000', border: 'none', borderRadius: '8px',
    padding: '10px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  }

  if (loading) return <SkeletonCard lines={2} />

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>Ao Vivo</h1>
        <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>Gerencie transmissões em tempo real para sua vitrine</p>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(174,234,0,0.1)', border: `1px solid ${msg.startsWith('Erro') ? '#FF5555' : '#AEEA00'}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: msg.startsWith('Erro') ? '#FF5555' : '#AEEA00', fontSize: '14px' }}>
          {msg}
        </div>
      )}

      {permissaoLive && !permissaoLive.allowed && (
        <PlanLock upgradeRequired={permissaoLive.upgradeRequired} mensagem="Eventos ao vivo disponíveis a partir do plano Pro" />
      )}

      {permissaoLive?.allowed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e1e1e', paddingBottom: '0' }}>
            <button
              onClick={() => setActiveTab('youtube')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: '14px', fontWeight: '600',
                color: activeTab === 'youtube' ? '#AEEA00' : '#666',
                borderBottom: activeTab === 'youtube' ? '2px solid #AEEA00' : '2px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              📺 Link YouTube
            </button>
            {permissaoNativa?.allowed && (
              <button
                onClick={() => setActiveTab('native')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 20px', fontSize: '14px', fontWeight: '600',
                  color: activeTab === 'native' ? '#AEEA00' : '#666',
                  borderBottom: activeTab === 'native' ? '2px solid #AEEA00' : '2px solid transparent',
                  fontFamily: 'inherit',
                }}
              >
                🎥 Câmera ao vivo
              </button>
            )}
          </div>

          {/* TAB YOUTUBE */}
          {activeTab === 'youtube' && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Transmissão via YouTube</h2>
              <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>
                Cole o link de uma live do YouTube ou Vimeo. Quando ativa, ela substitui o banner principal da vitrine com o badge "🔴 AO VIVO".
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', marginBottom: '20px', background: liveActive ? 'rgba(255,68,68,0.1)' : '#1a1a1a', border: `1px solid ${liveActive ? '#FF4444' : '#2a2a2a'}` }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: liveActive ? '#FF4444' : '#555' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: liveActive ? '#FF4444' : '#666' }}>
                  {liveActive ? 'Ao vivo agora' : 'Offline'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Link da transmissão (YouTube ou Vimeo)</label>
                  <input value={liveUrl} onChange={e => setLiveUrl(e.target.value)} style={inputStyle}
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..." disabled={liveActive} />
                  {liveActive && <p style={{ color: '#555', fontSize: '12px', margin: '6px 0 0' }}>Encerre a transmissão para alterar o link.</p>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={alternarTransmissao} disabled={savingLive || (!liveActive && !liveUrl.trim())}
                    style={{ ...btnStyle, background: liveActive ? '#FF4444' : '#AEEA00', color: liveActive ? '#fff' : '#000', opacity: savingLive || (!liveActive && !liveUrl.trim()) ? 0.6 : 1 }}>
                    {savingLive ? 'Aguarde...' : liveActive ? 'Encerrar transmissão' : 'Iniciar transmissão'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CÂMERA NATIVA */}
          {activeTab === 'native' && permissaoNativa?.allowed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Player Daily.co */}
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>Câmera ao vivo</h2>
                    <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Transmita diretamente pelo browser, sem instalar nada.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: nativeSession ? 'rgba(255,68,68,0.1)' : '#1a1a1a', border: `1px solid ${nativeSession ? '#FF4444' : '#2a2a2a'}` }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: nativeSession ? '#FF4444' : '#555' }} />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: nativeSession ? '#FF4444' : '#666' }}>
                        {nativeSession ? 'Ao vivo agora' : 'Offline'}
                      </span>
                    </div>
                    {nativeSession && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                        <span style={{ fontSize: '13px', color: '#aaa' }}>👁 <span id="live-viewer-count">0</span> assistindo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Container Daily.co */}
                <div ref={dailyContainerRef} style={{ width: '100%', aspectRatio: nativeSession ? '16/9' : undefined, minHeight: nativeSession ? '360px' : '0px', borderRadius: '8px', overflow: 'hidden', backgroundColor: nativeSession ? '#000' : 'transparent' }} />

                {/* Configurações (só quando offline) */}
                {!nativeSession && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <div>
                      <label style={labelStyle}>Visibilidade da transmissão</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {(['public', 'restricted'] as const).map((v) => (
                          <button key={v} onClick={() => setVisibility(v)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${visibility === v ? '#AEEA00' : '#2a2a2a'}`, background: visibility === v ? 'rgba(174,234,0,0.1)' : '#1a1a1a', color: visibility === v ? '#AEEA00' : '#666', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            {v === 'public' ? '🌍 Público (todos na vitrine)' : '🔒 Restrito (por curso)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {visibility === 'restricted' && (
                      <div>
                        <label style={labelStyle}>Selecione os cursos com acesso</label>
                        {courses.length === 0 ? (
                          <p style={{ color: '#555', fontSize: '13px' }}>Nenhum curso encontrado.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {courses.map((c) => (
                              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', background: selectedCourses.includes(c.id) ? 'rgba(174,234,0,0.08)' : '#1a1a1a', border: `1px solid ${selectedCourses.includes(c.id) ? '#AEEA00' : '#2a2a2a'}` }}>
                                <input type="checkbox" checked={selectedCourses.includes(c.id)} onChange={() => toggleCourse(c.id)}
                                  style={{ accentColor: '#AEEA00', width: '16px', height: '16px' }} />
                                <span style={{ color: '#fff', fontSize: '14px' }}>{c.title}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={handleStartNative} disabled={nativeLoading}
                        style={{ ...btnStyle, opacity: nativeLoading ? 0.6 : 1 }}>
                        {nativeLoading ? 'Iniciando...' : '🎥 Iniciar com câmera'}
                      </button>
                    </div>
                  </div>
                )}

                {nativeSession && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button onClick={handleEndNative} disabled={nativeLoading}
                      style={{ ...btnStyle, background: '#FF4444', color: '#fff', opacity: nativeLoading ? 0.6 : 1 }}>
                      {nativeLoading ? 'Encerrando...' : '⏹ Encerrar transmissão'}
                    </button>
                  </div>
                )}
              </div>

              {/* Chat de comentários (só durante live) */}
              {nativeSession && (
                <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
                  <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>💬 Comentários ao vivo</h2>
                  <div style={{ height: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', paddingRight: '4px' }}>
                    {comments.length === 0 && (
                      <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', marginTop: '80px' }}>Nenhum comentário ainda...</p>
                    )}
                    {comments.map((c) => (
                      <div key={c.id} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '10px 14px' }}>
                        <span style={{ color: '#AEEA00', fontSize: '12px', fontWeight: '700' }}>{c.user_name}</span>
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
                      style={{ ...inputStyle, flex: 1 }}
                      maxLength={500}
                    />
                    <button onClick={handleSendComment} disabled={sendingComment || !commentMsg.trim()}
                      style={{ ...btnStyle, padding: '10px 16px', opacity: sendingComment || !commentMsg.trim() ? 0.6 : 1 }}>
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
