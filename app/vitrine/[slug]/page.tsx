import { getSchoolBySlug, getPublishedCourses } from '@/app/actions/vitrine-actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, GraduationCap } from 'lucide-react'

export default async function VitrinePage({ params }: { params: { slug: string } }) {
  const school = await getSchoolBySlug(params.slug)
  if (!school) notFound()

  const courses = await getPublishedCourses(school.id)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header da escola */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: school.primary_color || '#22c55e' }}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">{school.name}</h1>
            {school.description && (
              <p className="text-gray-400 text-sm">{school.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Cursos disponíveis</h2>
          <p className="text-gray-400 mt-1">{courses.length} curso{courses.length !== 1 ? 's' : ''} publicado{courses.length !== 1 ? 's' : ''}</p>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-700 rounded-xl">
            <BookOpen className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-400">Nenhum curso disponível ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/vitrine/${params.slug}/${course.slug}`}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: school.primary_color || '#22c55e' }}
                  >
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-900 text-green-300">
                    Publicado
                  </span>
                </div>
                <h3 className="text-white font-semibold mt-3 group-hover:text-green-400 transition-colors">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{course.description}</p>
                )}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-sm text-gray-400">{course.total_lessons} aulas</span>
                  <span className="font-bold text-white">
                    {course.is_free ? (
                      <span className="text-green-400">Gratuito</span>
                    ) : (
                      `R$ ${Number(course.price).toFixed(2)}`
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-gray-600 text-sm">
            Powered by <span className="text-gray-400 font-medium">NexoCollege</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
