'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getCourseWithLessons, getLessonProgress, markLessonComplete } from '@/app/actions/aluno-actions'
import { CheckCircle, Circle, PlayCircle, ChevronDown, ChevronRight } from 'lucide-react'

export default function AprenderPage() {
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [marking, setMarking] = useState(false)

  async function load() {
    const data = await getCourseWithLessons(courseId)
    setCourse(data)

    if (data?.modules?.length > 0) {
      const firstModule = data.modules.sort((a: any, b: any) => a.position - b.position)[0]
      setExpandedModules([firstModule.id])
      if (firstModule.lessons?.length > 0) {
        const firstLesson = firstModule.lessons.sort((a: any, b: any) => a.position - b.position)[0]
        setSelectedLesson(firstLesson)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [courseId])

  function isCompleted(lessonId: string) {
    return progress.some(p => p.lesson_id === lessonId && p.is_completed)
  }

  function toggleModule(moduleId: string) {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  async function handleMarkComplete() {
    if (!selectedLesson) return
    setMarking(true)
    await markLessonComplete(selectedLesson.id, courseId)
    setProgress(prev => [...prev.filter(p => p.lesson_id !== selectedLesson.id), {
      lesson_id: selectedLesson.id,
      is_completed: true
    }])
    setMarking(false)
  }

  function getEmbedUrl(url: string) {
    if (!url) return null
    if (url.includes('youtube.com/watch')) {
      const id = new URL(url).searchParams.get('v')
      return `https://www.youtube.com/embed/${id}`
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0]
      return `https://www.youtube.com/embed/${id}`
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1]
      return `https://player.vimeo.com/video/${id}`
    }
    return url
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando curso...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Curso não encontrado.</p>
      </div>
    )
  }

  const color = course.schools?.primary_color || '#22c55e'
  const sortedModules = (course.modules || []).sort((a: any, b: any) => a.position - b.position)

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Player principal */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div>
          <p className="text-gray-400 text-sm">{course.schools?.name}</p>
          <h1 className="text-xl font-bold text-white">{course.title}</h1>
        </div>

        {selectedLesson ? (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">{selectedLesson.title}</h2>

            {/* Player de vídeo */}
            {selectedLesson.video_url ? (
              <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={getEmbedUrl(selectedLesson.video_url) || ''}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <div
                className="w-full rounded-xl flex items-center justify-center h-48"
                style={{ backgroundColor: color + '22' }}
              >
                <div className="text-center">
                  <PlayCircle className="w-12 h-12 mx-auto mb-2" style={{ color }} />
                  <p className="text-gray-400 text-sm">Nenhum vídeo nesta aula</p>
                </div>
              </div>
            )}

            {/* Conteúdo texto */}
            {selectedLesson.content && (
              <div className="bg-gray-800 rounded-xl p-5 text-gray-300 text-sm leading-relaxed">
                {selectedLesson.content}
              </div>
            )}

            {/* Botão concluir */}
            <button
              onClick={handleMarkComplete}
              disabled={marking || isCompleted(selectedLesson.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isCompleted(selectedLesson.id)
                  ? 'bg-green-900 text-green-300 cursor-default'
                  : 'text-white hover:opacity-90'
              }`}
              style={!isCompleted(selectedLesson.id) ? { backgroundColor: color } : {}}
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleted(selectedLesson.id) ? 'Aula concluída!' : marking ? 'Salvando...' : 'Marcar como concluída'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400">Selecione uma aula para começar</p>
          </div>
        )}
      </div>

      {/* Sidebar de módulos e aulas */}
      <div className="w-72 shrink-0 bg-gray-800 border border-gray-700 rounded-xl overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <p className="text-white font-semibold text-sm">Conteúdo do curso</p>
          <p className="text-gray-400 text-xs mt-0.5">{course.total_lessons} aulas</p>
        </div>

        {sortedModules.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">Nenhum módulo ainda</p>
          </div>
        ) : (
          sortedModules.map((module: any) => {
            const isExpanded = expandedModules.includes(module.id)
            const sortedLessons = (module.lessons || []).sort((a: any, b: any) => a.position - b.position)

            return (
              <div key={module.id} className="border-b border-gray-700 last:border-0">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-white text-sm font-medium">{module.title}</span>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  }
                </button>

                {isExpanded && (
                  <div className="pb-2">
                    {sortedLessons.length === 0 ? (
                      <p className="text-gray-500 text-xs px-4 pb-2">Nenhuma aula ainda</p>
                    ) : (
                      sortedLessons.map((lesson: any) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-700 transition-colors ${
                            selectedLesson?.id === lesson.id ? 'bg-gray-700' : ''
                          }`}
                        >
                          {isCompleted(lesson.id)
                            ? <CheckCircle className="w-4 h-4 shrink-0 text-green-400" />
                            : <Circle className="w-4 h-4 shrink-0 text-gray-500" />
                          }
                          <span className={`text-xs ${
                            selectedLesson?.id === lesson.id ? 'text-white' : 'text-gray-400'
                          }`}>
                            {lesson.title}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
