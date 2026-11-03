import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types'

type StockRow = { id: string; product_id: string; size: string; quantity: number }
type CartLine = { product: Product; size: string; quantity: number }
type CashSession = { id: string; opening_amount: number; opened_at: string; status: 'open' | 'closed' }
const money = (n: number) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function AdminPOS() {
  const [products, setProducts] = useState<Product[]>([])
  const [stock, setStock] = useState<StockRow[]>([])
  const [session, setSession] = useState<CashSession | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [saleType, setSaleType] = useState<'local' | 'shipping'>('local')
  const [payment, setPayment] = useState('cash')
  const [discount, setDiscount] = useState('0')
  const [shipping, setShipping] = useState('0')
  const [cashReceived, setCashReceived] = useState('')
  const [shippingCompany, setShippingCompany] = useState('')
  const [destination, setDestination] = useState('')
  const [tracking, setTracking] = useState('')
  const [opening, setOpening] = useState('')
  const [closing, setClosing] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const load = useCallback(async () => {
    setError('')
    const [p, i, c] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).eq('available', true).order('sort_order'),
      supabase.from('inventory').select('*').order('size'),
      supabase.from('cash_sessions').select('*').eq('status', 'open').maybeSingle(),
    ])
    if (p.error || i.error || c.error) {
      setError([p.error?.message, i.error?.message, c.error?.message].filter(Boolean).join(' · '))
      return
    }
    setProducts((p.data ?? []) as Product[])
    setStock((i.data ?? []) as StockRow[])
    setSession((c.data ?? null) as CashSession | null)
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selectedProduct) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedProduct(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedProduct])

  const filtered = useMemo(() => products.filter(p => `${p.name} ${p.sizes.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [products, search])
  const subtotal = cart.reduce((sum, line) => sum + Number(line.product.price || 0) * line.quantity, 0)
  const discountValue = Math.max(0, Number(discount) || 0)
  const shippingValue = saleType === 'shipping' ? Math.max(0, Number(shipping) || 0) : 0
  const total = Math.max(0, subtotal - discountValue) + shippingValue
  const stockFor = (productId: string, size: string) => stock.find(s => s.product_id === productId && s.size === size)?.quantity ?? 0

  function add(product: Product, size: string) {
    if (product.price === null) { setError(`Asigna un precio a «${product.name}» antes de venderla.`); return }
    const available = stockFor(product.id, size)
    const current = cart.find(x => x.product.id === product.id && x.size === size)?.quantity ?? 0
    if (current >= available) { setError(`Stock insuficiente: ${product.name}, talla ${size}.`); return }
    setError('')
    setCart(prev => {
      const found = prev.find(x => x.product.id === product.id && x.size === size)
      return found ? prev.map(x => x.product.id === product.id && x.size === size ? { ...x, quantity: x.quantity + 1 } : x) : [...prev, { product, size, quantity: 1 }]
    })
  }

  function selectProduct(product: Product) {
    if (product.price === null) {
      setError(`Asigna un precio a «${product.name}» antes de venderla.`)
      return
    }
    const sizes = product.sizes.length ? product.sizes : [product.size_detail?.trim() || 'Única']
    const availableSizes = sizes.filter(size => stockFor(product.id, size) > 0)
    if (!availableSizes.length) {
      setError(`No hay unidades disponibles de «${product.name}».`)
      return
    }
    setError('')
    if (sizes.length === 1) {
      add(product, sizes[0])
      return
    }
    setSelectedProduct(product)
  }

  function changeQty(productId: string, size: string, delta: number) {
    setCart(prev => prev.flatMap(line => {
      if (line.product.id !== productId || line.size !== size) return [line]
      const next = line.quantity + delta
      if (next <= 0) return []
      if (next > stockFor(productId, size)) { setError('No hay más unidades disponibles.'); return [line] }
      return [{ ...line, quantity: next }]
    }))
  }

  async function openCash() {
    const amount = Number(opening)
    if (!Number.isFinite(amount) || amount < 0) { setError('Ingresa un monto inicial válido.'); return }
    setBusy(true); setError('')
    const { error: err } = await supabase.rpc('open_cash', { p_opening_amount: amount })
    setBusy(false)
    if (err) setError(err.message); else { setOpening(''); setMessage('Caja abierta correctamente.'); await load() }
  }

  async function closeCash() {
    if (!session) return
    const amount = Number(closing)
    if (!Number.isFinite(amount) || amount < 0) { setError('Ingresa el efectivo contado al cierre.'); return }
    if (!window.confirm('¿Confirmas el cierre de caja?')) return
    setBusy(true); setError('')
    const { error: err } = await supabase.rpc('close_cash', { p_session_id: session.id, p_closing_amount: amount })
    setBusy(false)
    if (err) setError(err.message); else { setClosing(''); setMessage('Caja cerrada.'); await load() }
  }

  async function finishSale() {
    if (!session) { setError('Primero debes abrir caja.'); return }
    if (!cart.length) { setError('Agrega prendas al carrito.'); return }
    if (discountValue > subtotal) { setError('El descuento no puede superar el subtotal.'); return }
    if (saleType === 'shipping' && !destination.trim()) { setError('Indica el destino del envío.'); return }
    const received = payment === 'cash' || payment === 'mixed' ? Number(cashReceived) : 0
    if ((payment === 'cash' || payment === 'mixed') && (!Number.isFinite(received) || received < 0)) { setError('Revisa el efectivo recibido.'); return }
    if (payment === 'cash' && received < total) { setError('El efectivo recibido no cubre el total.'); return }
    setBusy(true); setError(''); setMessage('')
    const { data, error: err } = await supabase.rpc('create_pos_sale', {
      p_items: cart.map(x => ({ product_id: x.product.id, size: x.size, quantity: x.quantity })),
      p_customer_name: customer || null,
      p_customer_phone: phone || null,
      p_sale_type: saleType,
      p_payment_method: payment,
      p_discount: discountValue,
      p_shipping_cost: shippingValue,
      p_cash_received: received,
      p_shipping_company: shippingCompany || null,
      p_shipping_destination: destination || null,
      p_shipping_tracking: tracking || null,
    })
    setBusy(false)
    if (err) { setError(err.message); return }
    setMessage(`Venta registrada correctamente. N.º ${String(data).slice(0, 8).toUpperCase()}`)
    setCart([]); setCustomer(''); setPhone(''); setDiscount('0'); setShipping('0'); setCashReceived(''); setShippingCompany(''); setDestination(''); setTracking('')
    await load()
  }

  return <div className="pos-page">
    <div className="pos-heading"><div><p className="pos-eyebrow">ADMINISTRACIÓN / VENTAS</p><h1>Punto de venta</h1><p className="pos-sub">Registra ventas presenciales y pedidos con envío desde un solo lugar.</p></div><div className={`pos-cash-state ${session ? 'is-open' : 'is-closed'}`}><span />{session ? 'Caja abierta' : 'Caja cerrada'}</div></div>
    {error && <div className="error" role="alert">{error}<button onClick={() => setError('')} aria-label="Cerrar"><X size={14}/></button></div>}
    {message && <div className="okmsg" role="status">{message}<button onClick={() => setMessage('')} aria-label="Cerrar"><X size={14}/></button></div>}
    {!session ? <section className="pos-open-card"><div><Banknote size={22}/><div><h2>Apertura de caja</h2><p>Registra el efectivo inicial antes de comenzar a vender.</p></div></div><label className="pos-field"><span>Monto inicial (Bs)</span><input className="input" type="number" min="0" step="0.01" value={opening} onChange={e => setOpening(e.target.value)} placeholder="Ej. 200"/></label><button className="btn pink" disabled={busy} onClick={() => void openCash()}>{busy ? 'Procesando…' : 'Abrir caja'}</button></section> : <>
      <div className="pos-workspace">
        <section className="pos-catalog card"><div className="pos-section-head"><div><h2>Catálogo de prendas</h2><p>Selecciona la talla para agregar al carrito.</p></div><span>{products.length} productos</span></div>
          <label className="pos-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar prenda o talla…"/></label>
          <div className="pos-products">{filtered.map(product => {
            const sizes = product.sizes.length ? product.sizes : [product.size_detail?.trim() || 'Única']
            const hasStock = sizes.some(size => stockFor(product.id, size) > 0)
            return <article
              className={`pos-product ${hasStock && product.price !== null ? 'is-selectable' : 'is-unavailable'}`}
              key={product.id}
              role="button"
              tabIndex={hasStock && product.price !== null ? 0 : -1}
              aria-label={`Agregar ${product.name}${sizes.length > 1 ? ', elegir talla' : `, talla ${sizes[0]}`}`}
              aria-disabled={!hasStock || product.price === null}
              onClick={() => selectProduct(product)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  selectProduct(product)
                }
              }}
            >
              <img src={product.image_url} alt={product.name}/>
              <div className="pos-product-info">
                <strong>{product.name}</strong>
                <span>{product.price === null ? 'Precio pendiente' : money(product.price)}</span>
                <div className="pos-size-list" aria-label="Tallas y existencias">
                  {sizes.map(size => {
                    const qty = stockFor(product.id, size)
                    return <span className={qty <= 0 ? 'out-of-stock' : ''} key={size} title={`${qty} disponibles`}>{size}<small>{qty}</small></span>
                  })}
                </div>
                <small className="pos-product-hint">{sizes.length > 1 ? 'Toca para elegir talla' : 'Toca para agregar'}</small>
              </div>
            </article>
          })}{filtered.length === 0 && <p className="pos-empty">No se encontraron prendas.</p>}</div>
        </section>
        <aside className="pos-checkout card"><div className="pos-section-head"><div><h2>Nueva venta</h2><p>{cart.length} líneas en el carrito</p></div><ShoppingBag size={20}/></div>
          <div className="pos-cart-lines">{cart.map(line => <div className="pos-cart-line" key={`${line.product.id}-${line.size}`}><div><strong>{line.product.name}</strong><small>Talla {line.size} · {money(Number(line.product.price))}</small></div><div className="pos-qty"><button onClick={() => changeQty(line.product.id,line.size,-1)} aria-label="Disminuir">−</button><b>{line.quantity}</b><button onClick={() => changeQty(line.product.id,line.size,1)} aria-label="Aumentar">+</button></div><strong>{money(Number(line.product.price)*line.quantity)}</strong><button className="pos-remove" onClick={() => setCart(prev => prev.filter(x => x.product.id!==line.product.id || x.size!==line.size))} aria-label="Quitar"><Trash2 size={15}/></button></div>)}{!cart.length && <div className="pos-empty">Selecciona prendas del catálogo para comenzar.</div>}</div>
          <div className="pos-form-grid"><label className="pos-field"><span>Cliente</span><input className="input" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nombre (opcional)"/></label><label className="pos-field"><span>Teléfono</span><input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="WhatsApp"/></label></div>
          <div className="pos-toggle"><button className={saleType==='local'?'active':''} onClick={()=>setSaleType('local')}>Venta local</button><button className={saleType==='shipping'?'active':''} onClick={()=>setSaleType('shipping')}>Envío</button></div>
          {saleType==='shipping' && <div className="pos-form-grid"><label className="pos-field"><span>Destino *</span><input className="input" value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Ciudad / agencia"/></label><label className="pos-field"><span>Empresa de transporte</span><input className="input" value={shippingCompany} onChange={e=>setShippingCompany(e.target.value)} placeholder="Empresa"/></label><label className="pos-field"><span>Costo envío (Bs)</span><input className="input" type="number" min="0" value={shipping} onChange={e=>setShipping(e.target.value)}/></label><label className="pos-field"><span>N.º de guía</span><input className="input" value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="Opcional"/></label></div>}
          <div className="pos-form-grid"><label className="pos-field"><span>Descuento (Bs)</span><input className="input" type="number" min="0" value={discount} onChange={e=>setDiscount(e.target.value)}/></label><label className="pos-field"><span>Método de pago</span><select className="input" value={payment} onChange={e=>setPayment(e.target.value)}><option value="cash">Efectivo</option><option value="qr">QR</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option><option value="mixed">Mixto (efectivo + otro)</option><option value="pending">Pendiente</option><option value="cod">Contra entrega</option></select></label></div>
          {(payment==='cash'||payment==='mixed') && <label className="pos-field"><span>{payment==='mixed'?'Parte en efectivo (Bs)':'Efectivo recibido (Bs)'}</span><input className="input" type="number" min="0" value={cashReceived} onChange={e=>setCashReceived(e.target.value)} placeholder="Monto recibido"/></label>}
          <div className="pos-totals"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Descuento</span><b>− {money(discountValue)}</b></div>{saleType==='shipping'&&<div><span>Envío</span><b>{money(shippingValue)}</b></div>}<div className="grand"><span>Total</span><strong>{money(total)}</strong></div>{payment==='cash'&&Number(cashReceived)>=total&&total>0&&<div><span>Cambio</span><b>{money(Number(cashReceived)-total)}</b></div>}</div>
          <button className="btn pink pos-submit" disabled={busy||!cart.length} onClick={()=>void finishSale()}>{busy?'Registrando…':'Registrar venta'}</button>
          <button className="btn ghost pos-clear" disabled={!cart.length||busy} onClick={()=>setCart([])}>Vaciar carrito</button>
        </aside>
      </div>
      {selectedProduct && (() => {
        const sizes = selectedProduct.sizes.length ? selectedProduct.sizes : [selectedProduct.size_detail?.trim() || 'Única']
        return <div className="pos-size-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <section className="pos-size-modal" role="dialog" aria-modal="true" aria-labelledby="pos-size-modal-title" onClick={event => event.stopPropagation()}>
            <button className="pos-size-modal-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="Cerrar"><X size={18}/></button>
            <p className="pos-eyebrow">SELECCIÓN DE TALLA</p>
            <h2 id="pos-size-modal-title">{selectedProduct.name}</h2>
            <p className="pos-size-modal-price">{selectedProduct.price === null ? 'Precio pendiente' : money(selectedProduct.price)}</p>
            <p className="pos-size-modal-copy">Elige la talla que deseas agregar a la venta.</p>
            <div className="pos-size-modal-options">
              {sizes.map(size => {
                const qty = stockFor(selectedProduct.id, size)
                return <button
                  type="button"
                  key={size}
                  disabled={qty <= 0 || selectedProduct.price === null}
                  onClick={() => {
                    add(selectedProduct, size)
                    setSelectedProduct(null)
                  }}
                >
                  <strong>{size}</strong>
                  <small>{qty > 0 ? `${qty} disponibles` : 'Agotado'}</small>
                </button>
              })}
            </div>
          </section>
        </div>
      })()}
      <section className="pos-cash-footer"><span><i/> Caja abierta desde {new Date(session.opened_at).toLocaleString('es-BO')}</span><label> Efectivo contado al cierre (Bs) <input value={closing} onChange={e=>setClosing(e.target.value)} type="number" min="0" placeholder="Monto"/></label><button className="btn danger small" disabled={busy||closing===''} onClick={()=>void closeCash()}>Cerrar caja</button></section>
    </>}
  </div>
}
