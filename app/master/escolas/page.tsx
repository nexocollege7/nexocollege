'use client'

import { useEffect, useState } from 'react'
import { getEscolas, toggleEscolaStatus, alterarPlanoEscola } from '@/app/actions/master-actions'
import Link from 'next/link'

export default function EscolasPage() {
  const [escolas, setEscolas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const data = await getEscolas()
      setEscolas(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggle(escolaId: string, isActive: boolean) {
    await toggleEscolaStatus(escolaId, !isActive)
    setEscolas(escolas.map((e) => e.id === escolaId ? { ...e, is_active: !isActive } : e))
  }

  async function handlePlano(escolaId: string, plano: string) {
    setSalvando(escolaId)
    await alterarPlanoEscola(escolaId, plano as 'starter' | 'pro' | 'enterprise')
    setEscolas(escolas.map((e) => e.id === escolaId ? { ...e, plan: plano } : e))
    setSalvando(null)
  }

  function getWhatsAppLink(phone: string) {
    const clean = phone.replace(/\D/g, '')
    const number = clean.startsWith('55') ? clean : '55' + clean
    return 'https://wa.me/' + number
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando escolas...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Escolas</h1>
          <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
            {escolas.length} escola{escolas.length !== 1 ? 's' : ''} cadastrada{escolas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/master/nova-escola" style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#AEEA00', color: '#0D0D0D', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
          + Nova Escola
        </Link>
      </div>

      {escolas.length === 0 ? (
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>Nenhuma escola cadastrada</p>
          <Link href="/master/nova-escola" style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#AEEA00', color: '#0D0D0D', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
            Cadastrar Escola
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {escolas.map((escola) => (
            <div key={escola.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{ width: '48px', height: '48px', minWidth: '48px', borderRadius: '10px', backgroundColor: escola.is_active ? '#1A2E00' : '#2A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: escola.is_active ? '#AEEA00' : '#555555' }}>
                    {escola.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: 0 }}>{escola.name}</p>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', backgroundColor: escola.is_active ? '#1A2E00' : '#2A1A1A', color: escola.is_active ? '#AEEA00' : '#FF5555' }}>
                        {escola.is_active ? 'Ativa' : 'Suspensa'}
                      </span>
                    </div>
                    {escola.owner_name && (
                      <p style={{ color: '#CCCCCC', fontSize: '13px', margin: '4px 0 0' }}>
                        Responsavel: {escola.owner_name}
                        {escola.owner_phone && (
                          <span style={{ marginLeft: '8px' }}>
                            <a href={getWhatsAppLink(escola.owner_phone)} target="_blank" rel="noreferrer" style={{ color: '#25D366', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>WhatsApp</a>
                          </span>
                        )}
                      </p>
                    )}
                    <p style={{ color: '#555555', fontSize: '12px', margin: '4px 0 0' }}>
                      {(escola.courses as any)?.[0]?.count || 0} curso(s) &bull; {(escola.enrollments as any)?.[0]?.count || 0} aluno(s) &bull; Criada em {new Date(escola.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <label style={{ color: '#555555', fontSize: '11px' }}>Plano</label>
                    <select value={escola.plan ?? 'starter'} disabled={salvando === escola.id} onChange={(e) => handlePlano(escola.id, e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D', color: '#7C4DFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: salvando === escola.id ? 0.5 : 1 }}>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    {salvando === escola.id && <span style={{ color: '#AEEA00', fontSize: '11px' }}>Salvando...</span>}
                  </div>
                  <a href={'https://' + escola.slug + '.nexocollege.com.br'} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', textDecoration: 'none' }}>Vitrine</a>
                  <button onClick={() => handleToggle(escola.id, escola.is_active)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: escola.is_active ? '#2A1A1A' : '#1A2E00', color: escola.is_active ? '#FF5555' : '#AEEA00', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {escola.is_active ? 'Suspender' : 'Reativar'}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}