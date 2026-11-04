import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Menu, X, Heart, MessageCircle, Truck } from 'lucide-react'
import { DEFAULT_SETTINGS, type Category, type Product, type Settings } from '../types'
import { isConfigured, supabase } from '../lib/supabase'
import { waLink } from '../lib/whatsapp'
import ProductCard from '../components/ProductCard'
import QuickView from '../components/QuickView'

export default function Store() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('todos')
  const [selected, setSelected] = useState<Product | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number>()
const bannerImages = useMemo(
  () =>
    [
      settings.hero_image_1,
      settings.hero_image_2,
      settings.hero_image_3,
    ].filter((image): image is string => Boolean(image)),
  [settings.hero_image_1, settings.hero_image_2, settings.hero_image_3],
)

const [activeBanner, setActiveBanner] = useState(0)
useEffect(() => {
  if (bannerImages.length <= 1) {
    setActiveBanner(0)
    return
  }

  const interval = window.setInterval(() => {
    setActiveBanner((current) => (current + 1) % bannerImages.length)
  }, 5000)

  return () => window.clearInterval(interval)
}, [bannerImages])
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    void (async () => {
      const [c, p, s] = await Promise.all([
        supabase.from('categories').select('*').eq('active', true).order('sort_order'),
        supabase.from('products').select('*').eq('active', true).order('sort_order'),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ])
      if (c.error || p.error) setError('No se pudo cargar el catálogo. Intenta de nuevo en unos minutos.')
      setCategories((c.data ?? []) as Category[])
      setProducts((p.data ?? []) as Product[])
      if (s.data) setSettings(s.data as Settings)
      setLoading(false)
    })()
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2400)
  }, [])

  const closeModal = useCallback(() => setSelected(null), [])

  // Solo se muestran categorías que tienen prendas visibles.
  const usedCategories = useMemo(
    () => categories.filter((c) => products.some((p) => p.category_id === c.id)),
    [categories, products],
  )
  const visible = useMemo(() => {
    if (filter === 'todos') return products
    return products.filter((p) => p.category_id === filter)
  }, [products, filter])

  if (!isConfigured) {
    return (
      <div className="setup-warning">
        <strong>Falta conectar Supabase.</strong>
        <br />
        Crea el archivo <code>.env</code> (o las variables en Vercel) con <code>VITE_SUPABASE_URL</code> y{' '}
        <code>VITE_SUPABASE_ANON_KEY</code>. Los pasos están en el archivo LEEME.md.
      </div>
    )
  }

  const pickCategory = (id: string) => {
    setFilter(id)
    setMenuOpen(false)
  }
  const socials = [
  { name: 'Instagram', url: settings.instagram },
  { name: 'Facebook', url: settings.facebook },
  { name: 'TikTok', url: settings.tiktok },
].filter((s) => s.url)

  return (
    <>
<div className="announcement">
<div className="announcement-track">
  <span>{settings.announcement}</span>
  <span>{settings.announcement}</span>
  <span>{settings.announcement}</span>
  <span>{settings.announcement}</span>
</div>
</div>      <header className="container header">
        <a href="#inicio" aria-label="Tendencia Store, inicio">
<img className="logo" src="/logo-tendencia.svg" alt="Logo oficial de Tendencia Store" />        </a>
        <nav className="nav" aria-label="Navegación principal">
          <a href="#inicio">INICIO</a>
          <a href="#categorias">COLECCIONES</a>
          <a href="#productos">TIENDA</a>
          <a href="#contacto">CONTACTO</a>
        </nav>
        <div className="header-actions">
 <button
  className="icon-button"
  aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
  aria-expanded={menuOpen}
  onClick={() => setMenuOpen((v) => !v)}
>            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <nav className={`container mobile-nav${menuOpen ? ' open' : ''}`} aria-label="Navegación móvil">
        {[
          ['#inicio', 'Inicio'],
          ['#categorias', 'Colecciones'],
          ['#productos', 'Tienda'],
          ['#contacto', 'Contacto'],
        ].map(([href, label]) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}>
            {label}
          </a>
        ))}
      </nav>

      <main>
       <section className="container hero" id="inicio">
  <div className="hero-visual">
    {bannerImages.length > 0 ? (
      bannerImages.map((image, index) => (
        <img
          key={image}
          className={`hero-slide${index === activeBanner ? ' active' : ''}`}
          src={image}
          alt={`Banner ${index + 1} de Tendencia Store`}
        />
      ))
    ) : (
      <img
        className="hero-slide active"
        src="/hero.webp"
        alt="Colección de moda femenina de Tendencia Store"
      />
    )}

    {bannerImages.length > 1 && (
      <div className="hero-dots">
        {bannerImages.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`hero-dot${index === activeBanner ? ' active' : ''}`}
            aria-label={`Mostrar banner ${index + 1}`}
            aria-pressed={index === activeBanner}
            onClick={() => setActiveBanner(index)}
          />
        ))}
      </div>
    )}
  </div>
</section>

