import type { Product } from '../types'
import { formatPrice, sizeSummary } from '../lib/whatsapp'

interface Props {
  product: Product
  onOpen: (p: Product) => void
}

export default function ProductCard({ product, onOpen }: Props) {
  const open = () => onOpen(product)
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }
  return (
    <article className="product-card">
      <div
        className="product-image"
        role="button"
        tabIndex={0}
        aria-label={`Ver prenda ampliada: ${product.name}`}
        onClick={open}
        onKeyDown={onKey}
      >
        <img loading="lazy" src={product.image_url} alt={product.name} />
        {!product.available ? (
          <span className="product-label soldout">AGOTADO</span>
        ) : product.badge ? (
          <span className="product-label">{product.badge}</span>
        ) : null}
        <button type="button" className="quick-add" tabIndex={-1}>
          VER PRENDA
        </button>
      </div>
      <h3 tabIndex={0} onClick={open} onKeyDown={onKey}>
        {product.name}
      </h3>
      <div className="product-meta">{sizeSummary(product)}</div>
      <div className="price">{formatPrice(product.price)}</div>
    </article>
  )
}
