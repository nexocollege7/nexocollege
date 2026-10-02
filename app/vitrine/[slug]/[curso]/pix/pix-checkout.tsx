'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { getOrCreatePendingEnrollment, uploadReceipt } from '@/app/actions/pending-enrollments-actions'

type Props = {
  courseId: string
  courseTitle: string
  coursePrice: number
  originalPrice?: number
  couponCode?: string | null
  discountPercent?: number
  schoolId: string
  schoolSlug: string
  courseSlug: string
  pixKey: string
  pixHolderName: string | null
  whatsappContact: string | null
  primaryColor: string
}

type PendingState = {
  id: string
  status: string
  receiptUrl: string | null
}

export function PixCheckout({
  courseId,
  courseTitle,
  coursePrice,
  originalPrice,
  couponCode,
  discountPercent,
  schoolId,
  schoolSlug,
  courseSlug,
  pixKey,
  pixHolderName,
  whatsappContact,
  primaryColor,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<PendingState | null>(null)
  const [copied, setCopied] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const pixPath = `/vitrine/${schoolSlug}/${courseSlug}/pix`

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const redirect = encodeURIComponent(pixPath)
        router.push(`/vitrine/${schoolSlug}/login?redirect=${redirect}`)
        return
      }

      const result = await getOrCreatePendingEnrollment(courseId, schoolId, couponCode ?? null)
      if (!result.success || !result.id) {
        setError(result.error || 'Não foi possível iniciar o pagamento via PIX')
        setLoading(false)
        return
      }

      setPending({
        id: result.id,
        status: result.status || 'awaiting_payment',
        receiptUrl: result.receiptUrl ?? null,
      })
      setLoading(false)
    }
    init()
  }, [])

  function handleCopyPix() {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsapp() {
    if (!whatsappContact) return
    const numero = whatsappContact.replace(/\D/g, '')
    const texto = encodeURIComponent(`Olá! Fiz o PIX referente ao curso "${courseTitle}" e gostaria de enviar o comprovante.`)
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
  }

  async function handleUpload() {
    if (!file || !pending) return
    setUploading(true)
    setUploadError('')

    const formData = new FormData()
    formData.append('receipt', file)

    const result = await uploadReceipt(pending.id, formData)
    setUploading(false)

    if (!result.success) {
      setUploadError(result.error || 'Erro ao enviar comprovante')
      return
    }

    setPending({ ...pending, status: 'awaiting_release' })
  }

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <a
            href={`/vitrine/${schoolSlug}/${courseSlug}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o curso
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">Pagamento via PIX</h1>
        <p className="text-gray-400 text-sm mb-8">{courseTitle}</p>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!error && pending && (
          <div className="space-y-6">

            {pending.status === 'awaiting_payment' && (
              <>
                <div className="rounded-xl p-6" style={{ background: 'rgba(174,234,0,0.08)', border: '1px solid rgba(174,234,0,0.35)' }}>
                  <p className="text-gray-400 text-sm mb-1">💰 Valor a pagar</p>
                  <p className="text-white text-3xl font-bold mb-1">R$ {fmt(coursePrice)}</p>
                  {couponCode && originalPrice && originalPrice > coursePrice ? (
                    <p className="text-sm mb-2" style={{ color: '#AEEA00' }}>
                      Cupom {couponCode} aplicado (−{discountPercent}%) · de{' '}
                      <span style={{ textDecoration: 'line-through' }}>R$ {fmt(originalPrice)}</span>
                    </p>
                  ) : null}
                  <p className="text-gray-400 text-sm">Faça o PIX exatamente neste valor e depois envie o comprovante abaixo.</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Chave PIX</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 break-all">
                      {pixKey}
                    </code>
                    <button
                      onClick={handleCopyPix}
                      className="shrink-0 rounded-lg px-3 py-2"
                      style={{ backgroundColor: primaryColor, color: '#0D0D0D' }}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {pixHolderName && (
                    <p className="text-gray-500 text-xs mt-3">Titular: {pixHolderName}</p>
                  )}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <p className="text-white font-semibold mb-2">Envie o comprovante</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Depois de fazer o PIX, envie o comprovante (JPEG, PNG ou WEBP, até 2MB) para liberarmos seu acesso.
                  </p>
                  <label
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '8px', width: '100%', padding: '24px 16px', marginBottom: '12px', borderRadius: '12px',
                      border: file ? '2px solid #AEEA00' : '2px dashed #4a5568',
                      background: file ? 'rgba(174,234,0,0.08)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '32px', lineHeight: 1 }}>{file ? '✅' : '📎'}</span>
                    <span style={{ color: file ? '#AEEA00' : '#FFFFFF', fontWeight: 600, fontSize: '15px' }}>
                      {file ? 'Comprovante selecionado' : 'Toque ou clique aqui para anexar o comprovante'}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '13px', wordBreak: 'break-all' }}>
                      {file ? `${file.name} — toque para trocar` : 'Foto ou print do comprovante (JPEG, PNG ou WEBP, até 2MB)'}
                    </span>
                  </label>
                  {uploadError && (
                    <p className="text-red-400 text-sm mb-3">{uploadError}</p>
                  )}
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full rounded-xl py-3 font-bold disabled:opacity-50"
                    style={{ backgroundColor: primaryColor, color: '#0D0D0D' }}
                  >
                    {uploading ? 'Enviando...' : 'Enviar comprovante'}
                  </button>
                </div>

                {whatsappContact && (
                  <button
                    onClick={handleWhatsapp}
                    className="w-full rounded-xl py-3 font-semibold"
                    style={{ backgroundColor: '#25D366', color: '#0D0D0D' }}
                  >
                    Falar no WhatsApp
                  </button>
                )}
              </>
            )}

            {pending.status === 'awaiting_release' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-white font-semibold mb-2">Comprovante enviado ✅</p>
                <p className="text-gray-400 text-sm mb-4">
                  Seu acesso será liberado em breve pela equipe da escola. Você pode acompanhar pelo WhatsApp.
                </p>
                {whatsappContact && (
                  <button
                    onClick={handleWhatsapp}
                    className="w-full rounded-xl py-3 font-semibold"
                    style={{ backgroundColor: '#25D366', color: '#0D0D0D' }}
                  >
                    Falar no WhatsApp
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
