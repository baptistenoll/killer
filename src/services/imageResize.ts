const MAX_DIMENSION = 200
const JPEG_QUALITY = 0.7
/** Firestore documents cap at 1MB; keep photos far below that alongside the doc's other fields. */
const MAX_DATA_URL_LENGTH = 700_000

export async function resizeImageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de traiter cette image.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error('Cette image est trop complexe, essaie une photo plus simple.')
  }
  return dataUrl
}
