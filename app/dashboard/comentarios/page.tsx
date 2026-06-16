import { getAllSchoolComments } from '@/app/actions/comment-actions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ComentariosPage() {
  const comments = await getAllSchoolComments()

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Comentários de Aulas
        </h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          {comments.length} comentário{comments.length !== 1 ? 's' : ''} no total
        </p>
      </div>

      {comments.length === 0 ? (
        <div style={{
          backgroundColor: '#111111', border: '1px solid #2A2A2A',
          borderRadius: '16px', padding: '48px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>💬</p>
          <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>
            Nenhum comentário ainda. Os alunos poderão comentar nas aulas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map(c => (
            <div key={c.id} style={{
              backgroundColor: '#111111', border: '1px solid #2A2A2A',
              borderRadius: '12px', padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#AEEA00', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700', color: '#0D0D0D', flexShrink: 0,
                  }}>
                    {c.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                      {c.user_name}
                    </p>
                    <p style={{ color: '#555555', fontSize: '12px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Aula: <span style={{ color: '#888888' }}>{c.lesson_title}</span>
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#444444', flexShrink: 0 }}>
                  {formatDate(c.created_at)}
                </span>
              </div>
              <p style={{
                fontSize: '13px', color: '#CCCCCC', margin: 0,
                lineHeight: '1.6', whiteSpace: 'pre-wrap',
                paddingLeft: '42px',
              }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
