'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatBRL(valor: number): string {
  return `R$ ${valor.toFixed(2)}`
}

type Props = {
  data: { data: string; valor: number }[]
  periodo: number
  corEscola: string
}

export default function VendasChart({ data, periodo, corEscola }: Props) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
        <XAxis dataKey="data" stroke="#555555" fontSize={11} interval={Math.ceil(periodo / 10)} />
        <YAxis stroke="#555555" fontSize={11} width={50} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '8px' }}
          labelStyle={{ color: '#F0F0F0' }}
          formatter={(value) => [formatBRL(Number(value)), 'Vendas']}
        />
        <Bar dataKey="valor" fill={corEscola} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
