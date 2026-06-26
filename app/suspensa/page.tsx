export default function SuspensaPage() {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          backgroundColor: '#2A1A00', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px',
        }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 12px' }}>
          Escola temporariamente suspensa
        </h1>
        <p style={{ color: '#888888', fontSize: '14px', lineHeight: '1.7', margin: '0 0 32px' }}>
          O acesso à sua escola foi suspenso pelo administrador da plataforma.
          Entre em contato com o suporte para mais informações e regularizar sua situação.
        </p>
        <a href="mailto:suporte@nexocollege.com.br" style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: '10px',
          backgroundColor: '#AEEA00', color: '#0D0D0D',
          fontWeight: '700', fontSize: '14px', textDecoration: 'none',
        }}>
          Falar com o suporte
        </a>
      </div>
    </div>
  )
}
