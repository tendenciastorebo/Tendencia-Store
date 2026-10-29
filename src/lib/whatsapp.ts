import type { Product } from '../types'

export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return 'Consultar precio'
  const n = Number(price)
  return `Bs ${Number.isInteger(n) ? n : n.toFixed(2)}`
}

export function waLink(phone: string, text?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, '')}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export interface SizeOption {
  value: string
  label: string
}

/** Solo las tallas configuradas por el administrador. Nunca se inventan tallas. */
export function getSizeOptions(p: Product): SizeOption[] {
  if (p.size_detail && p.size_detail.trim()) {
    return [{ value: p.size_detail.trim(), label: p.size_detail.trim() }]
  }
  if (p.sizes.length > 0) return p.sizes.map((s) => ({ value: s, label: s }))
  return [{ value: 'Por confirmar, consultar disponibilidad', label: 'Consultar talla' }]
}

export function sizeSummary(p: Product): string {
  if (p.size_detail && p.size_detail.trim()) return p.size_detail.trim()
  if (p.sizes.length > 0) return `Talla ${p.sizes.join(' / ')}`
  return 'Consulta talla y disponibilidad'
}

/** Mensaje aprobado: sin emojis, negritas con asteriscos simples de WhatsApp. */
export function buildMessage(productName: string, size: string, price: number | null): string {
  const priceText = price === null ? 'Por confirmar' : formatPrice(price)
  return (
    '¡Hola, *Tendencia Store*!\n\n' +
    'Me interesa esta prenda y quisiera consultar su disponibilidad.\n\n' +
    `- *Prenda:* ${productName}\n` +
    `- *Talla:* ${size}\n` +
    `- *Precio publicado:* ${priceText}\n\n` +
    '*¿Podrían confirmarme si está disponible y brindarme información sobre las opciones de entrega?* ¡Muchas gracias!'
  )
}
