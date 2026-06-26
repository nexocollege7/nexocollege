'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Props = {
  courseId: string
  courseTitle: string
  price: number
  isFree: boolean
  schoolSlug: string
  courseSlug: string
  primaryColor: string
  hasCoupon: boolean
  hasPix: boolean
  hasToken: boolean
  escolaSuspensa: boolean
}

type CouponResult = {
  couponCode: string
  discountPercent: number
  originalPrice: number
  finalPrice: number
}

export function PayButton({
  courseId,
  courseTitle,
  price,
  isFree,
  schoolSlug,
  courseSlug,
  primaryColor,
  hasCoupon,
  hasPix,
  hasToken,
  escolaSuspensa,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setApplyingCoupon(true)
    setCouponError('')
    setCouponResult(null)

    try {
      const res = await fetch('/api/validar-cupom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, couponCode: couponInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setCouponError(data.error || 'Cupom inválido.')
      } else {
        setCouponResult(data as CouponResult)
      }
    } catch {
      setCouponError('Erro ao validar cupom.')
    }
    setApplyingCoupon(false)
  }

  function handleRemoveCoupon() {
    setCouponResult(null)
    setCouponInput('')
    setCouponError('')
  }

  async function handlePay() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const redirect = encodeURIComponent(`/vitrine/${schoolSlug}/${courseSlug}`)
      router.push(`/vitrine/${schoolSlug}/login?redirect=${redirect}`)
      return
    }

    if (isFree) {
      try {
        const response = await fetch('/api/matricula-gratuita', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })
        const data = await response.json()
        if (data.error) {
          alert(`Erro: ${data.error}`)
          setLoading(false)
          return
        }
        router.push('/dashboard/meus-cursos')
        return
      } catch {
        alert('Erro ao processar matrícula. Tente novamente.')
        setLoading(false)
        return
      }
    }

    try {
      const body: Record<string, unknown> = { courseId, courseTitle }
      if (couponResult) body.couponCode = couponResult.couponCode

      const response = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (data.error) {
        alert(`Erro: ${data.error}`)
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      alert('Erro ao processar pagamento. Tente novamente.')
      setLoading(false)
    }
  }

  const displayPrice = couponResult ? couponResult.finalPrice : price

  if (escolaSuspensa) {
    return (
      <button
        disabled
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          backgroundColor: '#2A2A2A', color: '#666666', fontWeight: '700',
          fontSize: '16px', cursor: 'not-allowed', opacity: 0.7, fontFamily: 'inherit',
        }}
      >
        Escola temporariamente indisponível
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Cupom de desconto — apenas para cursos pagos que têm cupom ativo */}
      {!isFree && hasCoupon && (
        <div>
          {couponResult ? (
            /* Cupom aplicado */
            <div style={{
              backgroundColor: 'rgba(174,234,0,0.08)',
              border: '1px solid rgba(174,234,0,0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              <div>
                <p style={{ color: '#AEEA00', fontWeight: '700', fontSize: '13px', margin: '0 0 2px' }}>
                  ✅ Cupom {couponResult.couponCode} aplicado — {couponResult.discountPercent}% de desconto
                </p>
                <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>
                  De R${fmt(couponResult.originalPrice)} por{' '}
                  <span style={{ color: '#F0F0F0', fontWeight: '700' }}>R${fmt(couponResult.finalPrice)}</span>
                </p>
              </div>
              <button
                onClick={handleRemoveCoupon}
                style={{ background: 'none', border: 'none', color: '#555555', fontSize: '18px', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ) : (
            /* Campo para digitar cupom */
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Cupom de desconto"
                maxLength={30}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '8px',
                  border: couponError ? '1px solid #FF5555' : '1px solid #2A2A2A',
                  backgroundColor: '#0D0D0D', color: '#F0F0F0',
                  fontSize: '13px', outline: 'none', fontFamily: 'inherit',
                  textTransform: 'uppercase',
                }}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponInput.trim()}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: '1px solid #2A2A2A',
                  backgroundColor: 'transparent', color: '#888888',
                  fontSize: '13px', fontWeight: '600', cursor: applyingCoupon ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  opacity: (!couponInput.trim() || applyingCoupon) ? 0.5 : 1,
                }}
              >
                {applyingCoupon ? '...' : 'Aplicar'}
              </button>
            </div>
          )}
          {couponError && (
            <p style={{ color: '#FF5555', fontSize: '12px', margin: '6px 0 0' }}>{couponError}</p>
          )}
        </div>
      )}

      {/* Botão principal */}
      {!isFree && !hasToken && hasPix ? (
        <Link
          href={`/vitrine/${schoolSlug}/${courseSlug}/pix`}
          style={{
            display: 'block', textAlign: 'center', width: '100%', padding: '14px',
            borderRadius: '12px', border: 'none', backgroundColor: primaryColor,
            color: '#0D0D0D', fontWeight: '700', fontSize: '16px', textDecoration: 'none',
            fontFamily: 'inherit',
          }}
        >
          Pagar com PIX
        </Link>
      ) : (
        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            backgroundColor: loading ? '#555' : primaryColor,
            color: '#0D0D0D', fontWeight: '700', fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'inherit',
            transition: 'opacity 0.15s',
          }}
        >
          {loading
            ? 'Processando...'
            : isFree
            ? '🎁 Acessar gratuitamente'
            : couponResult
            ? `Matricular por R$${fmt(displayPrice)}`
            : hasToken && hasPix
            ? 'Pagar com Cartão ou PIX (Mercado Pago)'
            : 'Matricular agora'}
        </button>
      )}

      {!isFree && hasToken && hasPix && (
        <Link
          href={`/vitrine/${schoolSlug}/${courseSlug}/pix`}
          style={{
            display: 'block', textAlign: 'center', width: '100%', padding: '12px',
            borderRadius: '12px', border: '1px solid #2A2A2A', backgroundColor: 'transparent',
            color: '#888888', fontWeight: '600', fontSize: '14px', textDecoration: 'none',
            fontFamily: 'inherit',
          }}
        >
          Pagar com PIX direto
        </Link>
      )}
    </div>
  )
}
