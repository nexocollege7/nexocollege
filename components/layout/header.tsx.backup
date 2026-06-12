interface HeaderProps {
  user: {
    email: string
    role?: string
  }
  title?: string
}

export function Header({ user, title }: HeaderProps) {
  return (
    <header style={{
      height: '64px',
      backgroundColor: '#111111',
      borderBottom: '1px solid #2A2A2A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <h1 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#F0F0F0',
        margin: 0,
      }}>
        {title || 'Dashboard'}
      </h1>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '13px', color: '#888888' }}>
          {user.email}
        </span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#AEEA00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '700',
          color: '#0D0D0D',
        }}>
          {user.email.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}