export function SkeletonLine({ width = '100%', height = '16px', borderRadius = '6px' }: { width?: string; height?: string; borderRadius?: string }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #1A1A1A 25%, #2A2A2A 50%, #1A1A1A 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{
      backgroundColor: '#1A1A1A',
      border: '1px solid #2A2A2A',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? '60%' : i === lines - 1 ? '40%' : '90%'} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ cards = 3 }: { cards?: number }) {
  return (
    <>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    </>
  )
}
