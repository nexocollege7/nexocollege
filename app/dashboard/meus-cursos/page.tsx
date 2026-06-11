'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMeuscursos } from '@/app/actions/aluno-actions'
import { BookOpen, GraduationCap } from 'lucide-react'

export default function MeusCursosPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getMeuscursos()
      setEnrollments(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando seus cursos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Meus Cursos</h1>
        <p className="text-gray-400 mt-1">{enrollments.length} curso{enrollments.length !== 1 ? 's' : ''} matriculado{enrollments.length !== 1 ? 's' : ''}</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-xl">
          <GraduationCap className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-gray-400 font-medium">Você não está matriculado em nenhum curso</p>
          <p className="text-gray-600 text-sm mt-1">Explore os cursos disponíveis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.courses
            const school = course?.schools
            const color = school?.primary_color || '#22c55e'

            return (
              <Link
                key={enrollment.id}
                href={`/dashboard/aprender/${course.id}`}
                className="group bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-500 transition-all hover:-translate-y-0.5"
              >
                {/* Thumbnail */}
                <div
                  className="w-full h-32 flex items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  <BookOpen className="w-10 h-10 text-white opacity-80" />
                </div>

                <div className="p-5">
                  <p className="text-xs text-gray-500 mb-1">{school?.name}</p>
                  <h3 className="text-white font-semibold group-hover:text-green-400 transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{course.description}</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>{course.total_lessons} aulas</span>
                      <span className="text-green-400 font-medium">Continuar →</span>
                    </div>
                    {/* Barra de progresso */}
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: '0%', backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
