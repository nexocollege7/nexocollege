'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCourse, updateCourse } from '@/app/actions/course-actions'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function EditarCursoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [isFree, setIsFree] = useState(true)
  const [status, setStatus] = useState('draft')

  useEffect(() => {
    async function load() {
      const data = await getCourse(id)
      if (data) {
        setTitle(data.title)
        setDescription(data.description || '')
        setPrice(String(data.price || 0))
        setIsFree(data.is_free)
        setStatus(data.status)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const result = await updateCourse(id, {
      title, description,
      price: parseFloat(price) || 0,
      is_free: isFree,
      status,
    })

    if (result?.error) {
      setMessage(`Erro: ${result.error}`)
    } else {
      setMessage('✅ Salvo com sucesso!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando curso...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/cursos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Curso</h1>
          <p className="text-gray-400 mt-1">Atualize as informações do curso</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Informações do Curso</CardTitle>
          <CardDescription className="text-gray-400">Edite os dados abaixo e salve</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Preço</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFree(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isFree ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              >
                Gratuito
              </button>
              <button
                onClick={() => setIsFree(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isFree ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              >
                Pago
              </button>
            </div>
            {!isFree && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">R$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-40 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>

          {message && (
            <p className={`text-sm ${message.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/cursos"
              className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors text-center text-sm"
            >
              Voltar
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
