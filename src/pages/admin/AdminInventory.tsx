import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types'

type Row = { id: string; product_id: string; size: string; quantity: number; updated_at: string }
export default function AdminInventory() {
  const [rows,setRows] = useState<Row[]>([])
  const [products,setProducts] = useState<Product[]>([])
  const [values,setValues] = useState<Record<string,string>>({})
  const [reasons,setReasons] = useState<Record<string,string>>({})
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  const [busy,setBusy] = useState<string|null>(null)
  const load = useCallback(async()=>{
    const [i,p] = await Promise.all([supabase.from('inventory').select('*').order('updated_at',{ascending:false}),supabase.from('products').select('*').order('name')])
    if(i.error||p.error){setError(i.error?.message||p.error?.message||'No se pudo cargar el inventario.');return}
    setRows((i.data??[]) as Row[]);setProducts((p.data??[]) as Product[])
    setValues(Object.fromEntries((i.data??[]).map((r:any)=>[r.id,String(r.quantity)])))
  },[])
  useEffect(()=>{void load()},[load])
  const productName=(id:string)=>products.find(p=>p.id===id)?.name??'Prenda eliminada'
  async function save(row:Row){
    const quantity=Number(values[row.id]);if(!Number.isInteger(quantity)||quantity<0){setError('La existencia debe ser un número entero igual o mayor a cero.');return}
    setBusy(row.id);setError('');setMessage('')
    const {error:err}=await supabase.rpc('adjust_inventory',{p_product_id:row.product_id,p_size:row.size,p_new_quantity:quantity,p_reason:reasons[row.id]||'Ajuste manual desde inventario'})
    setBusy(null);if(err){setError(err.message);return}setMessage(`Stock actualizado: ${productName(row.product_id)} · ${row.size}`);await load()
  }
  return <><div className="bar"><div><h1>Inventario</h1><p className="sub" style={{margin:0}}>Existencias independientes por prenda y talla.</p></div><button className="btn ghost" onClick={()=>void load()}><RefreshCw size={15}/> Actualizar</button></div>
    <div className="pos-inventory-note">Los ajustes quedan registrados en el historial. Las ventas del POS descuentan estas existencias automáticamente.</div>
    {error&&<div className="error">{error}</div>}{message&&<div className="okmsg">{message}</div>}
    <div className="card" style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Prenda</th><th>Talla</th><th>Existencia</th><th>Motivo del ajuste</th><th/></tr></thead><tbody>
      {rows.map(row=><tr key={row.id}><td><strong>{productName(row.product_id)}</strong></td><td>{row.size}</td><td><input className="input" style={{maxWidth:100}} type="number" min="0" step="1" value={values[row.id]??row.quantity} onChange={e=>setValues(v=>({...v,[row.id]:e.target.value}))}/></td><td><input className="input" placeholder="Ej. Conteo físico" value={reasons[row.id]??''} onChange={e=>setReasons(v=>({...v,[row.id]:e.target.value}))}/></td><td><button className="btn pink small" disabled={busy===row.id} onClick={()=>void save(row)}>{busy===row.id?'Guardando…':'Guardar'}</button></td></tr>)}
      {rows.length===0&&<tr><td colSpan={5}>No hay tallas inicializadas. Ejecuta la migración SQL 002_pos.sql.</td></tr>}
    </tbody></table></div>
  </>
}
