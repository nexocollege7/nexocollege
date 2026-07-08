'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getMyMentorshipAsGuest } from '@/app/actions/mentor-guest-actions'

export function SidebarMentorGuest() {
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [escola, setEscola] = useState<{ name: string; logo_url: string | null; primary_color: string } | null>(null)

  useEffect(() => {
    async function load() {
      const mentoria = await getMyMentorshipAsGuest()
      if (mentoria?.school) setEscola(mentoria.school)
    }
    load()
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const cor = escola?.primary_color || '#7C4DFF'

  return (
    <aside style={{
      width: collapsed ? '60px' : '240px',
      minHeight: '100vh',
      backgroundColor: '#111111',
      borderRight: '1px solid #2A2A2A',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.2s ease',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 12px',
        borderBottom: '1px solid #2A2A2A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {escola?.logo_url ? (
              <Image src={escola.logo_url} alt={escola.name} width={36} height={36} style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                {escola ? escola.name.charAt(0).toUpperCase() : '🎓'}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: cor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', display: 'block' }}>
                {escola ? escola.name : 'NexoCollege'}
              </span>
              <div style={{ fontSize: '10px', color: '#555555', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Professor convidado
              </div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555555', fontSize: '18px', padding: '4px', flexShrink: 0,
        }}>
          {collapsed ? '→' : '☰'}
        </button>
      </div>

      <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: collapsed ? '10px' : '10px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: '8px', backgroundColor: '#1A1A1A',
          color: cor, fontWeight: '600', fontSize: '14px',
          borderLeft: collapsed ? '3px solid transparent' : `3px solid ${cor}`,
        }}>
          <span style={{ fontSize: '16px' }}>🎓</span>
          {!collapsed && 'Minha Mentoria'}
        </div>
        <Link href="/dashboard/minha-mentoria" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '10px' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            color: '#AAAAAA', fontWeight: '600', fontSize: '14px',
            borderLeft: '3px solid transparent',
          }}>
            <Play size={16} />
            {!collapsed && 'Ministrar'}
          </div>
        </Link>
      </nav>

      <div style={{
        padding: collapsed ? '16px 8px' : '16px 20px',
        borderTop: '1px solid #2A2A2A',
        display: 'flex', flexDirection: 'column', gap: '8px',
        alignItems: collapsed ? 'center' : 'flex-start',
      }}>
        <button onClick={handleSair} title="Sair" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#FF5555', fontSize: '13px', padding: '6px 0',
          display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
        }}>
          <span style={{ fontSize: '14px' }}>🚪</span>
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}
