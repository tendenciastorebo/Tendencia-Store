
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DEFAULT_SETTINGS, type Settings } from '../../types'

type BannerField = 'hero_image_1' | 'hero_image_2' | 'hero_image_3'

const banners: { field: BannerField; title: string }[] = [
  { field: 'hero_image_1', title: 'Banner 1' },
  { field: 'hero_image_2', title: 'Banner 2' },
  { field: 'hero_image_3', title: 'Banner 3' },
]

export default function AdminSettings() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<BannerField | null>(null)

  useEffect(() => {
    void supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
          return
        }
        if (data) setS({ ...DEFAULT_SETTINGS, ...data } as Settings)
      })
  }, [])

  async function save() {
    setMsg('')
    setError('')

    const digits = s.whatsapp.replace(/\D/g, '')
    if (digits.length < 8) {
      setError('El número de WhatsApp no es válido.')
      return
    }

    const { error: err } = await supabase
      .from('settings')
      .update({
        whatsapp: digits.length === 8 ? `591${digits}` : digits,
        announcement: s.announcement,
        hero_title: s.hero_title,
        hero_text: s.hero_text,
        instagram: s.instagram?.trim() || null,
        facebook: s.facebook?.trim() || null,
        tiktok: s.tiktok?.trim() || null,
      })
      .eq('id', 1)

    if (err) {
      setError(err.message)
      return
    }

    setMsg('Ajustes guardados.')
  }

  async function uploadBanner(field: BannerField, file?: File) {
    if (!file) return

    setMsg('')
    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('La imagen no debe superar los 8 MB.')
      return
    }

    setUploading(field)

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${field}-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(null)
      return
    }

    const { data } = supabase.storage.from('banners').getPublicUrl(path)
    const publicUrl = data.publicUrl

    const { error: saveError } = await supabase
      .from('settings')
      .update({ [field]: publicUrl })
      .eq('id', 1)

    if (saveError) {
      setError(saveError.message)
      setUploading(null)
      return
    }

    setS((current) => ({ ...current, [field]: publicUrl }))
    setMsg('Imagen subida correctamente.')
    setUploading(null)
  }

  async function removeBanner(field: BannerField) {
    setMsg('')
    setError('')

    const currentUrl = s[field]

    const { error: saveError } = await supabase
      .from('settings')
      .update({ [field]: null })
      .eq('id', 1)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setS((current) => ({ ...current, [field]: null }))

    if (currentUrl) {
      const marker = '/storage/v1/object/public/banners/'
      const index = currentUrl.indexOf(marker)

      if (index !== -1) {
        const path = decodeURIComponent(currentUrl.slice(index + marker.length))
        const { error: removeError } = await supabase.storage
          .from('banners')
          .remove([path])

        if (removeError) setError(removeError.message)
      }
    }

    setMsg('Banner eliminado.')
  }

  const set = (k: keyof Settings, v: string) =>
    setS((current) => ({ ...current, [k]: v }))

  return (
    <>
      <h1>Ajustes</h1>
      <p className="sub">Textos, contacto y banners de la tienda.</p>

      {msg && <div className="okmsg">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2>Banners de portada</h2>
        <p>Sube hasta tres imágenes horizontales. Recomendado: 1200 × 600 px.</p>

        <div className="grid2">
          {banners.map(({ field, title }) => (
            <div className="field" key={field}>
              <span>{title}</span>

              {s[field] ? (
                <img
                  src={s[field] as string}
                  alt={title}
                  style={{
                    width: '100%',
                    aspectRatio: '2 / 1',
                    objectFit: 'cover',
                    borderRadius: 12,
                  }}
                />
              ) : (
                <div
                  style={{
                    aspectRatio: '2 / 1',
                    background: '#f7edf2',
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#a9366c',
                  }}
                >
                  Sin imagen
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                disabled={uploading !== null}
                onChange={(e) => {
                  void uploadBanner(field, e.target.files?.[0])
                  e.currentTarget.value = ''
                }}
              />

              {uploading === field && <small>Subiendo imagen...</small>}

              {s[field] && (
                <button
                  type="button"
                  className="btn"
                  disabled={uploading !== null}
                  onClick={() => void removeBanner(field)}
                >
                  Eliminar imagen
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="field">
          <span>WhatsApp de la tienda</span>
          <input
            className="input"
            value={s.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value)}
          />
          <small>Con código de país (591) o solo los 8 dígitos. Ej: 69141918</small>
        </label>

        <label className="field">
          <span>Mensaje de la barra negra superior</span>
          <input
            className="input"
            value={s.announcement}
            onChange={(e) => set('announcement', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Título principal</span>
          <input
            className="input"
            value={s.hero_title}
            onChange={(e) => set('hero_title', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Texto principal</span>
          <textarea
            className="input"
            rows={3}
            value={s.hero_text}
            onChange={(e) => set('hero_text', e.target.value)}
          />
        </label>

        <div className="grid2">
          <label className="field">
            <span>Instagram (enlace)</span>
            <input
              className="input"
              placeholder="https://instagram.com/..."
              value={s.instagram ?? ''}
              onChange={(e) => set('instagram', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Facebook (enlace)</span>
            <input
              className="input"
              placeholder="https://facebook.com/..."
              value={s.facebook ?? ''}
              onChange={(e) => set('facebook', e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>TikTok (enlace)</span>
          <input
            className="input"
            placeholder="https://tiktok.com/@..."
            value={s.tiktok ?? ''}
            onChange={(e) => set('tiktok', e.target.value)}
          />
        </label>

        <button className="btn pink" onClick={() => void save()}>
          Guardar ajustes
        </button>
      </div>
    </>
  )
}
