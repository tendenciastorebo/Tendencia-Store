import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { resizeImage } from '../lib/image'

interface Props {
  value: string | null
  onChange: (url: string) => void
}

/** Sube la foto al bucket público "productos" de Supabase Storage. */
export default function ImageUpload({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const blob = await resizeImage(file)
      const path = `${crypto.randomUUID()}.webp`
      const { error: upErr } = await supabase.storage.from('productos').upload(path, blob, {
        contentType: 'image/webp',
        cacheControl: '31536000',
      })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('productos').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {value ? <img className="preview" src={value} alt="Vista previa" /> : <div className="preview" />}
        <div>
          <input type="file" accept="image/*" disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} />
          <small style={{ display: 'block', color: '#737373', marginTop: 6 }}>
            {busy ? 'Subiendo foto…' : 'JPG, PNG o WebP. Se optimiza automáticamente.'}
          </small>
        </div>
      </div>
      {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  )
}
