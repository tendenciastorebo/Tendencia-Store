import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DEFAULT_SETTINGS, type Settings } from '../../types'

export default function AdminSettings() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void supabase.from('settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setS(data as Settings)
    })
  }, [])

  async function save() {
    setMsg('')
    setError('')
    const digits = s.whatsapp.replace(/\D/g, '')
    if (digits.length < 8) return setError('El número de WhatsApp no es válido.')
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
    if (err) return setError(err.message)
    setMsg('Ajustes guardados.')
  }

  const set = (k: keyof Settings, v: string) => setS({ ...s, [k]: v })

  return (
    <>
      <h1>Ajustes</h1>
      <p className="sub">Textos y contacto de la tienda.</p>
      {msg && <div className="okmsg">{msg}</div>}
      {error && <div className="error">{error}</div>}
      <div className="card">
        <label className="field">
          <span>WhatsApp de la tienda</span>
          <input className="input" value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          <small>Con código de país (591) o solo los 8 dígitos. Ej: 69141918</small>
        </label>
        <label className="field">
          <span>Mensaje de la barra negra superior</span>
          <input className="input" value={s.announcement} onChange={(e) => set('announcement', e.target.value)} />
        </label>
        <label className="field">
          <span>Título principal</span>
          <input className="input" value={s.hero_title} onChange={(e) => set('hero_title', e.target.value)} />
          <small>Si escribes dos frases separadas por ". " se muestran en dos líneas.</small>
        </label>
        <label className="field">
          <span>Texto principal</span>
          <textarea className="input" rows={3} value={s.hero_text} onChange={(e) => set('hero_text', e.target.value)} />
        </label>
        <div className="grid2">
          <label className="field"><span>Instagram (enlace)</span><input className="input" placeholder="https://instagram.com/..." value={s.instagram ?? ''} onChange={(e) => set('instagram', e.target.value)} /></label>
          <label className="field"><span>Facebook (enlace)</span><input className="input" placeholder="https://facebook.com/..." value={s.facebook ?? ''} onChange={(e) => set('facebook', e.target.value)} /></label>
        </div>
        <label className="field"><span>TikTok (enlace)</span><input className="input" placeholder="https://tiktok.com/@..." value={s.tiktok ?? ''} onChange={(e) => set('tiktok', e.target.value)} /></label>
        <button className="btn pink" onClick={() => void save()}>Guardar ajustes</button>
      </div>
    </>
  )
}
