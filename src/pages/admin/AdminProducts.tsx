import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Category, Product } from '../../types'
import { formatPrice } from '../../lib/whatsapp'
import ImageUpload from '../../components/ImageUpload'

const SIZE_CHOICES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']

interface Draft {
  id?: string
  name: string
  category_id: string
  price: string
  sizes: string[]
  size_detail: string
  image_url: string
  badge: string
  active: boolean
  available: boolean
  sort_order: string
}

const emptyDraft = (order: number): Draft => ({
  name: '',
  category_id: '',
  price: '',
  sizes: [],
  size_detail: '',
  image_url: '',
  badge: '',
  active: true,
  available: true,
  sort_order: String(order),
})

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (p.error) setError(p.error.message)
    setProducts((p.data ?? []) as Product[])
    setCategories((c.data ?? []) as Category[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '—'

  function edit(p: Product) {
    setError('')
    setDraft({
      id: p.id,
      name: p.name,
      category_id: p.category_id ?? '',
      price: p.price === null ? '' : String(p.price),
      sizes: p.sizes,
      size_detail: p.size_detail ?? '',
      image_url: p.image_url,
      badge: p.badge ?? '',
      active: p.active,
      available: p.available,
      sort_order: String(p.sort_order),
    })
  }

  async function save() {
    if (!draft) return
    if (!draft.name.trim()) return setError('Escribe el nombre de la prenda.')
    if (!draft.image_url) return setError('Sube una foto de la prenda.')
    const priceNum = draft.price.trim() === '' ? null : Number(draft.price.replace(',', '.'))
    if (priceNum !== null && (Number.isNaN(priceNum) || priceNum < 0)) return setError('El precio no es válido.')
    setSaving(true)
    setError('')
    const row = {
      name: draft.name.trim(),
      category_id: draft.category_id || null,
      price: priceNum,
      sizes: draft.sizes,
      size_detail: draft.size_detail.trim() || null,
      image_url: draft.image_url,
      badge: draft.badge.trim() || null,
      active: draft.active,
      available: draft.available,
      sort_order: Number(draft.sort_order) || 0,
    }
    const res = draft.id
      ? await supabase.from('products').update(row).eq('id', draft.id)
      : await supabase.from('products').insert(row)
    setSaving(false)
    if (res.error) return setError(res.error.message)
    setDraft(null)
    await load()
  }

  async function toggle(p: Product, field: 'active' | 'available') {
    const { error: err } = await supabase.from('products').update({ [field]: !p[field] }).eq('id', p.id)
    if (err) setError(err.message)
    await load()
  }

  async function remove(p: Product) {
    if (!window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return
    const { error: err } = await supabase.from('products').delete().eq('id', p.id)
    if (err) setError(err.message)
    await load()
  }

  return (
    <>
      <div className="bar">
        <div>
          <h1>Productos</h1>
          <p className="sub" style={{ margin: 0 }}>Los cambios se ven al instante en la tienda.</p>
        </div>
        <button className="btn pink" onClick={() => { setError(''); setDraft(emptyDraft(products.length + 1)) }}>
          <Plus size={16} /> Nueva prenda
        </button>
      </div>
      {error && !draft && <div className="error">{error}</div>}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Foto</th><th>Prenda</th><th className="hide-sm">Categoría</th><th>Precio</th>
              <th className="hide-sm">Tallas</th><th>Visible</th><th>Disponible</th><th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><img className="thumb" src={p.image_url} alt="" /></td>
                <td><strong>{p.name}</strong></td>
                <td className="hide-sm">{catName(p.category_id)}</td>
                <td>{formatPrice(p.price)}</td>
                <td className="hide-sm">{p.size_detail || p.sizes.join(', ') || '—'}</td>
                <td>
                  <button className={`tag ${p.active ? 'ok' : 'off'}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => void toggle(p, 'active')}>
                    {p.active ? 'Sí' : 'Oculto'}
                  </button>
                </td>
                <td>
                  <button className={`tag ${p.available ? 'ok' : 'off'}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => void toggle(p, 'available')}>
                    {p.available ? 'Sí' : 'Agotado'}
                  </button>
                </td>
                <td>
                  <div className="actions">
                    <button className="btn ghost small" onClick={() => edit(p)} aria-label={`Editar ${p.name}`}><Pencil size={14} /></button>
                    <button className="btn danger small" onClick={() => void remove(p)} aria-label={`Eliminar ${p.name}`}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={8} style={{ color: '#737373' }}>Todavía no hay prendas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setDraft(null) }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h1>{draft.id ? 'Editar prenda' : 'Nueva prenda'}</h1>
            {error && <div className="error">{error}</div>}
            <div className="field">
              <span>Foto</span>
              <ImageUpload value={draft.image_url || null} onChange={(url) => setDraft({ ...draft, image_url: url })} />
            </div>
            <label className="field">
              <span>Nombre</span>
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <div className="grid2">
              <label className="field">
                <span>Categoría</span>
                <select className="input" value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Precio (Bs)</span>
                <input className="input" inputMode="decimal" placeholder="Vacío = Consultar precio" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              </label>
            </div>
            <div className="field">
              <span>Tallas disponibles</span>
              <div className="chips">
                {SIZE_CHOICES.map((s) => {
                  const on = draft.sizes.includes(s)
                  return (
                    <button key={s} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on}
                      onClick={() => setDraft({ ...draft, sizes: on ? draft.sizes.filter((x) => x !== s) : [...draft.sizes, s] })}>
                      {s}
                    </button>
                  )
                })}
              </div>
              <small>Solo se muestran las tallas que marques. Si no marcas ninguna, la clienta verá "Consultar talla".</small>
            </div>
            <label className="field">
              <span>Detalle de talla (opcional)</span>
              <input className="input" placeholder="Ej: Blusa talla S · Pantalón talla M" value={draft.size_detail} onChange={(e) => setDraft({ ...draft, size_detail: e.target.value })} />
              <small>Si escribes algo aquí, reemplaza a los botones de talla (útil para conjuntos o "S-M").</small>
            </label>
            <div className="grid2">
              <label className="field">
                <span>Etiqueta</span>
                <select className="input" value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })}>
                  <option value="">Ninguna</option>
                  <option value="NUEVO">NUEVO</option>
                  <option value="FAVORITO">FAVORITO</option>
                  <option value="OFERTA">OFERTA</option>
                </select>
              </label>
              <label className="field">
                <span>Orden</span>
                <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
              <label className="check"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Visible en la tienda</label>
              <label className="check"><input type="checkbox" checked={draft.available} onChange={(e) => setDraft({ ...draft, available: e.target.checked })} /> Disponible (si no, aparece AGOTADO)</label>
            </div>
            <div className="actions">
              <button className="btn pink" disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : 'Guardar'}</button>
              <button className="btn ghost" onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
