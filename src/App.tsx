import { Navigate, Route, Routes } from 'react-router-dom'
import Store from './pages/Store'
import AdminLayout from './pages/admin/AdminLayout'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminSettings from './pages/admin/AdminSettings'
import AdminPOS from './pages/admin/AdminPOS'
import AdminInventory from './pages/admin/AdminInventory'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Store />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="punto-de-venta" replace />} />
        <Route path="punto-de-venta" element={<AdminPOS />} />
        <Route path="inventario" element={<AdminInventory />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="ajustes" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
