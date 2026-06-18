'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProfessorOnlineStatus } from '@/app/actions/mentor-actions'

export function ProfessorOnlineBanner() {
  const [online, setOnline] = useState<{ mentorshipTitle: string }[]>([])

  useEffect(() => {
    async function load() {
      const status = await getProfessorOnlineStatus()
      setOnline(status)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  if (online.length === 0) return null

  return (
    <Link href="/dashboard/minhas-mentorias" style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid #FF4444',
      borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
      textDecoration: 'none',
    }}>
      <style>{`
        @keyframes po-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .po-dot { animation: po-pulse 1.4s ease-in-out infinite; }
      `}</style>
      <span className="po-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF4444', flexShrink: 0 }} />
      <span style={{ color: '#FF4444', fontWeight: '700', fontSize: '13px' }}>
        🔴 Seu professor está online agora! {online.length === 1 ? online[0].mentorshipTitle : `${online.length} mentorias`} — entrar →
      </span>
    </Link>
  )
}
