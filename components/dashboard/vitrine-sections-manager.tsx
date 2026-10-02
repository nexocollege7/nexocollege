'use client'

import { useEffect, useState } from 'react'
import {
  listarSecoesVitrine,
  criarSecaoVitrine,
  renomearSecaoVitrine,
  excluirSecaoVitrine,
  moverSecaoVitrine,
  salvarCursosDaSecao,
  type SecaoVitrine,
  type CursoParaSecao,
} from '@/app/actions/vitrine-sections-actions'

const cartao = { background: '#111111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '24px' }
const botaoPequeno = {
  background: 'transparent', border: '1px solid #2A2A2A', color: '#CCCCCC', borderRadius: '8px',
  padding: '6px 10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
}
const botaoPrincipal = {
  background: '#AEEA00', border: 'none', color: '#0D0D0D', borderRadius: '8px',
  padding: '10px 16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

export function VitrineSectionsManager() {
  const [secoes, setSecoes] = useState<SecaoVitrine[]>([])
  const [cursos, setCursos] = useState<CursoParaSecao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [aberta, setAberta] = useState<string | null>(null)
  const [selecao, setSelecao] = useState<string[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState('')

  async function recarregar() {
    const r = await listarSecoesVitrine()
    if (r.error) setMsg('❌ ' + r.error)
    setSecoes(r.secoes)
    setCursos(r.cursos)
    setCarregando(false)
  }

  useEffect(() => { recarregar() }, [])

  async function executar(acao: () => Promise<{ error?: string }>, sucesso: string) {
    setOcupado(true)
    setMsg('')
    const r = await acao()
    setMsg(r?.error ? '❌ ' + r.error : '✅ ' + sucesso)
    await recarregar()
    setOcupado(false)
    return !r?.error
  }

  async function criar() {
    if (await executar(() => criarSecaoVitrine(novoTitulo), 'Seção criada')) setNovoTitulo('')
  }

  async function renomear(secao: SecaoVitrine) {
    const titulo = window.prompt('Novo nome da seção', secao.title)
    if (titulo === null) return
    await executar(() => renomearSecaoVitrine(secao.id, titulo), 'Seção renomeada')
  }

  async function excluir(secao: SecaoVitrine) {
    if (!window.confirm(`Excluir a seção "${secao.title}"? Os cursos não serão apagados.`)) return
    if (aberta === secao.id) setAberta(null)
    await executar(() => excluirSecaoVitrine(secao.id), 'Seção excluída')
  }

  function abrir(secao: SecaoVitrine) {
    if (aberta === secao.id) { setAberta(null); return }
    setAberta(secao.id)
    setSelecao(secao.courseIds)
  }

  function alternarCurso(id: string) {
    setSelecao((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))
  }

  async function salvarCursos(secao: SecaoVitrine) {
    if (await executar(() => salvarCursosDaSecao(secao.id, selecao), 'Cursos da seção salvos')) setAberta(null)
  }

  return (
    <div style={cartao}>
      <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>Seções da vitrine</h2>
      <p style={{ color: '#666', fontSize: '13px', margin: '0 0 16px' }}>
        Organize seus cursos em seções (ex.: Palestras, Cursos Ministeriais). Na vitrine, cada seção aparece como uma fileira.
        Cursos que não estiverem em nenhuma seção aparecem no final, em &quot;Outros cursos&quot;.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="text"
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && novoTitulo.trim() && !ocupado) criar() }}
          maxLength={60}
          placeholder="Nome da nova seção"
          style={{ flex: 1, minWidth: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D', color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={criar} disabled={ocupado || !novoTitulo.trim()} style={{ ...botaoPrincipal, opacity: ocupado || !novoTitulo.trim() ? 0.5 : 1 }}>
          + Criar seção
        </button>
      </div>

      {msg && <p style={{ color: msg.startsWith('✅') ? '#AEEA00' : '#FF5555', fontSize: '13px', margin: '0 0 12px' }}>{msg}</p>}

      {carregando ? (
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Carregando seções...</p>
      ) : secoes.length === 0 ? (
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Nenhuma seção criada. Sem seções, a vitrine mostra todos os cursos juntos, como hoje.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {secoes.map((secao, idx) => (
            <div key={secao.id} style={{ border: '1px solid #2A2A2A', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#0D0D0D' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ color: '#F0F0F0', fontWeight: 600, fontSize: '14px', margin: 0 }}>{secao.title}</p>
                  <p style={{ color: '#666', fontSize: '12px', margin: '2px 0 0' }}>
                    {secao.courseIds.length} curso{secao.courseIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button title="Mover para cima" disabled={ocupado || idx === 0} onClick={() => executar(() => moverSecaoVitrine(secao.id, 'cima'), 'Ordem atualizada')} style={{ ...botaoPequeno, opacity: ocupado || idx === 0 ? 0.3 : 1 }}>↑</button>
                  <button title="Mover para baixo" disabled={ocupado || idx === secoes.length - 1} onClick={() => executar(() => moverSecaoVitrine(secao.id, 'baixo'), 'Ordem atualizada')} style={{ ...botaoPequeno, opacity: ocupado || idx === secoes.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button title="Renomear" disabled={ocupado} onClick={() => renomear(secao)} style={botaoPequeno}>✏️</button>
                  <button title="Excluir" disabled={ocupado} onClick={() => excluir(secao)} style={botaoPequeno}>🗑</button>
                  <button disabled={ocupado} onClick={() => abrir(secao)} style={{ ...botaoPequeno, borderColor: '#AEEA00', color: '#AEEA00' }}>
                    {aberta === secao.id ? 'Fechar' : 'Escolher cursos'}
                  </button>
                </div>
              </div>

              {aberta === secao.id && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 4px' }}>
                    Marque os cursos desta seção. A ordem na vitrine segue a ordem em que você marcar. Rascunhos só aparecem depois de publicados.
                  </p>
                  {cursos.map((curso) => {
                    const marcado = selecao.includes(curso.id)
                    const ordem = selecao.indexOf(curso.id) + 1
                    return (
                      <label key={curso.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: '1px solid ' + (marcado ? '#AEEA00' : '#1e1e1e'), backgroundColor: marcado ? '#1A2E00' : 'transparent', cursor: 'pointer' }}>
                        <input type="checkbox" checked={marcado} onChange={() => alternarCurso(curso.id)} style={{ accentColor: '#AEEA00' }} />
                        <span style={{ color: '#F0F0F0', fontSize: '13px', flex: 1 }}>
                          {curso.title}
                          {curso.status !== 'published' && <span style={{ color: '#888' }}> (rascunho)</span>}
                        </span>
                        {marcado && <span style={{ color: '#AEEA00', fontSize: '12px', fontWeight: 700 }}>#{ordem}</span>}
                      </label>
                    )
                  })}
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={() => salvarCursos(secao)} disabled={ocupado} style={{ ...botaoPrincipal, opacity: ocupado ? 0.5 : 1 }}>
                      Salvar cursos da seção
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
