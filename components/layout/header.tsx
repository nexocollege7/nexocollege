import Link from 'next/link'
import Image from 'next/image'

interface HeaderProps {
  user: {
    email: string
    role?: string
    full_name?: string
    avatar_url?: string | null
  }
  title?: string
}

function getInitials(name: string | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

export function Header({ user, title }: HeaderProps) {
  const initials = getInitials(user.full_name, user.email)

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
      <style>{`
        @media (max-width: 768px) {
          .header-email { display: none !important; }
          .header-root { padding: 0 16px !important; }
        }
      `}</style>

      <h1 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#F0F0F0',
        margin: 0,
      }}>
        {title || 'Dashboard'}
      </h1>

      <Link href="/dashboard/perfil" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <span className="header-email" style={{ fontSize: '13px', color: '#888888' }}>
          {user.full_name || user.email}
        </span>
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.full_name || user.email}
            width={32}
            height={32}
            style={{
              borderRadius: '50%',
              objectFit: 'cover', border: '2px solid #2A2A2A',
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: '#AEEA00', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: '#0D0D0D',
            flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
      </Link>
    </header>
  )
}
