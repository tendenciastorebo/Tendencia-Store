export interface Category {
  id: string
  name: string
  slug: string
  image_url: string | null
  sort_order: number
  active: boolean
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  price: number | null
  sizes: string[]
  size_detail: string | null
  image_url: string
  badge: string | null
  active: boolean
  available: boolean
  sort_order: number
}

export interface Settings {
  id: number
  whatsapp: string
  announcement: string
  hero_title: string
  hero_text: string
  instagram: string | null
  facebook: string | null
  tiktok: string | null
}

export type OrderStatus = 'nuevo' | 'contactado' | 'vendido' | 'cancelado'

export interface Order {
  id: string
  created_at: string
  customer_name: string
  product_id: string | null
  product_name: string
  size: string | null
  price_text: string | null
  status: OrderStatus
  notes: string | null
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  whatsapp: '59169141918',
  announcement: 'Nueva temporada · Envíos a toda Bolivia · Atención por WhatsApp',
  hero_title: 'Viste como te sientes.',
  hero_text:
    'Descubre vestidos, conjuntos y enterizos para expresar tu estilo. Consulta tallas, disponibilidad y precios directamente con nosotros.',
  instagram: null,
  facebook: null,
  tiktok: null,
}
