'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMySchool, updateSchool, createSchool, saveMpToken, getMpTokenStatus, updateMyName, getMyName, saveCustomDomain, saveOwnerContact } from '@/app/actions/school-actions'

type Collaborator = {
  id: string
  name: string
  email: string
  permissions: string[]
  created_at: string
}

type School = {
  id: string
  name: string
  description: string | null
  primary_color: string
  slug: string
  custom_domain: string | null
  owner_name: string | null
  owner_phone: string | null
}

export default function EscolaPage() {
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#22c55e')

  const [mpToken, setMpToken] = useState('')
  const [mpPublicKey, setMpPublicKey] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [hasPublicKey, setHasPublicKey] = useState(false)
  const [savingToken, setSavingToken] = useState(false)
  const [tokenMessage, setTokenMessage] = useState('')

  const [fullName, setFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState('')

  const [customDomain, setCustomDomain] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)
  const [domainMessage, setDomainMessage] = useState('')

  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [savingContact, setSavingContact] = useState(false)
  const [contactMessage, setContactMessage] = useState('')

  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collabName, setCollabName] = useState('')
  const [collabEmail, setCollabEmail] = useState('')
  const [collabPassword, setCollabPassword] = useState('')
  const [collabPermissions, setCollabPermissions] = useState<string[]>([])
  const [savingCollab, setSavingCollab] = useState(false)
  const [collabMessage, setCollabMessage] = useState('')
  const [removingCollab, setRemovingCollab] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [data, status, nome, collabRes] = await Promise.all([
        getMySchool(),
        getMpTokenStatus(),
        getMyName(),
        fetch('/api/collaborators').then(r => r.json()),
      ])
      if (data) {
        setSchool(data)
        setName(data.name)
        setDescription(data.description || '')
        setPrimaryColor(data.primary_color || '#22c55e')
        setCustomDomain(data.custom_domain || '')
        setOwnerName(data.owner_name || '')
        setOwnerPhone(data.owner_phone || '')
      }
      setHasToken(status.hasToken)
      setHasPublicKey(status.hasPublicKey || false)
      setFullName(nome || '')
      if (Array.isArray(collabRes)) setCollaborators(collabRes)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    const result = school
      ? await updateSchool({ name, description, primary_color: primaryColor })
      : await createSchool({ name, description })
    if (result?.error) {
      setMessage(`Erro: ${result.error}`)
    } else {
      setMessage('Salvo com sucesso!')
      const updated = await getMySchool()
      if (updated) setSchool(updated)
    }
    setSaving(false)
  }

  async function handleSaveToken() {
    if (!mpToken.trim()) return
    setSavingToken(true)
    setTokenMessage('')
    const result = await saveMpToken(mpToken.trim(), mpPublicKey.trim() || undefined)
    if (result?.error) {
      setTokenMessage(`Erro: ${result.error}`)
    } else {
      setTokenMessage('Token salvo com sucesso!')
      setHasToken(true)
      setMpToken('')
    }
    setSavingToken(false)
  }

  async function handleSaveName() {
    if (!fullName.trim()) return
    setSavingName(true)
    setNameMessage('')
    const result = await updateMyName(fullName.trim())
    if (result?.error) {
      setNameMessage(`Erro: ${result.error}`)
    } else {
      setNameMessage('Nome atualizado!')
    }
    setSavingName(false)
  }

  async function handleSaveDomain() {
    setSavingDomain(true)
    setDomainMessage('')
    const result = await saveCustomDomain(customDomain)
    if (result?.error) {
      setDomainMessage(`Erro: ${result.error}`)
    } else {
      setDomainMessage('Dominio salvo! Agora aponte seu DNS para o Vercel.')
      setCustomDomain(result.domain || '')
    }
    setSavingDomain(false)
  }

  async function handleSaveContact() {
    setSavingContact(true)
    setContactMessage('')
    const result = await saveOwnerContact(ownerName, ownerPhone)
    if (result?.error) {
      setContactMessage(`Erro: ${result.error}`)
    } else {
      setContactMessage('Contato salvo com sucesso!')
    }
    setSavingContact(false)
  }

  function togglePermission(perm: string) {
    setCollabPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  async function handleAddCollab() {
    if (!collabName.trim() || !collabEmail.trim() || !collabPassword.trim()) {
      setCollabMessage('Preencha nome, email e senha.')
      return
    }
    setSavingCollab(true)
    setCollabMessage('')
    const res = await fetch('/api/collaborators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: collabName.trim(),
        email: collabEmail.trim(),
        password: collabPassword.trim(),
        permissions: collabPermissions,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setCollabMessage(`Erro: ${data.error}`)
    } else {
      setCollabMessage('Colaborador adicionado com sucesso!')
      setCollaborators(prev => [...prev, data])
      setCollabName('')
      setCollabEmail('')
      setCollabPassword('')
      setCollabPermissions([])
    }
    setSavingCollab(false)
  }

  async function handleRemoveCollab(id: string) {
    setRemovingCollab(id)
    const res = await fetch(`/api/collaborators/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCollaborators(prev => prev.filter(c => c.id !== id))
    }
    setRemovingCollab(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Minha Escola</h1>
        <p className="text-gray-400 mt-1">Configure as informacoes da sua instituicao</p>
      </div>

      {/* Card Perfil */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Seu Perfil</CardTitle>
          <CardDescription className="text-gray-400">
            Seu nome aparece para os alunos nas mensagens e nos cursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Seu nome completo</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Prof. Joao Silva"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {nameMessage && (
            <p className={`text-sm ${nameMessage.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>{nameMessage}</p>
          )}
          <button onClick={handleSaveName} disabled={savingName || !fullName.trim()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
            {savingName ? 'Salvando...' : 'Salvar Nome'}
          </button>
        </CardContent>
      </Card>

      {/* Card Contato do Responsavel */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Contato do Responsavel</CardTitle>
          <CardDescription className="text-gray-400">
            Nome e telefone do responsavel pela escola. Usado pelo suporte e pelo painel master.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nome do responsavel</label>
            <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Ex: Joao Silva"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Telefone / WhatsApp</label>
            <input type="text" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="Ex: 11999999999"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {contactMessage && (
            <p className={`text-sm ${contactMessage.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>{contactMessage}</p>
          )}
          <button onClick={handleSaveContact} disabled={savingContact}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
            {savingContact ? 'Salvando...' : 'Salvar Contato'}
          </button>
        </CardContent>
      </Card>

      {/* Card Escola */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{school ? 'Editar Escola' : 'Criar Escola'}</CardTitle>
          <CardDescription className="text-gray-400">
            {school ? 'Atualize os dados da sua escola' : 'Preencha abaixo para comecar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nome da Escola *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Academia Digital Pro"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Descricao</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua escola em poucas palavras..." rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Cor Principal</label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-gray-600 bg-gray-700" />
              <span className="text-gray-400 text-sm">{primaryColor}</span>
            </div>
          </div>
          {message && (
            <p className={`text-sm ${message.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
            {saving ? 'Salvando...' : school ? 'Salvar Alteracoes' : 'Criar Escola'}
          </button>
        </CardContent>
      </Card>

      {/* Card Dominio */}
      {school && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dominio Personalizado</CardTitle>
            <CardDescription className="text-gray-400">
              Use seu proprio dominio para que seus alunos acessem sua escola diretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Seu dominio</label>
              <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="Ex: academiabiblia.com.br"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg">
              <p className="text-gray-400 text-sm">Link atual da sua vitrine:</p>
              <a href={'https://nexocollege.vercel.app/vitrine/' + school.slug}
                target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-xs font-mono break-all">
                nexocollege.vercel.app/vitrine/{school.slug}
              </a>
            </div>
            {domainMessage && (
              <p className={`text-sm ${domainMessage.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>{domainMessage}</p>
            )}
            <button onClick={handleSaveDomain} disabled={savingDomain}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
              {savingDomain ? 'Salvando...' : 'Salvar Dominio'}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Card MP */}
      {school && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Pagamentos - Mercado Pago</CardTitle>
            <CardDescription className="text-gray-400">
              Configure sua conta do Mercado Pago para receber pagamentos dos seus alunos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasToken && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-700 rounded-lg">
                <span className="text-green-400 text-sm">Token configurado</span>
                <span className="text-gray-500 text-xs ml-auto">Para trocar, cole um novo token abaixo</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Access Token do Mercado Pago</label>
              <input type="password" value={mpToken} onChange={(e) => setMpToken(e.target.value)}
                placeholder={hasToken ? 'Cole aqui para substituir o token atual' : 'APP_USR-xxxx ou TEST-xxxx'}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Public Key do Mercado Pago</label>
              {hasPublicKey && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-700 rounded-lg mb-2">
                  <span className="text-green-400 text-sm">Public Key configurada</span>
                  <span className="text-gray-500 text-xs ml-auto">Cole uma nova para substituir</span>
                </div>
              )}
              <input type="password" value={mpPublicKey} onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder={hasPublicKey ? 'Cole aqui para substituir a Public Key atual' : 'APP_USR-xxxx ou TEST-xxxx'}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
              <p className="text-xs text-gray-500">A Public Key é usada no checkout do aluno. Encontre em: Mercado Pago → Seu negócio → Configurações → Credenciais</p>
            </div>
            {tokenMessage && (
              <p className={`text-sm ${tokenMessage.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>{tokenMessage}</p>
            )}
            <button onClick={handleSaveToken} disabled={savingToken || !mpToken.trim()}
              className="w-full py-2.5 px-4 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
              {savingToken ? 'Salvando...' : 'Salvar Token'}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Card Info Tecnica */}
      {school && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Informacoes Tecnicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">ID da Escola</span>
              <span className="text-gray-300 font-mono text-xs">{school.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Slug (URL)</span>
              <span className="text-gray-300 font-mono text-xs">{school.slug}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Colaboradores */}
      {school && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Colaboradores</CardTitle>
            <CardDescription className="text-gray-400">
              Adicione até 3 pessoas para ajudar a gerenciar sua escola.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Lista de colaboradores */}
            {collaborators.length > 0 && (
              <div className="space-y-3">
                {collaborators.map(c => (
                  <div key={c.id} className="flex items-start justify-between p-3 bg-gray-700/50 border border-gray-600 rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.name}</p>
                      <p className="text-gray-400 text-xs truncate">{c.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.permissions.map(p => (
                          <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 border border-green-700/50 text-green-400">
                            {p === 'gerenciar_cursos' ? 'Cursos' : p === 'gerenciar_alunos' ? 'Alunos' : 'Financeiro'}
                          </span>
                        ))}
                        {c.permissions.length === 0 && (
                          <span className="text-xs text-gray-500">Sem permissões</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCollab(c.id)}
                      disabled={removingCollab === c.id}
                      className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-50 shrink-0 mt-1"
                    >
                      {removingCollab === c.id ? 'Removendo...' : 'Remover'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário novo colaborador */}
            {collaborators.length < 3 ? (
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-300">
                  Adicionar colaborador ({collaborators.length}/3)
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Nome completo</label>
                  <input type="text" value={collabName} onChange={e => setCollabName(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Email</label>
                  <input type="email" value={collabEmail} onChange={e => setCollabEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Senha de acesso</label>
                  <input type="text" value={collabPassword} onChange={e => setCollabPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Permissões</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { value: 'gerenciar_cursos', label: 'Gerenciar cursos e aulas' },
                      { value: 'gerenciar_alunos', label: 'Gerenciar alunos' },
                      { value: 'ver_financeiro', label: 'Ver financeiro' },
                    ].map(perm => (
                      <label key={perm.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={collabPermissions.includes(perm.value)}
                          onChange={() => togglePermission(perm.value)}
                          style={{ accentColor: '#AEEA00' }}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300 text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {collabMessage && (
                  <p className={`text-sm ${collabMessage.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
                    {collabMessage}
                  </p>
                )}
                <button onClick={handleAddCollab} disabled={savingCollab}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm">
                  {savingCollab ? 'Adicionando...' : 'Adicionar Colaborador'}
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm text-gray-400 text-center">
                  Limite de 3 colaboradores atingido. Remova um para adicionar outro.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
