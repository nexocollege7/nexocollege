'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCourse } from '@/app/actions/course-actions'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NovoCursoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [isFree, setIsFree] = useState(true)

  async function handleSave() {
    if (!title.trim()) { setMessage('O título é obrigatório.'); return }
    setSaving(true)
    setMessage('')

    const result = await createCourse({
      title,
      description,
      price: parseFloat(price) || 0,
      is_free: isFree,
    })

    if (result?.error) {
      setMessage(`Erro: ${result.error}`)
      setSaving(false)
    } else {
      router.push('/dashboard/cursos')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/cursos"
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Curso</h1>
          <p className="text-gray-400 mt-1">Preencha as informações básicas do curso</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Informações do Curso</CardTitle>
          <CardDescription className="text-gray-400">
            Você poderá adicionar módulos e aulas depois de criar o curso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Marketing Digital do Zero"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que o aluno vai aprender neste curso?"
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                  placeholder="97,00"
                  min="0"
                  step="0.01"
                  className="w-40 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
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
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            >
              {saving ? 'Criando...' : 'Criar Curso'}
            </button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
