'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

  async function handlePay() {
    setLoading(true)

    if (isFree) {
      router.push('/dashboard/meus-cursos')
      return
    }

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

      // Redireciona para o checkout do Mercado Pago
      window.location.href = data.url
    } catch (error) {
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
        ? 'Acessar gratuitamente'
        : 'Matricular agora'}
    </button>
  )
}
