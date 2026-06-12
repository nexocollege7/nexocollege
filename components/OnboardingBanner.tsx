'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Props {
  nomeEscola: string
  slug: string
  nomeUsuario: string
}

export default function OnboardingBanner({ nomeEscola, slug, nomeUsuario }: Props) {
  const [copiado, setCopiado] = useState(false)
  const linkPlataforma = 'https://nexocollege.vercel.app/vitrine/' + slug

  function copiarLink() {
    navigator.clipboard.writeText(linkPlataforma)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 8px' }}>
          Bem-vindo, {nomeUsuario.split(' ')[0]}!
        </h1>
        <p style={{ color: '#AAAAAA', fontSize: '15px', margin: '0 0 24px', maxWidth: '500px' }}>
          Sua escola <strong style={{ color: '#FFFFFF' }}>{nomeEscola}</strong> foi criada com sucesso. Siga os passos abaixo para comecar a receber alunos.
        </p>
        <div style={{ backgroundColor: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', maxWidth: '520px' }}>
          <div>
            <p style={{ color: '#666666', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase' }}>Link da sua plataforma</p>
            <p style={{ color: '#AEEA00', fontSize: '14px', fontWeight: '600', margin: 0 }}>{linkPlataforma}</p>
          </div>
          <button onClick={copiarLink} style={{ backgroundColor: copiado ? '#1A2E00' : '#1A1A1A', border: '1px solid #333333', color: copiado ? '#AEEA00' : '#CCCCCC', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {copiado ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>

      <div>
        <h2 style={{ color: '#888888', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>Primeiros passos</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: '#7C4DFF22', border: '1px solid #7C4DFF44', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#7C4DFF' }}>1</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: '0 0 4px' }}>Configure sua escola</p>
              <p style={{ color: '#666666', fontSize: '13px', margin: 0 }}>Adicione logo, cores e informacoes da sua escola.</p>
            </div>
            <Link href="/dashboard/escola" style={{ backgroundColor: '#AEEA00', color: '#0D0D0D', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}>Configurar agora</Link>
          </div>
          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: '#7C4DFF22', border: '1px solid #7C4DFF44', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#7C4DFF' }}>2</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: '0 0 4px' }}>Crie seu primeiro curso</p>
              <p style={{ color: '#666666', fontSize: '13px', margin: 0 }}>Adicione modulos, aulas e materiais para seus alunos.</p>
            </div>
            <Link href="/dashboard/cursos/novo" style={{ backgroundColor: '#AEEA00', color: '#0D0D0D', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}>Criar curso</Link>
          </div>
          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: '#7C4DFF22', border: '1px solid #7C4DFF44', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#7C4DFF' }}>3</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: '0 0 4px' }}>Compartilhe sua plataforma</p>
              <p style={{ color: '#666666', fontSize: '13px', margin: 0 }}>Envie o link da sua vitrine para seus alunos se matricularem.</p>
              <a href={linkPlataforma} target="_blank" rel="noreferrer" style={{ color: '#AEEA00', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>Ver minha vitrine</a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingBottom: '16px' }}>
        <Link href="/dashboard/cursos" style={{ color: '#555555', fontSize: '13px', textDecoration: 'none' }}>Pular e ir para o painel</Link>
      </div>
    </div>
  )
}