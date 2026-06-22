'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateAvatarUrl, ensureAvatarBucket, getMyProfileFull } from '@/app/actions/profile-actions'
import { useRouter } from 'next/navigation'

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return email ? email[0].toUpperCase() : '?'
}

export default function PerfilPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    ensureAvatarBucket()
    getMyProfileFull().then(setProfile)
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsg('Arquivo muito grande. Máximo: 5 MB'); return }
    setMsg('')
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Sessão expirada. Faça login novamente.'); setUploading(false); return }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (upErr) { setMsg('Erro ao enviar imagem: ' + upErr.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`

    const result = await updateAvatarUrl(publicUrl)
    if (result?.error) { setMsg('Erro ao salvar: ' + result.error); setUploading(false); return }

    setPreview(publicUrl)
    setProfile((p: any) => ({ ...p, avatar_url: publicUrl }))
    setMsg('Foto atualizada com sucesso!')
    setUploading(false)
    router.refresh()
  }

  const initials = profile ? getInitials(profile.full_name, profile.email) : '?'
  const avatarSrc = preview || profile?.avatar_url

  return (
    <div style={{ maxWidth: '480px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', marginBottom: '24px' }}>
        Meu Perfil
      </h1>

      <div style={{
        backgroundColor: '#111111',
        border: '1px solid #2A2A2A',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt="Avatar"
              width={96}
              height={96}
              style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #2A2A2A' }}
            />
          ) : (
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              backgroundColor: '#AEEA00', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: '700', color: '#0D0D0D',
            }}>
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '16px', margin: 0 }}>
            {profile?.full_name || 'Carregando...'}
          </p>
          <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
            {profile?.email || ''}
          </p>
        </div>

        {/* Upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            backgroundColor: uploading ? '#1A2E00' : '#AEEA00',
            color: uploading ? '#AEEA00' : '#0D0D0D',
            fontWeight: '700', fontSize: '14px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {uploading ? 'Enviando...' : 'Alterar foto de perfil'}
        </button>

        {msg && (
          <p style={{
            fontSize: '13px',
            color: msg.startsWith('Erro') ? '#FF5555' : '#AEEA00',
            margin: 0, textAlign: 'center',
          }}>
            {msg}
          </p>
        )}

        <p style={{ color: '#444444', fontSize: '11px', margin: 0, textAlign: 'center' }}>
          JPG, PNG ou WebP · máx. 5 MB
        </p>
      </div>
    </div>
  )
}
