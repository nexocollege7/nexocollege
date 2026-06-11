'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarEscola } from '@/app/actions/master-actions'

export default function NovaEscolaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    descricao: '',
    plano: 'starter',
  })

  async function handleSubmit() {
    if (!form.nome || !form.email || !form.senha) {
      setErro('Nome, email e senha são obrigatórios.')
      return
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setErro('')
    const result = await criarEscola(form)
    setLoading(false)
    if (result.error) {
      setErro(result.error)
      return
    }
    setSucesso(true)
    setTimeout(() => router.push('/master/escolas'), 2000)
  }

  const input = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
    color: '#F0F0F0', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  }

  if (sucesso) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>✅</p>
        <p style={{ color: '#AEEA00', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>
          Escola criada com sucesso!
        </p>
        <p style={{ color: '#888888', fontSize: '14px' }}>
          Redirecionando para a lista de escolas...
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/master/escolas')}
          style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
            Nova Escola
          </h1>
          <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>
            Cadastre uma nova escola na plataforma
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
        borderRadius: '12px', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>

        {/* Dados da escola */}
        <div>
          <p style={{ color: '#AEEA00', fontSize: '12px', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
            Dados da Escola
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Nome da Escola *
              </label>
              <input style={input} placeholder="Ex: Academia do Empreendedor"
                value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Descrição
              </label>
              <textarea style={{ ...input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Breve descrição da escola"
                value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Plano
              </label>
              <select style={input} value={form.plano}
                onChange={(e) => setForm({ ...form, plano: e.target.value })}>
                <option value="starter">Starter — até 3 cursos</option>
                <option value="pro">Pro — cursos ilimitados</option>
                <option value="enterprise">Enterprise — personalizado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Acesso do professor */}
        <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '20px' }}>
          <p style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
            Acesso do Professor
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Email *
              </label>
              <input style={input} type="email" placeholder="professor@escola.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Senha inicial *
              </label>
              <input style={input} type="password" placeholder="Mínimo 6 caracteres"
                value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
              <p style={{ color: '#555555', fontSize: '12px', margin: '4px 0 0' }}>
                O professor pode alterar a senha após o primeiro acesso.
              </p>
            </div>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{
            backgroundColor: '#2A1A1A', border: '1px solid #FF5555',
            borderRadius: '8px', padding: '12px 16px',
          }}>
            <p style={{ color: '#FF5555', fontSize: '13px', margin: 0 }}>⚠️ {erro}</p>
          </div>
        )}

        {/* Botões */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => router.push('/master/escolas')}
            style={{
              padding: '10px 20px', borderRadius: '8px',
              border: '1px solid #2A2A2A', backgroundColor: 'transparent',
              color: '#888888', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              backgroundColor: '#AEEA00', color: '#0D0D0D',
              fontWeight: '700', fontSize: '14px', cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Criando...' : 'Criar Escola'}
          </button>
        </div>
      </div>
    </div>
  )
}