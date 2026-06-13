'use client'

import { useEffect, useState } from 'react'
import { getEnrollments, revokeEnrollment, enrollStudentByEmail } from '@/app/actions/matricula-actions'
import { getMyCourses } from '@/app/actions/course-actions'
import { Users, UserPlus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AlunosPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [courseId, setCourseId] = useState('')

  async function load() {
    const [e, c] = await Promise.all([getEnrollments(), getMyCourses()])
    setEnrollments(e)
    setCourses(c)
    if (c.length > 0 && !courseId) setCourseId(c[0].id)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleEnroll() {
    if (!email.trim() || !courseId) { setMessage('Preencha o email e selecione um curso'); return }
    setSaving(true)
    setMessage('')
    const result = await enrollStudentByEmail(email, courseId)
    if (result?.error) {
      setMessage(`Erro: ${result.error}`)
    } else {
      setMessage('✅ Aluno matriculado com sucesso!')
      setEmail('')
      load()
    }
    setSaving(false)
  }

  async function handleRevoke(enrollmentId: string) {
    if (!confirm('Revogar acesso deste aluno?')) return
    await revokeEnrollment(enrollmentId)
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando alunos...</p>
      </div>
    )
  }

  const active = enrollments.filter(e => e.status === 'active')
  const canceled = enrollments.filter(e => e.status === 'canceled')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Alunos</h1>
        <p className="text-gray-400 mt-1">{active.length} aluno{active.length !== 1 ? 's' : ''} ativo{active.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Matricular novo aluno */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Matricular Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@aluno.com"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button
              onClick={handleEnroll}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {saving ? 'Matriculando...' : 'Matricular'}
            </button>
          </div>
          {message && (
            <p className={`text-sm ${message.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de matrículas ativas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Matrículas Ativas ({active.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Nenhum aluno matriculado ainda</p>
          ) : (
            <div className="space-y-2">
              {active.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {enrollment.users?.full_name || 'Sem nome'}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {enrollment.courses?.title} · matriculado em {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(enrollment.id)}
                    className="p-1.5 hover:bg-red-900 hover:text-red-300 text-gray-400 rounded-lg transition-colors"
                    title="Revogar acesso"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrículas canceladas */}
      {canceled.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base text-gray-500">
              Matrículas Canceladas ({canceled.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {canceled.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg opacity-50"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {enrollment.users?.full_name || 'Sem nome'}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {enrollment.courses?.title}
                    </p>
                  </div>
                  <span className="text-xs text-red-400">Cancelado</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
