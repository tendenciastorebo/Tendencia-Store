import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
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

  const generic = waLink(settings.whatsapp, 'Hola Tendencia Store, quiero hacer un pedido por WhatsApp.')
  const pickCategory = (id: string) => {
    setFilter(id)
    setMenuOpen(false)
  }
  const [heroLine1, ...heroRest] = settings.hero_title.split('. ')
  const heroTitle = heroRest.length ? (
    <>
      {heroLine1}.<br />
      {heroRest.join('. ')}
    </>
  ) : (
    settings.hero_title
  )
  const socials = [
    { name: 'Instagram', url: settings.instagram },
    { name: 'Facebook', url: settings.facebook },
    { name: 'TikTok', url: settings.tiktok },
  ].filter((s) => s.url)
  const phoneShown = settings.whatsapp.replace(/^591/, '')

  return (
    <>
      <div className="announcement">{settings.announcement}</div>
      <header className="container header">
        <a href="#inicio" aria-label="Tendencia Store, inicio">
          <img className="logo" src="/logo.svg" alt="Logo oficial de Tendencia Store" />
        </a>
        <nav className="nav" aria-label="Navegación principal">
          <a href="#inicio">INICIO</a>
          <a href="#categorias">COLECCIONES</a>
          <a href="#productos">TIENDA</a>
          <a href="#contacto">CONTACTO</a>
        </nav>
        <div className="header-actions">
          <a className="button header-order" href={generic} target="_blank" rel="noopener noreferrer">
            Pedido por WhatsApp
          </a>
          <button
            className="icon-button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
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
          <div className="hero-copy">
            <div className="eyebrow">Tu próxima prenda favorita</div>
            <h1>{heroTitle}</h1>
            <p>{settings.hero_text}</p>
            <div className="button-row">
              <a className="button" href={generic} target="_blank" rel="noopener noreferrer">
                Pedido por WhatsApp
              </a>
              <a className="button button-outline" href="#categorias">
                Explorar colecciones
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/hero.webp" alt="Colección de moda femenina de Tendencia Store" />
            <div className="hero-tag">NUEVA TEMPORADA · 2026</div>
          </div>
        </section>

        <div className="container benefits">
          <div className="benefit"><strong>ESTILO PARA TI</strong>Prendas elegidas con personalidad</div>
          <div className="benefit"><strong>COMPRA FÁCIL</strong>Pedidos directos por WhatsApp</div>
          <div className="benefit"><strong>ENVÍOS</strong>Consulta cobertura en Bolivia</div>
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

        <section className="container contact-banner" id="contacto">
          <div>
            <div className="eyebrow">Estamos para ayudarte</div>
            <h2>¿Lista para encontrar tu próximo look?</h2>
            <p>Consulta tallas, disponibilidad y opciones de entrega.</p>
          </div>
          <a className="button" href={waLink(settings.whatsapp, 'Hola Tendencia Store, quiero consultar por sus productos.')} target="_blank" rel="noopener noreferrer">
            Pedido por WhatsApp
          </a>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <img className="footer-logo" src="/logo.svg" alt="Logo oficial de Tendencia Store" />
              <p>Moda · Estilo · Personalidad<br />Pedidos únicamente por WhatsApp: {phoneShown}.</p>
            </div>
            <div>
              <h3>Explora</h3>
              <p>
                {usedCategories.map((c) => (
                  <span key={c.id}>
                    <a href="#productos" onClick={() => pickCategory(c.id)}>{c.name}</a>
                    <br />
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h3>Contacto</h3>
              <p>
                <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp: {phoneShown}</a>
                <br />
                Bolivia
                {socials.map((s) => (
                  <span key={s.name}>
                    <br />
                    <a href={s.url ?? '#'} target="_blank" rel="noopener noreferrer">{s.name}</a>
                  </span>
                ))}
              </p>
            </div>
          </div>
          <div className="copyright">© {new Date().getFullYear()} Tendencia Store · Todos los derechos reservados.</div>
        </div>
      </footer>

      {selected && <QuickView product={selected} whatsapp={settings.whatsapp} onClose={closeModal} onNotify={notify} />}
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </>
  )
}
