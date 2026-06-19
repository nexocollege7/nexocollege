'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleMentorModule } from '@/app/actions/master-actions'

export default function MentorModuleAcoes({
  escolaId,
  ativo,
}: {
  escolaId: string
  ativo: boolean
}) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)

  async function handleToggle() {
    setSalvando(true)
    const result = await toggleMentorModule(escolaId, !ativo)
    setSalvando(false)
    if (result && 'error' in result) {
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
        border: ativo ? '1px solid #4A1A1A' : '1px solid #1A2E00',
        backgroundColor: 'transparent',
        color: ativo ? '#FF5555' : '#AEEA00',
        fontSize: '13px',
        fontWeight: '600',
        cursor: salvando ? 'default' : 'pointer',
        opacity: salvando ? 0.6 : 1,
      }}
    >
      {salvando ? 'Salvando...' : ativo ? 'Desativar módulo' : 'Reativar módulo'}
    </button>
  )
}
