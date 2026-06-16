'use client'

import { useState, useEffect } from 'react'
import {
  getAllDocumentsForMaster,
  updateDocumentContent,
  publishNewVersion,
} from '@/app/actions/legal-actions'
import type { LegalDocument } from '@/app/actions/legal-actions'

const ROLE_LABELS: Record<string, string> = { school: 'Escola (Gestor)', student: 'Aluno' }
const TYPE_LABELS: Record<string, string> = {
  terms_of_use: 'Termos de Uso',
  privacy_policy: 'Política de Privacidade',
  cookie_policy: 'Política de Cookies',
}
const TYPE_ICONS: Record<string, string> = {
  terms_of_use: '📄',
  privacy_policy: '🔒',
  cookie_policy: '🍪',
}

type EditState = {
  docId: string
  title: string
  content: string
  mode: 'edit' | 'newVersion'
  newVersion: string
}

export default function DocumentosMasterPage() {
  const [docs, setDocs] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function reload() {
    setLoading(true)
    const data = await getAllDocumentsForMaster()
    setDocs(data)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  function startEdit(doc: LegalDocument, mode: 'edit' | 'newVersion' = 'edit') {
    setEdit({ docId: doc.id, title: doc.title, content: doc.content, mode, newVersion: '' })
    setMessage('')
  }

  async function handleSave() {
    if (!edit) return
    setSaving(true)
    setMessage('')

    let result: { error?: string }

    if (edit.mode === 'edit') {
      result = await updateDocumentContent(edit.docId, edit.title, edit.content)
    } else {
      const doc = docs.find(d => d.id === edit.docId)!
      if (!edit.newVersion.trim()) {
        setMessage('Informe o número da nova versão.')
        setSaving(false)
        return
      }
      result = await publishNewVersion({
        type: doc.type,
        target_role: doc.target_role,
        title: edit.title,
        content: edit.content,
        version: edit.newVersion.trim(),
      })
    }

    if (result.error) {
      setMessage(`Erro: ${result.error}`)
    } else {
      setMessage(edit.mode === 'newVersion'
        ? '✅ Nova versão publicada! Todos os usuários precisarão aceitar na próxima vez que acessarem.'
        : '✅ Conteúdo salvo com sucesso.')
      setEdit(null)
      await reload()
    }
    setSaving(false)
  }

  // Agrupar: apenas documentos ativos
  const activeDocs = docs.filter(d => d.is_active)
  const inactiveDocs = docs.filter(d => !d.is_active)

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Documentos LGPD</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          Gerencie os documentos legais da plataforma. Publicar nova versão exige re-aceite de todos os usuários.
        </p>
      </div>

      {message && (
        <div style={{
          backgroundColor: message.startsWith('Erro') ? 'rgba(255,85,85,0.1)' : 'rgba(174,234,0,0.1)',
          border: `1px solid ${message.startsWith('Erro') ? 'rgba(255,85,85,0.3)' : 'rgba(174,234,0,0.3)'}`,
          color: message.startsWith('Erro') ? '#FF5555' : '#AEEA00',
          borderRadius: '8px', padding: '12px 16px', fontSize: '13px',
        }}>
          {message}
        </div>
      )}

      {/* Modal de edição */}
      {edit && (() => {
        const doc = docs.find(d => d.id === edit.docId)!
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2A2A2A', width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #2A2A2A' }}>
                <div>
                  <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>
                    {edit.mode === 'newVersion' ? '🚀 Publicar nova versão' : '✏️ Editar conteúdo'}
                  </h2>
                  <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>
                    {TYPE_ICONS[doc.type]} {TYPE_LABELS[doc.type]} — {ROLE_LABELS[doc.target_role]} — atual: v{doc.version}
                  </p>
                </div>
                <button onClick={() => setEdit(null)} style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ overflowY: 'auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {edit.mode === 'newVersion' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#888888', marginBottom: '6px' }}>Número da nova versão</label>
                    <input
                      type="text"
                      value={edit.newVersion}
                      onChange={(e) => setEdit(prev => prev ? { ...prev, newVersion: e.target.value } : null)}
                      placeholder="Ex: 2.0"
                      style={{ width: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #AEEA00', backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <p style={{ color: '#FF8800', fontSize: '12px', margin: '8px 0 0' }}>
                      ⚠️ Publicar nova versão exigirá que TODOS os usuários aceitem novamente.
                    </p>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888888', marginBottom: '6px' }}>Título do documento</label>
                  <input
                    type="text"
                    value={edit.title}
                    onChange={(e) => setEdit(prev => prev ? { ...prev, title: e.target.value } : null)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888888', marginBottom: '6px' }}>Conteúdo</label>
                  <textarea
                    value={edit.content}
                    onChange={(e) => setEdit(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={20}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: '#0D0D0D', color: '#CCCCCC', fontSize: '13px', lineHeight: '1.7', outline: 'none', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A2A', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEdit(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: 'transparent', color: '#888888', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    backgroundColor: edit.mode === 'newVersion' ? '#FF8800' : '#AEEA00',
                    color: '#0D0D0D', fontWeight: '700', fontSize: '14px',
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Salvando...' : edit.mode === 'newVersion' ? 'Publicar nova versão' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Documentos ativos */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#AEEA00', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
          Documentos Ativos ({activeDocs.length})
        </h2>

        {loading ? (
          <p style={{ color: '#555555', fontSize: '14px' }}>Carregando...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {activeDocs.map((doc) => (
              <div key={doc.id} style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{TYPE_ICONS[doc.type]}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#7C4DFF', backgroundColor: 'rgba(124,77,255,0.1)', padding: '2px 8px', borderRadius: '20px' }}>
                      {ROLE_LABELS[doc.target_role]}
                    </span>
                    <span style={{ fontSize: '11px', color: '#555555', marginLeft: 'auto' }}>v{doc.version}</span>
                  </div>
                  <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: '6px 0 4px' }}>
                    {TYPE_LABELS[doc.type]}
                  </p>
                  <p style={{ color: '#555555', fontSize: '11px', margin: 0 }}>
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <p style={{ color: '#666666', fontSize: '12px', margin: 0, lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>
                  {doc.content.substring(0, 120)}...
                </p>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => startEdit(doc, 'edit')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #333333', backgroundColor: 'transparent', color: '#888888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => startEdit(doc, 'newVersion')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #FF8800', backgroundColor: 'rgba(255,136,0,0.1)', color: '#FF8800', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}
                  >
                    🚀 Nova versão
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de versões antigas */}
      {inactiveDocs.length > 0 && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
            Versões Anteriores ({inactiveDocs.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inactiveDocs.map((doc) => (
              <div key={doc.id} style={{ backgroundColor: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
                <span style={{ fontSize: '14px' }}>{TYPE_ICONS[doc.type]}</span>
                <span style={{ color: '#555555', fontSize: '13px' }}>{TYPE_LABELS[doc.type]} — {ROLE_LABELS[doc.target_role]}</span>
                <span style={{ color: '#444444', fontSize: '11px', marginLeft: 'auto' }}>v{doc.version} · {new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
