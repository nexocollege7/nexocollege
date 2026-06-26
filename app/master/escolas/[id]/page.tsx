import { getEscolaDetalhe } from '@/app/actions/master-actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MentorModuleAcoes from '@/components/master/MentorModuleAcoes'
import DeleteEscolaModal from '@/components/master/DeleteEscolaModal'

const PLANO_LABEL: Record<string, string> = {
  starter: 'Starter',
  creator: 'Creator',
  pro: 'Pro',
  scale: 'Scale',
  enterprise: 'Enterprise',
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default async function EscolaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const escola = await getEscolaDetalhe(id)

  if (!escola) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/master/escolas"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#888888',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          ← Voltar
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            minWidth: '56px',
            borderRadius: '12px',
            backgroundColor: escola.is_active ? '#1A2E00' : '#2A1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: '700',
            color: escola.is_active ? '#AEEA00' : '#555555',
          }}
        >
          {escola.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
              {escola.name}
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '20px',
                backgroundColor: escola.is_active ? '#1A2E00' : '#2A1A1A',
                color: escola.is_active ? '#AEEA00' : '#FF5555',
              }}
            >
              {escola.is_active ? 'Ativa' : 'Suspensa'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '20px',
                backgroundColor: '#1A1040',
                color: '#7C4DFF',
              }}
            >
              {PLANO_LABEL[escola.plan ?? 'starter'] ?? escola.plan}
            </span>
          </div>
          {escola.slug && (
            <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
              /{escola.slug}
            </p>
          )}
        </div>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <p style={{ color: '#555555', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Alunos
          </p>
          <p style={{ color: '#AEEA00', fontSize: '32px', fontWeight: '700', margin: 0 }}>
            {escola.totalAlunos}
          </p>
        </div>
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <p style={{ color: '#555555', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cursos
          </p>
          <p style={{ color: '#7C4DFF', fontSize: '32px', fontWeight: '700', margin: 0 }}>
            {escola.totalCursos}
          </p>
        </div>
      </div>

      {/* Dados da escola */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <p style={{ color: '#888888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Informações
          </p>
        </div>

        {[
          { label: 'Email do dono', value: escola.ownerEmail ?? '—' },
          { label: 'Telefone', value: escola.phone ?? '—' },
          { label: 'Plano', value: PLANO_LABEL[escola.plan ?? 'starter'] ?? escola.plan ?? '—' },
          { label: 'Status', value: escola.is_active ? 'Ativa' : 'Suspensa' },
          { label: 'Cadastro', value: formatarData(escola.created_at) },
          { label: 'Slug', value: escola.slug ?? '—' },
        ].map((item, idx, arr) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: idx < arr.length - 1 ? '1px solid #1E1E1E' : 'none',
            }}
          >
            <span style={{ color: '#555555', fontSize: '13px' }}>{item.label}</span>
            <span style={{ color: '#F0F0F0', fontSize: '13px', fontWeight: '500', textAlign: 'right' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Módulo Mentor */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <p style={{ color: '#888888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Módulo Mentor
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1E1E1E' }}>
          <span style={{ color: '#555555', fontSize: '13px' }}>Status</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: escola.mentor_module ? '#1A2E00' : '#2A1A1A',
              color: escola.mentor_module ? '#AEEA00' : '#FF5555',
            }}
          >
            {escola.mentor_module ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <span style={{ color: '#555555', fontSize: '13px' }}>Ativado em</span>
          <span style={{ color: '#F0F0F0', fontSize: '13px', fontWeight: '500', textAlign: 'right' }}>
            {escola.mentor_module_activated_at ? formatarData(escola.mentor_module_activated_at) : 'Não disponível'}
          </span>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #1E1E1E' }}>
          <MentorModuleAcoes escolaId={escola.id} ativo={escola.mentor_module} />
        </div>
      </div>

      {/* Ações rápidas */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link
          href="/master/escolas"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #2A2A2A',
            backgroundColor: 'transparent',
            color: '#888888',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          ← Voltar às escolas
        </Link>
        {escola.slug && (
          <a
            href={`/vitrine/${escola.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #2A2A2A',
              backgroundColor: 'transparent',
              color: '#7C4DFF',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Ver vitrine ↗
          </a>
        )}
        <DeleteEscolaModal escolaId={escola.id} escolaNome={escola.name} />
      </div>
    </div>
  )
}
