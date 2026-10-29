import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && anonKey)

// Si faltan las variables, se crea un cliente "vacío" y la web muestra un aviso claro.
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'sin-configurar')
