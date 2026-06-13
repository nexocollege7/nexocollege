'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const TERMOS_DE_USO = `TERMOS DE USO — NEXOCOLLEGE
Última atualização: junho de 2026

1. ACEITAÇÃO DOS TERMOS
Ao criar uma conta e utilizar a plataforma NexoCollege, você ("Usuário") concorda integralmente com estes Termos de Uso. Caso não concorde, não utilize a plataforma.

2. SOBRE A PLATAFORMA
A NexoCollege é uma plataforma SaaS (Software como Serviço) que permite a criação e gestão de escolas online. A NexoCollege não é responsável pelo conteúdo publicado pelos usuários em suas escolas.

3. RESPONSABILIDADES DO USUÁRIO
O Usuário é exclusivamente responsável por:
- Todo o conteúdo publicado em sua escola (textos, vídeos, imagens, materiais);
- A veracidade das informações cadastradas;
- A legalidade dos cursos e materiais oferecidos;
- O relacionamento com seus alunos, incluindo reembolsos e suporte;
- O cumprimento das leis aplicáveis, incluindo direitos autorais e proteção ao consumidor (CDC);
- A configuração correta das integrações de pagamento (Mercado Pago ou similar).

4. RESPONSABILIDADES DA NEXOCOLLEGE
A NexoCollege se compromete a:
- Manter a plataforma disponível com esforços razoáveis de continuidade;
- Proteger os dados dos usuários conforme a LGPD;
- Notificar os usuários sobre mudanças relevantes nos termos ou na plataforma.

A NexoCollege NÃO se responsabiliza por:
- Conteúdo publicado pelos usuários em suas escolas;
- Prejuízos decorrentes de uso indevido da plataforma;
- Indisponibilidade temporária por manutenção ou falhas de terceiros;
- Transações financeiras entre escolas e seus alunos.

5. PAGAMENTOS E PLANOS
- O plano Starter é gratuito e pode ser alterado ou descontinuado mediante aviso prévio de 30 dias;
- Os planos pagos (Pro e Enterprise) são cobrados anualmente e não são reembolsáveis após o uso;
- A NexoCollege reserva o direito de alterar preços com aviso prévio de 30 dias;
- O não pagamento pode resultar na suspensão do acesso aos recursos do plano.

6. PROPRIEDADE INTELECTUAL
- O conteúdo criado pelo Usuário permanece de sua propriedade;
- A marca, código, design e tecnologia da NexoCollege são de propriedade exclusiva da plataforma;
- É proibido copiar, reproduzir ou distribuir qualquer parte da plataforma sem autorização.

7. SUSPENSÃO E CANCELAMENTO
A NexoCollege reserva o direito de suspender ou encerrar contas que:
- Violem estes Termos de Uso;
- Publiquem conteúdo ilegal, ofensivo ou que viole direitos de terceiros;
- Utilizem a plataforma para fins fraudulentos.

8. LIMITAÇÃO DE RESPONSABILIDADE
Em nenhuma hipótese a NexoCollege será responsável por danos indiretos, incidentais, especiais ou consequentes, incluindo perda de lucros, dados ou receita, mesmo que alertada sobre tal possibilidade.

9. LEGISLAÇÃO APLICÁVEL
Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias.

10. CONTATO
Para dúvidas sobre estes Termos: contato@nexocollege.com.br`

const POLITICA_PRIVACIDADE = `POLÍTICA DE PRIVACIDADE — NEXOCOLLEGE
Última atualização: junho de 2026

1. INTRODUÇÃO
A NexoCollege está comprometida com a proteção dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

2. DADOS COLETADOS
Coletamos os seguintes dados:
- Nome completo e endereço de e-mail (cadastro);
- Nome da escola e informações de configuração;
- Dados de uso e navegação na plataforma (logs, acessos);
- Dados de pagamento (processados pelo Mercado Pago — não armazenamos dados de cartão).

3. FINALIDADE DO TRATAMENTO
Seus dados são utilizados para:
- Criação e manutenção da sua conta;
- Prestação dos serviços contratados;
- Comunicação sobre atualizações, novidades e suporte;
- Cumprimento de obrigações legais.

