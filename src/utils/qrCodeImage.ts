export async function loadQrCodeImage(data: string, size = 420): Promise<HTMLImageElement | null> {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&qzone=1&margin=0&color=000000&bgcolor=ffffff&data=${encodeURIComponent(data)}`
  return new Promise((resolve) => {
    const img = new Image()
    let done = false
    const finish = (value: HTMLImageElement | null) => {
      if (done) return
      done = true
      resolve(value)
    }
    const t = window.setTimeout(() => finish(null), 2500)
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      window.clearTimeout(t)
      finish(img)
    }
    img.onerror = () => {
      window.clearTimeout(t)
      finish(null)
    }
    img.src = src
  })
}
