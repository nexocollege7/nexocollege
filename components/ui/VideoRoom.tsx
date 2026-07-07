'use client'

interface VideoRoomProps {
  url: string
  onLeave: () => void
  isMentor?: boolean
  onEnd?: () => void
}

export default function VideoRoom({ url, onLeave, isMentor = false, onEnd }: VideoRoomProps) {
  function handleLeave() {
    if (window.confirm('Deseja sair da sessão?')) {
      onLeave()
    }
  }

  function handleEnd() {
    if (window.confirm('Deseja encerrar a sessão para todos?')) {
      onEnd?.()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <iframe
        src={url}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        allowFullScreen
        style={{ flex: 1, width: '100%', border: 'none' }}
      />

      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        {isMentor ? (
          <button
            onClick={handleEnd}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Encerrar sessão
          </button>
        ) : (
          <button
            onClick={handleLeave}
            style={{
              backgroundColor: '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Sair da sessão
          </button>
        )}
      </div>
    </div>
  )
}
