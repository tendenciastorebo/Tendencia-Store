import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Product } from '../types'
import { buildMessage, formatPrice, getSizeOptions, waLink } from '../lib/whatsapp'
import { supabase } from '../lib/supabase'

interface Props {
  product: Product
  whatsapp: string
  onClose: () => void
  onNotify: (message: string) => void
}

export default function QuickView({ product, whatsapp, onClose, onNotify }: Props) {
  const options = getSizeOptions(product)
  const [name, setName] = useState('')
  const [size, setSize] = useState(options[0].value)
  const nameRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.classList.add('modal-open')
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function order() {
    const customer = name.trim()
    if (!customer) {
      nameRef.current?.focus()
      nameRef.current?.setCustomValidity('Escribe tu nombre para continuar.')
      nameRef.current?.reportValidity()
      nameRef.current?.setCustomValidity('')
      return
    }
    const message = buildMessage(product.name, size, product.price)
    // Se registra la consulta para el panel de administración (si falla, no se bloquea el pedido).
    void supabase
      .from('orders')
      .insert({
        customer_name: customer,
        product_id: product.id,
        product_name: product.name,
        size,
        price_text: product.price === null ? 'Por confirmar' : formatPrice(product.price),
      })
      .then(() => undefined)
    onNotify(`Preparando tu consulta de ${product.name}`)
    window.open(waLink(whatsapp, message), '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="quick-view"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickViewTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="quick-view-panel">
        <button ref={closeRef} className="quick-view-close" type="button" aria-label="Cerrar ventana" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="quick-view-photo">
          <img src={product.image_url} alt={product.name} />
        </div>
        <div className="quick-view-info">
          <div className="quick-view-eyebrow">Tendencia Store · Vista rápida</div>
          <h2 id="quickViewTitle">{product.name}</h2>
          <div className="quick-view-price">{formatPrice(product.price)}</div>
          {product.available ? (
            <>
              <p className="quick-view-note">Completa tus datos para enviar la consulta con la prenda y la talla elegida.</p>
              <label className="order-field" htmlFor="customerName">Tu nombre</label>
              <input
                ref={nameRef}
                className="order-input"
                id="customerName"
                type="text"
                autoComplete="name"
                placeholder="¿Cómo te llamas?"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="order-field" id="sizeLabel">Talla disponible</span>
              <div className="size-options" role="group" aria-labelledby="sizeLabel">
                {options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className="size-option"
                    aria-pressed={size === o.value}
                    onClick={() => setSize(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <button className="button quick-view-order" type="button" onClick={order}>
                Pedido por WhatsApp
              </button>
            </>
          ) : (
            <p className="quick-view-note">Esta prenda está agotada por el momento. Escríbenos por WhatsApp y te avisamos de nuevos ingresos.</p>
          )}
        </div>
      </div>
    </div>
  )
}
