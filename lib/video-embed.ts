type EmbedOptions = {
  autoplay?: boolean
  mute?: boolean
}

export function getEmbedUrl(url: string, opts: EmbedOptions = {}): string {
  if (!url) return ''
  const { autoplay = true, mute = false } = opts

  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  if (yt) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      modestbranding: '1',
      rel: '0',
      fs: '1',
      iv_load_policy: '3',
      disablekb: '0',
    })
    if (mute) params.set('mute', '1')
    return `https://www.youtube.com/embed/${yt[1]}?${params.toString()}`
  }

  const vm = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/)
  if (vm) {
    const params = new URLSearchParams({ autoplay: autoplay ? '1' : '0' })
    if (mute) params.set('muted', '1')
    if (vm[2]) params.set('h', vm[2])
    return `https://player.vimeo.com/video/${vm[1]}?${params.toString()}`
  }

  if (url.includes('pandavideo')) return url
  return ''
}
