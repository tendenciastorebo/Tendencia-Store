import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Order, OrderStatus } from '../../types'

const STATUSES: OrderStatus[] = ['nuevo', 'contactado', 'vendido', 'cancelado']

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'todos' | OrderStatus>('todos')

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300)
    if (err) setError(err.message)
    setOrders((data ?? []) as Order[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(o: Order, status: OrderStatus) {
    const { error: err } = await supabase.from('orders').update({ status }).eq('id', o.id)
    if (err) setError(err.message)
    await load()
  }

  async function remove(o: Order) {
    if (!window.confirm('¿Eliminar este registro?')) return
    const { error: err } = await supabase.from('orders').delete().eq('id', o.id)
    if (err) setError(err.message)
    await load()
  }

  const shown = filter === 'todos' ? orders : orders.filter((o) => o.status === filter)
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <div className="bar">
        <div>
          <h1>Pedidos</h1>
          <p className="sub" style={{ margin: 0 }}>
            Cada vez que una clienta toca "Pedido por WhatsApp" queda aquí como consulta. La venta se cierra por WhatsApp.
          </p>
        </div>
        <select className="input" style={{ width: 180 }} value={filter} onChange={(e) => setFilter(e.target.value as 'todos' | OrderStatus)} aria-label="Filtrar por estado">
          <option value="todos">Todos</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Clienta</th><th>Prenda</th><th className="hide-sm">Talla</th><th className="hide-sm">Precio</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id}>
                <td>{fmt(o.created_at)}</td>
                <td><strong>{o.customer_name}</strong></td>
                <td>{o.product_name}</td>
                <td className="hide-sm">{o.size ?? '—'}</td>
                <td className="hide-sm">{o.price_text ?? '—'}</td>
                <td>
                  <select className="input" value={o.status} onChange={(e) => void setStatus(o, e.target.value as OrderStatus)} aria-label="Estado del pedido">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="btn danger small" aria-label="Eliminar" onClick={() => void remove(o)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} style={{ color: '#737373' }}>No hay consultas todavía.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
