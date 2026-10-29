import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types'
import ImageUpload from '../../components/ImageUpload'

interface Draft {
  id?: string
  name: string
  image_url: string
  sort_order: string
  active: boolean
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('categories').select('*').order('sort_order')
    if (err) setError(err.message)
    setItems((data ?? []) as Category[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    if (!draft) return
    if (!draft.name.trim()) return setError('Escribe el nombre de la categoría.')
    const row = {
      name: draft.name.trim(),
      slug: slugify(draft.name),
      image_url: draft.image_url || null,
      sort_order: Number(draft.sort_order) || 0,
      active: draft.active,
    }
    const res = draft.id
      ? await supabase.from('categories').update(row).eq('id', draft.id)
      : await supabase.from('categories').insert(row)
    if (res.error) return setError(res.error.message.includes('duplicate') ? 'Ya existe una categoría con ese nombre.' : res.error.message)
    setDraft(null)
    setError('')
    await load()
  }

  async function remove(c: Category) {
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"? Sus prendas quedarán sin categoría.`)) return
    const { error: err } = await supabase.from('categories').delete().eq('id', c.id)
    if (err) setError(err.message)
    await load()
  }

  return (
    <>
      <div className="bar">
        <div>
          <h1>Categorías</h1>
          <p className="sub" style={{ margin: 0 }}>Solo aparecen en la tienda las categorías que tengan prendas visibles.</p>
        </div>
        <button className="btn pink" onClick={() => { setError(''); setDraft({ name: '', image_url: '', sort_order: String(items.length + 1), active: true }) }}>
          <Plus size={16} /> Nueva categoría
        </button>
      </div>
      {error && !draft && <div className="error">{error}</div>}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>Foto</th><th>Nombre</th><th>Orden</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.image_url ? <img className="thumb" src={c.image_url} alt="" /> : '—'}</td>
                <td><strong>{c.name}</strong></td>
                <td>{c.sort_order}</td>
                <td><span className={`tag ${c.active ? 'ok' : 'off'}`}>{c.active ? 'Activa' : 'Oculta'}</span></td>
                <td>
                  <div className="actions">
                    <button className="btn ghost small" aria-label={`Editar ${c.name}`} onClick={() => { setError(''); setDraft({ id: c.id, name: c.name, image_url: c.image_url ?? '', sort_order: String(c.sort_order), active: c.active }) }}><Pencil size={14} /></button>
                    <button className="btn danger small" aria-label={`Eliminar ${c.name}`} onClick={() => void remove(c)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {draft && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setDraft(null) }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h1>{draft.id ? 'Editar categoría' : 'Nueva categoría'}</h1>
            {error && <div className="error">{error}</div>}
            <label className="field">
              <span>Nombre</span>
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <div className="field">
              <span>Foto de portada (opcional)</span>
              <ImageUpload value={draft.image_url || null} onChange={(url) => setDraft({ ...draft, image_url: url })} />
            </div>
            <label className="field">
              <span>Orden</span>
              <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
            </label>
            <label className="check" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Activa
            </label>
            <div className="actions">
              <button className="btn pink" onClick={() => void save()}>Guardar</button>
              <button className="btn ghost" onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
