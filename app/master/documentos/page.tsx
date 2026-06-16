'use client'

import { useState, useEffect } from 'react'
import {
  getAllDocumentsForMaster,
  updateDocumentContent,
  publishNewVersion,
  carregarDocumentosPadrao,
} from '@/app/actions/legal-actions'
import type { LegalDocument } from '@/app/actions/legal-actions'

const ROLES: Array<{ key: 'school' | 'student'; label: string }> = [
  { key: 'school', label: 'Termos das Escolas' },
  { key: 'student', label: 'Termos dos Alunos' },
]

const DOC_TYPES: Array<{ key: 'terms_of_use' | 'privacy_policy' | 'cookie_policy'; label: string; icon: string }> = [
  { key: 'terms_of_use', label: 'Termos de Uso', icon: '📄' },
  { key: 'privacy_policy', label: 'Política de Privacidade', icon: '🔒' },
  { key: 'cookie_policy', label: 'Política de Cookies', icon: '🍪' },
]

function nextVersion(current: string): string {
  const major = Math.floor(parseFloat(current))
  return isNaN(major) ? '2.0' : `${major + 1}.0`
}

export default function DocumentosMasterPage() {
  const [docs, setDocs] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState<'school' | 'student'>('school')
  const [activeType, setActiveType] = useState<'terms_of_use' | 'privacy_policy' | 'cookie_policy'>('terms_of_use')
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function reload() {
    setLoading(true)
    const data = await getAllDocumentsForMaster()
    setDocs(data)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const currentDoc = docs.find(
    d => d.is_active && d.target_role === activeRole && d.type === activeType
  )

  useEffect(() => {
    if (currentDoc) {
      setEditTitle(currentDoc.title)
      setEditContent(currentDoc.content)
      setIsDirty(false)
      setMessage('')
    }
  }, [currentDoc?.id])

  async function handleCarregarPadrao() {
    if (!confirm('Inserir os 6 documentos padrão com placeholder? Apenas os que ainda não existem no banco serão criados.')) return
    setCarregando(true)
    setMessage('')
    const result = await carregarDocumentosPadrao()
    if (result.error) {
      setMessage('Erro: ' + result.error)
    } else if (result.inseridos === 0) {
      setMessage('ℹ️ Todos os 6 documentos já existem no banco. Nada foi alterado.')
    } else {
      setMessage(`✅ ${result.inseridos} documento(s) inserido(s) com sucesso. Agora edite o conteúdo de cada um.`)
      await reload()
    }
    setCarregando(false)
  }

  async function handleSalvar() {
    if (!currentDoc) return
    setSaving(true)
    setMessage('')
    const result = await updateDocumentContent(currentDoc.id, editTitle, editContent)
    if (result.error) {
      setMessage('Erro: ' + result.error)
    } else {
      setMessage('✅ Conteúdo salvo. Nenhum re-aceite necessário.')
      setIsDirty(false)
      await reload()
    }
    setSaving(false)
  }

  async function handleNovaVersao() {
    if (!currentDoc) return
    const nova = nextVersion(currentDoc.version)
    if (!confirm(`Publicar versão ${nova}?\n\nTodos os usuários afetados precisarão aceitar os novos termos no próximo acesso.`)) return
    setSaving(true)
    setMessage('')
    const result = await publishNewVersion({
      type: currentDoc.type,
      target_role: currentDoc.target_role,
      title: editTitle,
      content: editContent,
      version: nova,
    })
    if (result.error) {
      setMessage('Erro: ' + result.error)
    } else {
      setMessage(`✅ Versão ${nova} publicada! Re-aceite obrigatório para todos os usuários.`)
      setIsDirty(false)
      await reload()
    }
    setSaving(false)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: active ? '700' : '400', fontSize: '14px',
    backgroundColor: active ? '#AEEA00' : 'transparent',
    color: active ? '#0D0D0D' : '#888888',
    transition: 'all 0.15s',
  })

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: '6px', border: `1px solid ${active ? '#444444' : '#2A2A2A'}`,
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? '600' : '400', fontSize: '13px',
    backgroundColor: active ? '#1A1A1A' : 'transparent',
    color: active ? '#F0F0F0' : '#666666',
  })

  return (
    <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Documentos LGPD</h1>
          <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
            Edite os termos livremente. "Publicar nova versão" força re-aceite de todos os usuários afetados.
          </p>
        </div>
        <button
          onClick={handleCarregarPadrao}
          disabled={carregando}
          style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: 'transparent', color: carregando ? '#555555' : '#888888', fontSize: '13px', cursor: carregando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {carregando ? 'Carregando...' : '⚙️ Carregar documentos padrão'}
        </button>
      </div>

      {/* Tabs principais: Escolas / Alunos */}
      <div style={{ display: 'flex', gap: '8px', backgroundColor: '#0D0D0D', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {ROLES.map(r => (
          <button key={r.key} onClick={() => { setActiveRole(r.key); setMessage('') }} style={tabStyle(activeRole === r.key)}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Sub-tabs: tipo de documento */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DOC_TYPES.map(t => (
          <button key={t.key} onClick={() => { setActiveType(t.key); setMessage('') }} style={subTabStyle(activeType === t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Área de edição */}
      {loading ? (
        <p style={{ color: '#555555', fontSize: '14px' }}>Carregando...</p>
      ) : !currentDoc ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>Documento não encontrado. Execute a migration 005 no Supabase para criar os documentos iniciais.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', overflow: 'hidden' }}>

          {/* Header com versão */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #2A2A2A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{DOC_TYPES.find(t => t.key === activeType)?.icon}</span>
              <div>
                <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                  {DOC_TYPES.find(t => t.key === activeType)?.label} — {activeRole === 'school' ? 'Escolas' : 'Alunos'}
                </p>
                <p style={{ color: '#555555', fontSize: '12px', margin: '2px 0 0' }}>
                  v{currentDoc.version} · atualizado em {new Date(currentDoc.created_at).toLocaleDateString('pt-BR')}
                  {isDirty && <span style={{ color: '#FF8800', marginLeft: '8px' }}>● alterações não salvas</span>}
                </p>
              </div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#7C4DFF', backgroundColor: 'rgba(124,77,255,0.1)', padding: '3px 10px', borderRadius: '20px' }}>
              v{currentDoc.version}
            </span>
          </div>

          {/* Campos de edição */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Título do documento
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={e => { setEditTitle(e.target.value); setIsDirty(true) }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Conteúdo
              </label>
              <textarea
                value={editContent}
                onChange={e => { setEditContent(e.target.value); setIsDirty(true) }}
                rows={22}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: '#0D0D0D', color: '#CCCCCC', fontSize: '13px', lineHeight: '1.8', outline: 'none', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div style={{ margin: '0 24px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', backgroundColor: message.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(174,234,0,0.1)', border: `1px solid ${message.startsWith('Erro') ? 'rgba(255,85,85,0.3)' : 'rgba(174,234,0,0.3)'}`, color: message.startsWith('Erro') ? '#FF5555' : '#AEEA00' }}>
              {message}
            </div>
          )}

          {/* Footer com botões */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #2A2A2A', marginTop: '16px' }}>
            <button
              onClick={handleSalvar}
              disabled={saving || !isDirty}
              style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: 'transparent', color: saving || !isDirty ? '#444444' : '#F0F0F0', fontSize: '14px', fontWeight: '600', cursor: saving || !isDirty ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              {saving ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            <button
              onClick={handleNovaVersao}
              disabled={saving}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: saving ? '#331A00' : '#FF8800', color: saving ? '#FF8800' : '#0D0D0D', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}
            >
              🚀 Publicar nova versão → v{nextVersion(currentDoc.version)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
