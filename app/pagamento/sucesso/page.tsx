'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, BookOpen, Award } from 'lucide-react'

export default function PagamentoSucessoPage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('course')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">

        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white">Pagamento aprovado!</h1>
          <p className="text-gray-400 mt-2">
            Sua matrícula foi confirmada. Você já pode acessar o curso.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Acesso ao curso</p>
              <p className="text-gray-400 text-xs">Disponível imediatamente</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Certificado</p>
              <p className="text-gray-400 text-xs">Disponível ao concluir o curso</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard/meus-cursos"
            className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            Ir para Meus Cursos
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-sm"
          >
            Voltar ao Dashboard
          </Link>
        </div>

        <p className="text-gray-600 text-xs">
          Redirecionando para seus cursos em {countdown}s...
        </p>

      </div>
    </div>
  )
}
