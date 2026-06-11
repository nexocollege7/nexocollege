'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMyCourses, deleteCourse } from '@/app/actions/course-actions'
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

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

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await getMyCourses()
    setCourses(data)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cursos</h1>
          <p className="text-gray-400 mt-1">{courses.length} curso{courses.length !== 1 ? 's' : ''} criado{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/dashboard/cursos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Curso
        </Link>
      </div>

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
