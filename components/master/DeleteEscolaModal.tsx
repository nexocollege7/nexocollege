'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEscolaComSenha } from '@/app/actions/master-actions'

export default function DeleteEscolaModal({
  escolaId,
  escolaNome,
}: {
  escolaId: string
  escolaNome: string
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function abrir() {
    setAberto(true)
    setEtapa(1)
    setSenha('')
    setErro('')
  }

  function fechar() {
    if (carregando) return
    setAberto(false)
    setEtapa(1)
    setSenha('')
    setErro('')
  }

  async function confirmar() {
    if (etapa === 1) {
      setEtapa(2)
      return
    }

    if (!senha.trim()) {
      setErro('Digite sua senha para confirmar.')
      return
    }

    setCarregando(true)
    setErro('')
    const resultado = await deleteEscolaComSenha(escolaId, senha)
    setCarregando(false)

    if ('error' in resultado) {
      setErro(resultado.error)
      return
    }

    router.push('/master/escolas')
  }

  if (!aberto) {
    return (
      <button
        onClick={abrir}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid #4A1A1A',
          backgroundColor: 'transparent',
          color: '#FF5555',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Excluir escola
      </button>
    )
  }

  return (
    <>
      <div
        onClick={fechar}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 50,
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 51,
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '440px',
        }}
      >
        <h2 style={{ color: '#FF5555', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          {etapa === 1 ? `Excluir escola "${escolaNome}"` : 'Confirmar senha'}
        </h2>

        {etapa === 1 && (
          <p style={{ color: '#AAAAAA', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
            Tem certeza? Esta ação é irreversível. Todos os dados serão excluídos permanentemente.
          </p>
        )}

        {etapa === 2 && (
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="senha-master"
              style={{ display: 'block', color: '#AAAAAA', fontSize: '13px', marginBottom: '8px' }}
            >
              Digite sua senha para confirmar
            </label>
            <input
              id="senha-master"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
              disabled={carregando}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmar() }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #3A3A3A',
                backgroundColor: '#111111',
                color: '#F0F0F0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {erro && (
          <p style={{ color: '#FF5555', fontSize: '13px', margin: '0 0 16px' }}>{erro}</p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={fechar}
            disabled={carregando}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #2A2A2A',
              backgroundColor: 'transparent',
              color: '#888888',
              fontSize: '13px',
              cursor: carregando ? 'default' : 'pointer',
              opacity: carregando ? 0.6 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={carregando}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #4A1A1A',
              backgroundColor: 'transparent',
              color: '#FF5555',
              fontSize: '13px',
              fontWeight: '600',
              cursor: carregando ? 'default' : 'pointer',
              opacity: carregando ? 0.6 : 1,
            }}
          >
            {carregando
              ? 'Excluindo...'
              : etapa === 1
              ? 'Continuar'
              : 'Excluir definitivamente'}
          </button>
        </div>
      </div>
    </>
  )
}