4. COMPARTILHAMENTO DE DADOS
Seus dados podem ser compartilhados com:
- Mercado Pago: para processamento de pagamentos;
- Supabase: para armazenamento seguro dos dados;
- Vercel: para hospedagem da plataforma;
- Autoridades competentes, quando exigido por lei.
A NexoCollege não vende dados pessoais a terceiros.

5. ARMAZENAMENTO E SEGURANÇA
- Os dados são armazenados em servidores seguros com criptografia;
- Utilizamos autenticação segura via Supabase Auth;
- O acesso aos dados é restrito por políticas de segurança (RLS);
- Em caso de incidente de segurança, notificaremos os usuários afetados.

6. DIREITOS DO TITULAR
Conforme a LGPD, você tem direito a:
- Confirmar a existência de tratamento dos seus dados;
- Acessar, corrigir ou atualizar seus dados;
- Solicitar a anonimização ou exclusão dos dados;
- Revogar o consentimento a qualquer momento;
- Portabilidade dos dados mediante solicitação.
Para exercer seus direitos: contato@nexocollege.com.br

7. COOKIES
Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e sessão). Não utilizamos cookies de rastreamento ou publicidade.

8. RETENÇÃO DE DADOS
- Dados de conta: mantidos enquanto a conta estiver ativa;
- Após cancelamento: dados excluídos em até 90 dias, salvo obrigação legal;
- Logs de acesso: mantidos por 6 meses conforme Marco Civil da Internet.

9. MENORES DE IDADE
A plataforma NexoCollege não é destinada a menores de 18 anos sem consentimento dos responsáveis.

10. ALTERAÇÕES NESTA POLÍTICA
Podemos atualizar esta Política periodicamente. Notificaremos os usuários por e-mail sobre mudanças relevantes.

11. ENCARREGADO DE DADOS (DPO)
Responsável pelo tratamento de dados: contato@nexocollege.com.br

