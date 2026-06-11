'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  courseId: string
  courseTitle: string
  price: number
  isFree: boolean
  schoolSlug: string
  courseSlug: string
  primaryColor: string
}

export function PayButton({ courseId, courseTitle, price, isFree, schoolSlug, courseSlug, primaryColor }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handlePay() {
    setLoading(true)

    // Verifica se está logado
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Não está logado — redireciona para login com redirect de volta ao curso
      const redirect = encodeURIComponent(`/vitrine/${schoolSlug}/${courseSlug}`)
      router.push(`/vitrine/${schoolSlug}/login?redirect=${redirect}`)
      return
    }

    // Curso gratuito — matricula direto
    if (isFree) {
      try {
        const response = await fetch('/api/matricula-gratuita', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })

        const data = await response.json()

        if (data.error) {
          alert(`Erro: ${data.error}`)
          setLoading(false)
          return
        }

        router.push('/dashboard/meus-cursos')
        return
      } catch {
        alert('Erro ao processar matrícula. Tente novamente.')
        setLoading(false)
        return
      }
    }

    // Curso pago — redireciona para Mercado Pago
    try {
      const response = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseTitle,
          price,
          schoolSlug,
          courseSlug,
        }),
      })

      const data = await response.json()

      if (data.error) {
        alert(`Erro: ${data.error}`)
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      alert('Erro ao processar pagamento. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ backgroundColor: primaryColor }}
    >
      {loading
        ? 'Processando...'
        : isFree
        ? '🎁 Acessar gratuitamente'
        : 'Matricular agora'}
    </button>
  )
}
