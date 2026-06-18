'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { enrollFreeMentorship } from '@/app/actions/mentor-actions'

type Props = {
  cohortId: string
  isFree: boolean
  schoolSlug: string
  mentorshipSlug: string
  primaryColor: string
}

export function MentoriaPayButton({ cohortId, isFree, schoolSlug, mentorshipSlug, primaryColor }: Props) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleInscrever() {
    setLoading(true)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const redirect = encodeURIComponent(`/vitrine/${schoolSlug}/mentorias/${mentorshipSlug}`)
      router.push(`/vitrine/${schoolSlug}/login?redirect=${redirect}`)
      return
    }

    if (isFree) {
      const result = await enrollFreeMentorship(cohortId)
      if (result?.error) {
        setErro(result.error)
        setLoading(false)
        return
      }
      router.push('/dashboard/minhas-mentorias')
      return
    }

    try {
      const response = await fetch('/api/pagamento-mentoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortId }),
      })
      const data = await response.json()
      if (data.error) {
        setErro(data.error)
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setErro('Erro ao processar pagamento. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleInscrever}
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
          backgroundColor: loading ? '#555' : primaryColor,
          color: '#0D0D0D', fontWeight: '700', fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Processando...' : isFree ? '🎁 Inscrever-se gratuitamente' : 'Inscrever-se nesta turma'}
      </button>
      {erro && <p style={{ color: '#FF5555', fontSize: '12px', margin: '8px 0 0' }}>{erro}</p>}
    </div>
  )
}
