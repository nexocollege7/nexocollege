'use client'

import { useEffect, useState } from 'react'
import { getMyMentorshipAsGuest, updateClassMaterialsAsGuest } from '@/app/actions/mentor-guest-actions'
import { AulaComentarios } from '@/components/AulaComentarios'
import { GraduationCap, Calendar, Users } from 'lucide-react'

export default function MinhaMentoriaPage() {
  const [mentoria, setMentoria] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [materiaisEdit, setMateriaisEdit] = useState<Record<string, string>>({})
  const [salvandoMaterial, setSalvandoMaterial] = useState<string | null>(null)


  useEffect(() => {
    async function load() {
      const data = await getMyMentorshipAsGuest()
      setMentoria(data)
      setLoading(false)
    }
    load()
  }, [])

  function showMsg(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleSalvarMaterial(classId: string) {
    const url = materiaisEdit[classId] ?? ''
    setSalvandoMaterial(classId)
    const result = await updateClassMaterialsAsGuest(classId, url)
    setSalvandoMaterial(null)
    if (result?.error) { showMsg('Erro: ' + result.error); return }
    setMentoria({
      ...mentoria,
      classes: mentoria.classes.map((c: any) => c.id === classId ? { ...c, materials_url: url || null } : c),
    })
    showMsg('✅ Link de materiais salvo!')
  }


  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <p style={{ color: '#888888' }}>Carregando...</p>
      </div>
    )
  }

  if (!mentoria) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', textAlign: 'center' }}>
        <GraduationCap size={32} style={{ color: '#444444', marginBottom: '12px' }} />
        <p style={{ color: '#888888' }}>Nenhuma mentoria associada à sua conta no momento.</p>
      </div>
    )
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
    color: '#F0F0F0', fontSize: '13px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#7C4DFF', color: '#fff',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  }

  const classesOrdenadas = (mentoria.classes || []).slice().sort((a: any, b: any) => a.position - b.position)
  const turmasAbertas = (mentoria.cohorts || []).filter((c: any) => c.status === 'open')
  const turmasArquivadas = (mentoria.cohorts || []).filter((c: any) => c.status !== 'open')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>{mentoria.title}</h1>
        {mentoria.description && (
          <p style={{ color: '#888888', fontSize: '13px', margin: '6px 0 0' }}>{mentoria.description}</p>
        )}
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(124,77,255,0.1)', border: `1px solid ${msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF'}`, borderRadius: '8px', padding: '12px 16px', color: msg.startsWith('Erro') ? '#FF5555' : '#7C4DFF', fontSize: '14px' }}>
          {msg}
        </div>
      )}

      {!mentoria.hasOpenCohort && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '14px 16px' }}>
          <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>
            ⏸️ Sua turma foi encerrada. Você ainda pode visualizar o conteúdo, mas não é mais possível editar materiais ou ativar transmissão.
          </p>
        </div>
      )}

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Cronograma</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {classesOrdenadas.length === 0 && (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Nenhum encontro cadastrado.</p>
          )}
          {classesOrdenadas.map((c: any, i: number) => (
            <div key={c.id} style={{ padding: '14px 16px', backgroundColor: '#0D0D0D', borderRadius: '8px', border: '1px solid #2A2A2A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700' }}>{i + 1}.</span>
                <span style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600' }}>{c.title}</span>
              </div>
              {c.summary && <p style={{ color: '#888888', fontSize: '12px', margin: '4px 0 0' }}>{c.summary}</p>}
              {c.scheduled_at && (
                <p style={{ color: '#555555', fontSize: '12px', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} /> {new Date(c.scheduled_at).toLocaleString('pt-BR')}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  placeholder="Link de materiais"
                  style={input}
                  value={materiaisEdit[c.id] ?? c.materials_url ?? ''}
                  onChange={(e) => setMateriaisEdit({ ...materiaisEdit, [c.id]: e.target.value })}
                  disabled={!mentoria.hasOpenCohort}
                />
                <button
                  onClick={() => handleSalvarMaterial(c.id)}
                  disabled={!mentoria.hasOpenCohort || salvandoMaterial === c.id}
                  style={{ ...btnPrimary, whiteSpace: 'nowrap', opacity: !mentoria.hasOpenCohort ? 0.5 : 1 }}
                >
                  {salvandoMaterial === c.id ? '...' : 'Salvar link'}
                </button>
              </div>

              <AulaComentarios classId={c.id} podeComentar={false} expandidoPorPadrao={false} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Turmas</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mentoria.cohorts.length === 0 && (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Nenhuma turma aberta ainda.</p>
          )}
          {[...turmasAbertas, ...turmasArquivadas].map((c: any) => {
            const aberta = c.status === 'open'
            return (
              <div key={c.id} style={{ padding: '14px 16px', backgroundColor: '#0D0D0D', borderRadius: '8px', border: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', color: aberta ? '#AEEA00' : '#888888', backgroundColor: aberta ? '#1A2E00' : '#222222' }}>
                    {aberta ? 'Aberta' : c.status === 'closed' ? 'Fechada' : 'Arquivada'}
                  </span>
                  <span style={{ color: '#F0F0F0', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} /> {c.max_students} vagas
                  </span>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
