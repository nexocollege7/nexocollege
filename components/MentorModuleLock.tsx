import Link from 'next/link'
import { Lock } from 'lucide-react'

export function MentorModuleLock() {
  return (
    <div style={{
      background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.3)',
      borderRadius: '12px', padding: '40px 24px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
      maxWidth: '480px', margin: '60px auto',
    }}>
      <Lock size={24} color="#7C4DFF" />
      <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: 0 }}>
        O Módulo Mentor não está ativo nesta escola
      </p>
      <Link href="/dashboard/mentor-module" style={{
        display: 'inline-block', background: '#7C4DFF', color: '#fff', borderRadius: '8px',
        padding: '10px 24px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
      }}>
        Conheça o Módulo Mentor
      </Link>
    </div>
  )
}
