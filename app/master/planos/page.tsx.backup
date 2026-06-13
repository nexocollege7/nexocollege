'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'

export default function PlanosPage() {
  const [proPrice, setProPrice] = useState('')
  const [enterprisePrice, setEnterprisePrice] = useState('')
  const [proToken, setProToken] = useState('')
  const [enterpriseToken, setEnterpriseToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')

      if (data) {
        data.forEach((row) => {
          if (row.key === 'pro_price_yearly') setProPrice(row.value)
          if (row.key === 'enterprise_price_yearly') setEnterprisePrice(row.value)
          if (row.key === 'pro_mp_access_token') setProToken(row.value)
          if (row.key === 'enterprise_mp_access_token') setEnterpriseToken(row.value)
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const supabase = createClient()

    const updates = [
      { key: 'pro_price_yearly', value: proPrice },
      { key: 'enterprise_price_yearly', value: enterprisePrice },
      { key: 'pro_mp_access_token', value: proToken },
      { key: 'enterprise_mp_access_token', value: enterpriseToken },
    ]

    for (const update of updates) {
      await supabase
        .from('platform_settings')
        .update({ value: update.value, updated_at: new Date().toISOString() })
        .eq('key', update.key)
    }

    setMessage('✅ Configurações salvas com sucesso!')
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Configuração de Planos
        </h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
          Defina os valores anuais dos planos pagos. Esses valores aparecem na landing page e são usados no checkout.
        </p>
      </div>

      {/* Plano Starter */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>🆓</span>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Starter</h2>
            <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>Plano gratuito — até 1 curso</p>
          </div>
          <span style={{ marginLeft: 'auto', padding: '4px 12px', backgroundColor: '#1A2E00', color: '#AEEA00', borderRadius: '100px', fontSize: '12px', fontWeight: '700' }}>
            GRATUITO
          </span>
        </div>
        <p style={{ color: '#555555', fontSize: '13px' }}>
          Sem configuração necessária. Toda escola começa no Starter automaticamente.
        </p>
      </div>

      {/* Plano Pro */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #AEEA00', borderRadius: '16px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '24px' }}>⭐</span>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Pro</h2>
            <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>Até 10 cursos — pagamento anual</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Valor anual (R$)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#888888' }}>R$</span>
              <input
                type="number"
                value={proPrice}
                onChange={(e) => setProPrice(e.target.value)}
                style={{
                  width: '160px', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
                  color: '#F0F0F0', fontSize: '16px', fontWeight: '700', outline: 'none',
                }}
              />
              <span style={{ color: '#555555', fontSize: '13px' }}>
                = R$ {proPrice ? (parseFloat(proPrice) / 12).toFixed(2) : '0,00'}/mês
              </span>
            </div>
          </div>
          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Access Token MP (para receber pagamentos do plano Pro)
            </label>
            <input
              type="password"
              value={proToken}
              onChange={(e) => setProToken(e.target.value)}
              placeholder="APP_USR-xxxx ou TEST-xxxx"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
                color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </div>

      {/* Plano Enterprise */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #7C4DFF', borderRadius: '16px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '24px' }}>🚀</span>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Enterprise</h2>
            <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>Cursos ilimitados — pagamento anual</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Valor anual (R$)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#888888' }}>R$</span>
              <input
                type="number"
                value={enterprisePrice}
                onChange={(e) => setEnterprisePrice(e.target.value)}
                style={{
                  width: '160px', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
                  color: '#F0F0F0', fontSize: '16px', fontWeight: '700', outline: 'none',
                }}
              />
              <span style={{ color: '#555555', fontSize: '13px' }}>
                = R$ {enterprisePrice ? (parseFloat(enterprisePrice) / 12).toFixed(2) : '0,00'}/mês
              </span>
            </div>
          </div>
          <div>
            <label style={{ color: '#888888', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Access Token MP (para receber pagamentos do plano Enterprise)
            </label>
            <input
              type="password"
              value={enterpriseToken}
              onChange={(e) => setEnterpriseToken(e.target.value)}
              placeholder="APP_USR-xxxx ou TEST-xxxx"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #2A2A2A', backgroundColor: '#0D0D0D',
                color: '#F0F0F0', fontSize: '14px', outline: 'none', fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </div>

      {message && (
        <p style={{ color: '#AEEA00', fontSize: '14px' }}>{message}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '14px 32px', borderRadius: '10px', border: 'none',
          backgroundColor: '#AEEA00', color: '#0D0D0D',
          fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1, alignSelf: 'flex-start',
        }}
      >
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  )
}
