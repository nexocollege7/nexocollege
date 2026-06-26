'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { suspenderEscola, reativarEscola } from '@/app/actions/master-actions'

export default function SuspenderEscolaAcoes({
  escolaId,
  suspensa,
}: {
  escolaId: string
  suspensa: boolean
}) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)

  async function handleToggle() {
    setSalvando(true)
    const result = suspensa
      ? await reativarEscola(escolaId)
      : await suspenderEscola(escolaId)
    setSalvando(false)
    if ('error' in result) {
      alert(result.error)
      return
    }
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={salvando}
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        border: suspensa ? '1px solid #1A2E00' : '1px solid #4A3500',
        backgroundColor: 'transparent',
        color: suspensa ? '#AEEA00' : '#FFAA00',
        fontSize: '13px',
        fontWeight: '600',
        cursor: salvando ? 'default' : 'pointer',
        opacity: salvando ? 0.6 : 1,
      }}
    >
      {salvando ? 'Salvando...' : suspensa ? 'Reativar escola' : 'Suspender escola'}
    </button>
  )
}