12. LEGISLAÇÃO E FORO
Esta Política é regida pela legislação brasileira, em especial a LGPD. Foro: Comarca de São Paulo/SP.`

function Modal({ titulo, conteudo, onFechar }: { titulo: string; conteudo: string; onFechar: () => void }) {
  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2A2A2A',
          width: '100%', maxWidth: '640px', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #2A2A2A',
        }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: 0 }}>{titulo}</h2>
          <button
            onClick={onFechar}
            style={{
              background: 'none', border: 'none', color: '#888888',
              fontSize: '20px', cursor: 'pointer', padding: '0 4px',
            }}
          >✕</button>
        </div>
        {/* Conteúdo */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          <pre style={{
            color: '#CCCCCC', fontSize: '13px', lineHeight: '1.8',
            whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', margin: 0,
          }}>
            {conteudo}
          </pre>
        </div>
        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A2A', textAlign: 'right' }}>
          <button
            onClick={onFechar}
            style={{
              backgroundColor: '#AEEA00', color: '#0D0D0D', border: 'none',
              borderRadius: '8px', padding: '10px 24px', fontWeight: '700',
              fontSize: '14px', cursor: 'pointer',
            }}
          >
            Entendi e fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState<'termos' | 'privacidade' | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const planoParam = searchParams.get('plano')
  const supabase = createClient()

  async function handleCadastro() {
    setLoading(true)
    setError('')

    if (!nome || !email || !password || !nomeEscola) {
      setError('Preencha todos os campos.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    if (!termosAceitos) {
      setError('Voce precisa aceitar os termos de uso para continuar.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/register-school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password, nomeEscola, termosAceitos }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Conta criada! Faca login manualmente.')
      setLoading(false)
      return
    }

    // Se veio com plano pago, ir para checkout
    const planosPagos = ['creator', 'pro', 'scale']
    if (planoParam && planosPagos.includes(planoParam)) {
      try {
        const res = await fetch('/api/criar-preferencia-upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plano: planoParam }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
          return
        }
      } catch {
        // Se falhar o checkout, vai para o dashboard normalmente
      }
    }
    router.push('/dashboard')
  }

  return (
    <>
      {modalAberto === 'termos' && (
        <Modal titulo="Termos de Uso" conteudo={TERMOS_DE_USO} onFechar={() => setModalAberto(null)} />
      )}
      {modalAberto === 'privacidade' && (
        <Modal titulo="Política de Privacidade" conteudo={POLITICA_PRIVACIDADE} onFechar={() => setModalAberto(null)} />
      )}

      <div style={{
        minHeight: '100vh', backgroundColor: '#0D0D0D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img src="/logo.png" alt="NexoCollege" style={{ height: '48px', mixBlendMode: 'lighten', display: 'inline-block', marginBottom: '12px' }} />
            <p style={{ color: '#888888', fontSize: '15px', margin: 0 }}>
              Crie sua escola online gratuitamente
            </p>
          </div>

          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '36px', border: '1px solid #2A2A2A' }}>

            {error && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Nome completo</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome"
                  style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                  style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caracteres"
                  style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '4px' }}>
                <p style={{ fontSize: '12px', color: '#666666', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DADOS DA SUA ESCOLA</p>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CCCCCC', marginBottom: '8px' }}>Nome da sua escola</label>
                  <input type="text" value={nomeEscola} onChange={(e) => setNomeEscola(e.target.value)} placeholder="Ex: Academia Biblica Online"
                    style={{ width: '100%', backgroundColor: '#111111', border: '1px solid #7C4DFF', borderRadius: '8px', padding: '12px 16px', color: '#FFFFFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: '12px', color: '#666666', marginTop: '6px' }}>Este sera o nome da sua plataforma para os alunos.</p>
                </div>
              </div>

              {/* Termos */}
              <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '16px' }}>
                <p style={{ color: '#888888', fontSize: '12px', margin: '0 0 12px', lineHeight: '1.6' }}>
                  Ao criar sua escola no NexoCollege você concorda com nossos documentos abaixo. Seus dados são protegidos conforme a LGPD (Lei 13.709/2018).
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={() => setModalAberto('termos')}
                    style={{
                      backgroundColor: '#1A1A1A', border: '1px solid #AEEA00', color: '#AEEA00',
                      borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    📄 Ler Termos de Uso
                  </button>
                  <button
                    onClick={() => setModalAberto('privacidade')}
                    style={{
                      backgroundColor: '#1A1A1A', border: '1px solid #7C4DFF', color: '#7C4DFF',
                      borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    🔒 Ler Política de Privacidade
                  </button>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={termosAceitos}
                    onChange={(e) => setTermosAceitos(e.target.checked)}
                    style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#AEEA00', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ color: '#CCCCCC', fontSize: '13px', lineHeight: '1.5' }}>
                    Li e aceito os{' '}
                    <span
                      onClick={() => setModalAberto('termos')}
                      style={{ color: '#AEEA00', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      termos de uso
                    </span>
                    {' '}e a{' '}
                    <span
                      onClick={() => setModalAberto('privacidade')}
                      style={{ color: '#7C4DFF', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      política de privacidade
                    </span>
                    {' '}do NexoCollege.
                  </span>
                </label>
              </div>

              <button onClick={handleCadastro} disabled={loading || !termosAceitos}
                style={{
                  width: '100%',
                  backgroundColor: loading || !termosAceitos ? '#333333' : '#AEEA00',
                  color: loading || !termosAceitos ? '#666666' : '#0D0D0D',
                  fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '8px',
                  padding: '14px', cursor: loading || !termosAceitos ? 'not-allowed' : 'pointer', marginTop: '4px',
                }}
              >
                {loading ? 'Criando sua escola...' : 'Criar minha escola gratis'}
              </button>

            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ color: '#666666', fontSize: '14px' }}>
                Ja tem conta?{' '}
                <Link href="/login" style={{ color: '#AEEA00', fontWeight: '600', textDecoration: 'none' }}>Entrar</Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
