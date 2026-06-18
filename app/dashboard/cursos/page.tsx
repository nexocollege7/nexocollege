'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMyCourses, deleteCourse } from '@/app/actions/course-actions'
import { getMySchool, verificarLimiteCurso } from '@/app/actions/school-actions'
import { BookOpen, Plus, Pencil, Trash2, Lock } from 'lucide-react'

type Course = {
  id: string
  title: string
  description: string | null
  price: number
  is_free: boolean
  status: string
  total_lessons: number
  created_at: string
}

type PlanoInfo = Awaited<ReturnType<typeof verificarLimiteCurso>>

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [planoInfo, setPlanoInfo] = useState<PlanoInfo | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [data, school] = await Promise.all([
      getMyCourses(),
      getMySchool(),
    ])
    setCourses(data)

    if (school) {
      const info = await verificarLimiteCurso(school.id)
      setPlanoInfo(info)
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Tem certeza que quer excluir "${title}"?`)) return
    await deleteCourse(id)
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando cursos...</p>
      </div>
    )
  }

  const podeCriar = planoInfo?.permitido ?? true
  const labelPlano = planoInfo
    ? `Plano ${planoInfo.plano.charAt(0).toUpperCase() + planoInfo.plano.slice(1)} — ${planoInfo.usados}/${planoInfo.limite >= 999 ? '∞' : planoInfo.limite} curso${planoInfo.limite !== 1 ? 's' : ''}`
    : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cursos</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400 text-sm">{courses.length} curso{courses.length !== 1 ? 's' : ''} criado{courses.length !== 1 ? 's' : ''}</p>
            {planoInfo && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                podeCriar ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {labelPlano}
              </span>
            )}
          </div>
        </div>

        {podeCriar ? (
          <Link
            href="/dashboard/cursos/novo"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Curso
          </Link>
        ) : (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Novo Curso
            </button>
            <p className="text-xs text-red-400 text-right">Limite do plano atingido</p>
          </div>
        )}
      </div>

      {!podeCriar && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium text-sm">Limite de cursos atingido</p>
            <p className="text-red-400 text-xs mt-1">
              Seu plano <strong>{planoInfo?.plano}</strong> permite no máximo <strong>{planoInfo?.limite} curso{planoInfo?.limite !== 1 ? 's' : ''}</strong>. 
              Entre em contato com o suporte para fazer upgrade.
            </p>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-xl">
          <BookOpen className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-gray-400 font-medium">Nenhum curso criado ainda</p>
          <p className="text-gray-600 text-sm mt-1">Clique em "Novo Curso" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm leading-tight">{course.title}</h3>
                  {course.description && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{course.description}</p>
                  )}
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  course.status === 'published' ? 'bg-green-900 text-green-300' :
                  course.status === 'archived' ? 'bg-gray-700 text-gray-400' :
                  'bg-yellow-900 text-yellow-300'
                }`}>
                  {course.status === 'published' ? 'Publicado' :
                   course.status === 'archived' ? 'Arquivado' : 'Rascunho'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{course.total_lessons} aula{course.total_lessons !== 1 ? 's' : ''}</span>
                <span className="font-medium text-white">
                  {course.is_free ? 'Gratuito' : `R$ ${Number(course.price).toFixed(2)}`}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                <Link
                  href={`/dashboard/cursos/${course.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(course.id, course.title)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300 text-xs rounded-lg transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
