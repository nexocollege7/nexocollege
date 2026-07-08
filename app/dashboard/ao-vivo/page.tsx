'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMySchool, updateLiveStatus, verificarPermissaoFeature } from '@/app/actions/school-actions'
import { PlanLock } from '@/components/PlanLock'
import type { PermissaoPlano } from '@/lib/plan-permissions'
import { SkeletonGrid, SkeletonCard } from '@/components/ui/skeleton'

export default function AoVivoPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const [liveUrl, setLiveUrl] = useState('')
  const [liveActive, setLiveActive] = useState(false)
  const [savingLive, setSavingLive] = useState(false)
  const [permissaoLive, setPermissaoLive] = useState<PermissaoPlano | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const schoolData = await getMySchool()
    if (schoolData) {
      setLiveUrl(schoolData.live_url || '')
      setLiveActive(schoolData.live_active || false)
    }

    const liveAllowed = await verificarPermissaoFeature('live_events')
    setPermissaoLive(liveAllowed)

    setLoading(false)
  }

  function showMsg(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
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
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Transmissão ao vivo</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 20px' }}>
              Cole o link de uma live do YouTube ou Vimeo. Quando ativa, ela substitui o banner principal da vitrine, com o badge "🔴 AO VIVO".
            </p>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
              borderRadius: '20px', marginBottom: '20px',
              background: liveActive ? 'rgba(255,68,68,0.1)' : '#1a1a1a',
              border: `1px solid ${liveActive ? '#FF4444' : '#2a2a2a'}`,
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: liveActive ? '#FF4444' : '#555' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: liveActive ? '#FF4444' : '#666' }}>
                {liveActive ? 'Ao vivo agora' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Link da transmissão (YouTube ou Vimeo)</label>
                <input
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  style={inputStyle}
                  placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  disabled={liveActive}
                />
                {liveActive && (
                  <p style={{ color: '#555', fontSize: '12px', margin: '6px 0 0' }}>Encerre a transmissão para alterar o link.</p>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={alternarTransmissao}
                  disabled={savingLive || (!liveActive && !liveUrl.trim())}
                  style={{
                    ...btnStyle,
                    background: liveActive ? '#FF4444' : '#AEEA00',
                    color: liveActive ? '#fff' : '#000',
                    opacity: savingLive || (!liveActive && !liveUrl.trim()) ? 0.6 : 1,
                  }}
                >
                  {savingLive ? 'Aguarde...' : liveActive ? 'Encerrar transmissão' : 'Iniciar transmissão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
