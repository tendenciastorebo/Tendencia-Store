-- ============================================================
-- TENDENCIA STORE · Base de datos completa (Supabase)
-- Pégalo ENTERO en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar más de una vez sin romper nada.
-- ============================================================

-- 1) TABLAS ---------------------------------------------------
create table if not exists public.admins (
  email text primary key
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  price numeric(10,2),                  -- vacío = "Consultar precio"
  sizes text[] not null default '{}',   -- tallas que se muestran como botones (ej. {M} o {S,M})
  size_detail text,                     -- texto libre (ej. "Blusa talla S · Pantalón talla M")
  image_url text not null,
  badge text,                           -- NUEVO / FAVORITO / vacío
  active boolean not null default true,     -- visible en la tienda
  available boolean not null default true,  -- false = AGOTADO
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text,
  price_text text,
  status text not null default 'nuevo' check (status in ('nuevo','contactado','vendido','cancelado')),
  notes text
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  whatsapp text not null default '59169141918',
  announcement text not null default 'Nueva temporada · Envíos a toda Bolivia · Atención por WhatsApp',
  hero_title text not null default 'Viste como te sientes.',
  hero_text text not null default 'Descubre vestidos, conjuntos y enterizos para expresar tu estilo. Consulta tallas, disponibilidad y precios directamente con nosotros.',
  instagram text,
  facebook text,
  tiktok text
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- 2) FUNCIÓN: ¿el usuario es administrador? -------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 3) SEGURIDAD (RLS) ------------------------------------------
alter table public.admins     enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.settings   enable row level security;

drop policy if exists "admins ven su fila" on public.admins;
create policy "admins ven su fila" on public.admins for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Categorías
drop policy if exists "categorias publicas" on public.categories;
create policy "categorias publicas" on public.categories for select using (active or public.is_admin());
drop policy if exists "categorias admin" on public.categories;
create policy "categorias admin" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Productos
drop policy if exists "productos publicos" on public.products;
create policy "productos publicos" on public.products for select using (active or public.is_admin());
drop policy if exists "productos admin" on public.products;
create policy "productos admin" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Ajustes
drop policy if exists "ajustes publicos" on public.settings;
create policy "ajustes publicos" on public.settings for select using (true);
drop policy if exists "ajustes admin" on public.settings;
create policy "ajustes admin" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Pedidos: cualquiera puede registrar una consulta; solo el admin la ve y gestiona
drop policy if exists "pedidos crear" on public.orders;
create policy "pedidos crear" on public.orders for insert to anon, authenticated
  with check (status = 'nuevo' and notes is null);
drop policy if exists "pedidos admin" on public.orders;
create policy "pedidos admin" on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 4) ALMACENAMIENTO DE FOTOS (bucket público "productos") -----
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas" on storage.objects for select using (bucket_id = 'productos');
drop policy if exists "fotos admin subir" on storage.objects;
create policy "fotos admin subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.is_admin());
drop policy if exists "fotos admin editar" on storage.objects;
create policy "fotos admin editar" on storage.objects for update to authenticated
  using (bucket_id = 'productos' and public.is_admin());
drop policy if exists "fotos admin borrar" on storage.objects;
create policy "fotos admin borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and public.is_admin());

-- 5) ADMINISTRADOR --------------------------------------------
-- (El usuario con contraseña se crea desde el panel de Supabase: ver LEEME.md, paso 3)
insert into public.admins (email) values ('tendenciastore.bo@gmail.com') on conflict do nothing;

-- 6) DATOS INICIALES (categorías + las 14 prendas de ejemplo) --
insert into public.categories (name, slug, image_url, sort_order) values
  ('Vestidos',   'vestidos',   '/productos/vestido-azul.webp',          1),
  ('Conjuntos',  'conjuntos',  '/productos/conjunto-negro-gamuza.webp', 2),
  ('Enterizos',  'enterizos',  '/productos/enterizo-negro-brillos.webp',3),
  ('Blusas',     'blusas',     null,                                    4),
  ('Pantalones', 'pantalones', null,                                    5)
on conflict (slug) do nothing;

-- Solo se cargan si la tabla de productos está vacía
insert into public.products (category_id, name, price, sizes, size_detail, image_url, badge, sort_order)
select c.id, v.name, v.price, v.sizes, v.size_detail, v.image_url, v.badge, v.ord
from (values
  ('conjuntos','Conjunto negro de gamuza premium',150::numeric, '{}'::text[], 'Blusa talla S · Pantalón talla M','/productos/conjunto-negro-gamuza.webp','NUEVO',1),
  ('conjuntos','Conjunto animal print color plomo',100, '{M}', null,'/productos/conjunto-animal-print.webp','NUEVO',2),
  ('vestidos','Vestido azul elegante',70, '{M}', null,'/productos/vestido-azul.webp','NUEVO',3),
  ('vestidos','Vestido negro con brillos',250, '{}', null,'/productos/vestido-negro-brillos.webp',null,4),
  ('vestidos','Vestido negro de manga larga',null, '{}', null,'/productos/vestido-negro-manga-larga.webp',null,5),
  ('vestidos','Vestido naranja fruncido',null, '{}', null,'/productos/vestido-naranja.webp',null,6),
  ('vestidos','Vestido negro 3/4 asimétrico',90, '{M}', null,'/productos/vestido-negro-34.webp','FAVORITO',7),
  ('enterizos','Enterizo negro con brillos',99, '{L}', null,'/productos/enterizo-negro-brillos.webp',null,8),
  ('enterizos','Enterizo de jeans azul oscuro',null, '{}', 'S-M','/productos/enterizo-jeans.webp',null,9),
  ('enterizos','Enterizo azul con brillos',null, '{}', 'S-M','/productos/enterizo-azul-brillos.webp',null,10),
  ('enterizos','Enterizo negro con lentejuelas',99, '{S}', null,'/productos/enterizo-lentejuelas.webp',null,11),
  ('vestidos','Vestido dorado de lentejuelas',80, '{M}', null,'/productos/vestido-dorado.webp','FAVORITO',12),
  ('conjuntos','Conjunto fucsia',169, '{M}', null,'/productos/conjunto-fucsia.webp','FAVORITO',13),
  ('vestidos','Vestido fucsia de fiesta',null, '{}', null,'/productos/vestido-fucsia.webp',null,14)
) as v(cat, name, price, sizes, size_detail, image_url, badge, ord)
join public.categories c on c.slug = v.cat
where not exists (select 1 from public.products);
