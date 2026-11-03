import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type AuthState = 'loading' | 'out' | 'not-admin' | 'admin' | 'seller'

export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [state, setState] = useState<AuthState>('loading')

  const check = useCallback(async (s: Session | null) => {
    setSession(s)
    if (!s) return setState('out')
    const admin = await supabase.rpc('is_admin')
    if (!admin.error && admin.data === true) { setState('admin'); return }
    const staff = await supabase.rpc('is_staff')
    setState(!staff.error && staff.data === true ? 'seller' : 'not-admin')
  }, [])

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Se difiere para no bloquear el cliente de Supabase dentro del callback.
      setTimeout(() => void check(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [check])

  const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return { session, state, signIn, signOut }
}
