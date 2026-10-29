# Tendencia Store · Guía paso a paso

Tienda online de ropa femenina. Los pedidos se hacen **solo por WhatsApp** (no hay carrito ni pagos en la web).
Tecnología: React + Vite + TypeScript, Supabase (base de datos, usuarios y fotos) y Vercel (publicación).

Todo lo que se hace aquí es gratis para empezar. Sigue los pasos **en orden**.

---

## Paso 1 · Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea una cuenta (puedes usar tu cuenta de Google).
2. Pulsa **New project**. Ponle el nombre `tendencia-store`, inventa una contraseña de base de datos (guárdala) y elige la región **South America (São Paulo)**.
3. Espera 1–2 minutos a que termine de crearse.

## Paso 2 · Crear las tablas y los datos iniciales

1. En Supabase, menú izquierdo: **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` de este proyecto, copia **todo** su contenido y pégalo en el editor.
3. Pulsa **Run**. Debe decir *Success*.

Esto crea: categorías, productos, pedidos, ajustes, la seguridad, la carpeta pública de fotos y las 14 prendas de ejemplo.

## Paso 3 · Crear el usuario administrador

> Se hace desde el panel de Supabase (es la forma segura; no se crean usuarios con SQL directo).

1. Menú izquierdo: **Authentication** → **Users** → **Add user** → **Create new user**.
2. Correo: `tendenciastore.bo@gmail.com`
3. Contraseña: elige una segura y guárdala.
4. Marca **Auto Confirm User** y pulsa **Create user**.

El correo ya quedó autorizado como administrador por el SQL del paso 2.
(Si algún día quieres otro administrador: crea su usuario igual y en **SQL Editor** ejecuta
`insert into public.admins (email) values ('correo@ejemplo.com');`)

## Paso 4 · Copiar las 2 claves de Supabase

1. Menú izquierdo: **Project Settings** (engranaje) → **API**.
2. Copia:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **anon public** (clave "anon") → será `VITE_SUPABASE_ANON_KEY`

⚠️ **Nunca uses la clave `service_role`.** Esta tienda solo necesita las dos de arriba.

## Paso 5 · Probar en tu computadora (opcional)

Necesitas tener instalado Node.js (https://nodejs.org, versión LTS).

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```
Abre `.env` y pega tus dos claves. Luego:
```bash
npm run dev
```
Abre http://localhost:5173 (tienda) y http://localhost:5173/admin (panel).

## Paso 6 · Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub (cuenta gratis en https://github.com).
   *(El archivo `.env` NO se sube; ya está excluido.)*
2. Entra a https://vercel.com con tu cuenta de GitHub → **Add New… → Project** → elige el repositorio → **Import**.
3. En **Environment Variables** agrega las dos variables:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu clave anon public
4. Pulsa **Deploy**. En 1 minuto tendrás tu enlace (por ejemplo `tendencia-store.vercel.app`).
5. Para usar tu propio dominio: Vercel → Settings → Domains.

## Paso 7 · Usar el panel administrador

Entra a `tu-enlace.vercel.app/admin` con tu correo y contraseña del paso 3.

| Sección | Para qué sirve |
|---|---|
| **Productos** | Agregar, editar y eliminar prendas. Subir fotos, precio, tallas, etiqueta NUEVO/FAVORITO, ocultar o marcar AGOTADO. |
| **Categorías** | Crear categorías (Blusas, Pantalones…) y su foto de portada. |
| **Pedidos** | Lista de consultas: cada vez que una clienta toca "Pedido por WhatsApp" queda registrada (nombre, prenda, talla, precio). Marca el estado: nuevo / contactado / vendido / cancelado. |
| **Ajustes** | Número de WhatsApp, mensaje de la barra negra, título y texto principal, enlaces de Instagram/Facebook/TikTok. |

**Los cambios se ven en la tienda al instante, sin volver a publicar nada.**

### Reglas de tallas y precios
- Solo se muestran las tallas que tú marques. Si una prenda es solo talla M, la clienta verá un único botón "M".
- Para conjuntos con tallas distintas por pieza, escribe en *Detalle de talla*: `Blusa talla S · Pantalón talla M`.
- Si dejas el precio vacío, la tienda muestra "Consultar precio".

## Mensaje de WhatsApp (ya incluido)

Sin emojis y con el texto aprobado: nombre de la prenda, talla y precio publicado de la prenda elegida, consultando disponibilidad y opciones de entrega. El pedido no se da por confirmado en la web.

## Datos de ejemplo que debes revisar

Las 14 prendas se cargaron con los datos de la vista previa aprobada. Revisa en **Productos** estos dos, que no aparecían confirmados en tus notas:
- *Enterizo negro con brillos*: talla L, Bs 99
- *Vestido negro 3/4 asimétrico*: talla M, Bs 90

## Estructura del proyecto

```
supabase/schema.sql      Base de datos, seguridad y datos iniciales
src/pages/Store.tsx      Tienda pública
src/pages/admin/         Panel administrador
src/components/          Tarjeta de producto, ventana emergente, subida de fotos
src/lib/                 Conexión a Supabase, mensaje de WhatsApp, utilidades
src/styles/tokens.css    Colores y tipografías (negro, blanco y rosado #F472A8)
public/                  Logo SVG y fotos iniciales
```

## Problemas frecuentes

- **"Falta conectar Supabase"** → faltan las 2 variables de entorno (Paso 5 o 6). En Vercel, después de agregarlas, haz *Redeploy*.
- **"Sin permisos" al entrar al admin** → el correo con el que entraste no está en la tabla `admins` (Paso 3).
- **No cargan las prendas** → revisa que el SQL del Paso 2 terminó en *Success*.
- **No puedo subir fotos** → confirma que entraste como administrador y que el SQL creó el bucket `productos` (Storage).
