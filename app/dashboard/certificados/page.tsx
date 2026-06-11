'use client'

import { useEffect, useState } from 'react'
import { getMyCertificates } from '@/app/actions/certificate-actions'
import { getMeuscursos } from '@/app/actions/aluno-actions'
import { CertificateGenerator } from '@/components/certificate-generator'
import { Award, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CertificadosPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    async function load() {
      const [certs, enroll] = await Promise.all([
        getMyCertificates(),
        getMeuscursos(),
      ])
      setCertificates(certs)
      setEnrollments(enroll)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando certificados...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Certificados</h1>
        <p className="text-gray-400 mt-1">Gere e baixe seus certificados de conclusão</p>
      </div>

      {/* Cursos disponíveis para certificado */}
      {enrollments.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Gerar Certificado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-300">Seu nome no certificado</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {enrollments.map((enrollment) => {
              const course = enrollment.courses
              const school = course?.schools
              return (
                <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-xl">
                  <div>
                    <p className="text-white font-medium text-sm">{course?.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{school?.name}</p>
                  </div>
                  <CertificateGenerator
                    courseId={course?.id}
                    courseTitle={course?.title}
                    studentName={studentName}
                    schoolName={school?.name || 'NexoCollege'}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Certificados emitidos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Award className="w-4 h-4" />
            Certificados Emitidos ({certificates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              Nenhum certificado emitido ainda
            </p>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-xl">
                  <div>
                    <p className="text-white font-medium text-sm">{cert.courses?.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {cert.schools?.name} · emitido em {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-gray-600 text-xs font-mono mt-1">{cert.unique_code}</p>
                  </div>
                  <CertificateGenerator
                    courseId={cert.courses?.id || ''}
                    courseTitle={cert.courses?.title || ''}
                    studentName={studentName}
                    schoolName={cert.schools?.name || 'NexoCollege'}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