<div className="container benefits">
  <div className="benefit">
    <span className="benefit-icon"><Heart size={24} /></span>
    <strong>ESTILO ÚNICO</strong>
    <span>Prendas para ti</span>
  </div>



  <div className="benefit">
    <span className="benefit-icon"><MessageCircle size={24} /></span>
    <strong>COMPRA FÁCIL</strong>
    <span>Por WhatsApp</span>
  </div>

  <div className="benefit">
    <span className="benefit-icon"><Truck size={24} /></span>
    <strong>ENVÍOS</strong>
    <span>A nivel nacional</span>
  </div>
</div>

                {usedCategories.length > 0 && (
          <section className="container section" id="categorias">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Encuentra tu estilo</div>
                <h2>Explora las colecciones</h2>
              </div>
              <p>Un look para cada momento.</p>
            </div>
            <div className="category-grid">
              {usedCategories.map((c) => (
                <a key={c.id} className="category-card" href="#productos" onClick={() => pickCategory(c.id)}>
                  {c.image_url && <img loading="lazy" src={c.image_url} alt={`${c.name} de Tendencia Store`} />}
                  <span className="category-title">{c.name}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="container section" id="productos">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Colección Tendencia Store</div>
              <h2>Encuentra tu próximo look</h2>
            </div>
            <p>{products.length} prendas para descubrir. Consulta por WhatsApp.</p>
          </div>
          <div className="filters" role="group" aria-label="Filtrar productos">
            <button className={`filter${filter === 'todos' ? ' active' : ''}`} aria-pressed={filter === 'todos'} onClick={() => setFilter('todos')}>
              Todos
            </button>
            {usedCategories.map((c) => (
              <button key={c.id} className={`filter${filter === c.id ? ' active' : ''}`} aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
          {loading && <div className="empty">Cargando prendas…</div>}
          {error && <div className="empty">{error}</div>}
          {!loading && !error && visible.length === 0 && <div className="empty">Pronto tendremos nuevas prendas.</div>}
          <div className="product-grid">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setSelected} />
            ))}
          </div>
          <p className="note">Los precios que no están indicados se consultan directamente por WhatsApp.</p>
        </section>

        <section className="container editorial">
          <div className="editorial-image">
            <img loading="lazy" src="/editorial.webp" alt="Editorial de moda femenina" />
          </div>
          <div className="editorial-copy">
            <div className="eyebrow">Tendencia Store</div>
            <h2>Tu estilo.<br />Tus reglas.</h2>
            <p>Encuentra piezas que conecten contigo. Explora la colección y consulta disponibilidad, tallas y envíos directamente con nosotros.</p>
            <a className="button" href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
              Hablar por WhatsApp
            </a>
          </div>
        </section>

        
      </main>

      <footer className="footer">
  <div className="container footer-container">

    <div className="footer-brand">
      <img
        className="footer-logo"
        src="/logo-tendencia.svg"
        alt="Tendencia Store"
      />
      <p>Moda · Estilo · Personalidad</p>
    </div>

    <div className="footer-contact">
      <h3>CONTACTO</h3>

 
      <div className="footer-socials">
        <a
  className="footer-whatsapp"
  href={waLink(settings.whatsapp)}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="WhatsApp"
  title="WhatsApp"
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1C18.7 23.6 24 18.3 24 11.8c0-3.1-1.2-6.1-3.5-8.3ZM12.1 21.6c-1.7 0-3.4-.5-4.8-1.3l-.4-.2-3.9 1 1-3.8-.3-.4a9.7 9.7 0 1 1 8.4 4.7Zm5.3-7.3c-.3-.2-1.7-.8-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.7.8.4 1.4.6 1.9.7.8.3 1.5.2 2 .1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.5Z" />
  </svg>
</a>
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.name}
            title={s.name}
          >
            {s.name === 'Instagram' && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="17.5" cy="6.8" r="1.2" fill="currentColor" />
              </svg>
            )}

            {s.name === 'Facebook' && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.3V13h2.8v8h3.4Z" />
              </svg>
            )}

            {s.name === 'TikTok' && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M19.5 7.1c-1.5-.1-2.7-.9-3.4-2.1-.3-.5-.5-1.1-.5-1.7V3h-3.4v12.5c0 1.5-1.2 2.7-2.7 2.7s-2.7-1.2-2.7-2.7 1.2-2.7 2.7-2.7c.3 0 .6 0 .9.1V9.4c-.3 0-.6-.1-.9-.1-3.4 0-6.1 2.7-6.1 6.1s2.7 6.1 6.1 6.1 6.1-2.7 6.1-6.1V9.1c1.1.8 2.5 1.3 3.9 1.3V7.1Z" />
              </svg>
            )}
          </a>
        ))}
      </div>
    </div>

    <div className="copyright">
      © {new Date().getFullYear()} Tendencia Store · Todos los derechos reservados.
    </div>

  </div>
</footer>

      {selected && <QuickView product={selected} whatsapp={settings.whatsapp} onClose={closeModal} onNotify={notify} />}
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </>
  )
}
