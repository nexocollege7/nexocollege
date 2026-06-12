'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMySchool, updateSchool, createSchool, saveMpToken, getMpTokenStatus, updateMyName, getMyName, saveCustomDomain } from '@/app/actions/school-actions'

type School = {
  id: string
  name: string
  description: string | null
  primary_color: string
  slug: string
  custom_domain: string | null
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
  const [hasToken, setHasToken] = useState(false)
  const [savingToken, setSavingToken] = useState(false)
  const [tokenMessage, setTokenMessage] = useState('')

  const [fullName, setFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState('')

  const [customDomain, setCustomDomain] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)
  const [domainMessage, setDomainMessage] = useState('')

  useEffect(() => {
    async function load() {
      const [data, status, nome] = await Promise.all([
        getMySchool(),
        getMpTokenStatus(),
        getMyName(),
      ])
      if (data) {
        setSchool(data)
        setName(data.name)
        setDescription(data.description || '')
        setPrimaryColor(data.primary_color || '#22c55e')
        setCustomDomain(data.custom_domain || '')
      }
      setHasToken(status.hasToken)
      setFullName(nome || '')
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
      setMessage('✅ Salvo com sucesso!')
      const updated = await getMySchool()
      if (updated) setSchool(updated)
    }
    setSaving(false)
  }

  async function handleSaveToken() {
    if (!mpToken.trim()) return
    setSavingToken(true)
    setTokenMessage('')
    const result = await saveMpToken(mpToken.trim())
    if (result?.error) {
      setTokenMessage(`Erro: ${result.error}`)
    } else {
      setTokenMessage('✅ Token salvo com sucesso!')
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
      setNameMessage('✅ Nome atualizado!')
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
      setDomainMessage('✅ Domínio salvo! Agora aponte seu DNS para o Vercel.')
      setCustomDomain(result.domain || '')
    }
    setSavingDomain(false)
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
        <p className="text-gray-400 mt-1">Configure as informações da sua instituição</p>
      </div>

      {/* Card Perfil */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">👤 Seu Perfil</CardTitle>
          <CardDescription className="text-gray-400">
            Seu nome aparece para os alunos nas mensagens e nos cursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Seu nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Prof. João Silva"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {nameMessage && (
            <p className={`text-sm ${nameMessage.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
              {nameMessage}
            </p>
          )}
          <button onClick={handleSaveName} disabled={savingName || !fullName.trim()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
            {savingName ? 'Salvando...' : 'Salvar Nome'}
          </button>
        </CardContent>
      </Card>

      {/* Card Escola */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{school ? 'Editar Escola' : 'Criar Escola'}</CardTitle>
          <CardDescription className="text-gray-400">
            {school ? 'Atualize os dados da sua escola' : 'Você ainda não criou sua escola. Preencha abaixo para começar.'}
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
            <label className="text-sm font-medium text-gray-300">Descrição</label>
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
            {saving ? 'Salvando...' : school ? 'Salvar Alterações' : 'Criar Escola'}
          </button>
        </CardContent>
      </Card>

      {/* Card Domínio Personalizado */}
      {school && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🌐 Domínio Personalizado</CardTitle>
            <CardDescription className="text-gray-400">
              Use seu próprio domínio para que seus alunos acessem sua escola diretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Seu domínio</label>
              <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="Ex: academiabiblia.com.br"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-500">
                Após salvar, você precisará apontar seu DNS para o Vercel. Instruções serão enviadas por email.
              </p>
            </div>

            {school.custom_domain && (
              <div className="px-3 py-2 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-green-400 text-sm">✅ Domínio configurado: <strong>{school.custom_domain}</strong></p>
                <p className="text-gray-500 text-xs mt-1">
                  Link atual da vitrine:{' '}
                  <a href={`https://nexocollege.vercel.app/vitrine/${school.slug}`}
                    target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    nexocollege.vercel.app/vitrine/{school.slug}
                  </a>
                </p>
              </div>
            )}

            {!school.custom_domain && (
              <div className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg">
                <p className="text-gray-400 text-sm">📎 Link atual da sua vitrine:</p>
                <a href={`https://nexocollege.vercel.app/vitrine/${school.slug}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-xs font-mono break-all">
                  nexocollege.vercel.app/vitrine/{school.slug}
                </a>
              </div>
            )}

            {domainMessage && (
              <p className={`text-sm ${domainMessage.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
                {domainMessage}
              </p>
            )}
            <button onClick={handleSaveDomain} disabled={savingDomain}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
              {savingDomain ? 'Salvando...' : 'Salvar Domínio'}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Card MP */}
      {school && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">💳 Pagamentos — Mercado Pago</CardTitle>
            <CardDescription className="text-gray-400">
              Configure sua conta do Mercado Pago para receber pagamentos dos seus alunos diretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasToken && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-700 rounded-lg">
                <span className="text-green-400 text-sm">✅ Token configurado</span>
                <span className="text-gray-500 text-xs ml-auto">Para trocar, cole um novo token abaixo</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Access Token do Mercado Pago</label>
              <input type="password" value={mpToken} onChange={(e) => setMpToken(e.target.value)}
                placeholder={hasToken ? 'Cole aqui para substituir o token atual' : 'APP_USR-xxxx ou TEST-xxxx'}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
              <p className="text-xs text-gray-500">
                Encontre seu token em{' '}
                <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  mercadopago.com.br/developers
                </a>
                {' '}→ Suas aplicações → Credenciais
              </p>
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

      {/* Card Info Técnica */}
      {school && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Informações Técnicas</CardTitle>
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
    </div>
  )
}
