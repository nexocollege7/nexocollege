'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMySchool, updateSchool, createSchool } from '@/app/actions/school-actions'

type School = {
  id: string
  name: string
  description: string | null
  primary_color: string
  slug: string
}

export default function EscolaPage() {
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#22c55e')

  useEffect(() => {
    async function load() {
      const data = await getMySchool()
      if (data) {
        setSchool(data)
        setName(data.name)
        setDescription(data.description || '')
        setPrimaryColor(data.primary_color || '#22c55e')
      }
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

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            {school ? 'Editar Escola' : 'Criar Escola'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {school
              ? 'Atualize os dados da sua escola'
              : 'Você ainda não criou sua escola. Preencha abaixo para começar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Nome da Escola *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Academia Digital Pro"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua escola em poucas palavras..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Cor Principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-gray-600 bg-gray-700"
              />
              <span className="text-gray-400 text-sm">{primaryColor}</span>
            </div>
          </div>

          {message && (
            <p className={`text-sm ${message.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : school ? 'Salvar Alterações' : 'Criar Escola'}
          </button>

        </CardContent>
      </Card>

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
