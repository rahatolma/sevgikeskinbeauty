-- DROP OLD SCHEMA TO ALLOW SAFE MIGRATION
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.advisors CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.booking_requests CASCADE;
DROP TABLE IF EXISTS public.service_specialists CASCADE;
DROP TABLE IF EXISTS public.specialists CASCADE;
DROP TABLE IF EXISTS public.service_categories CASCADE;
DROP TABLE IF EXISTS public.contact_requests CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;

-- Extensions
create extension if not exists pgcrypto;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- 1) SERVICE CATEGORIES
-- =========================
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  marketing_title text,
  services_page_intro text,
  short_description text,
  booking_description text,
  cover_image_url text,
  icon_name text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_service_categories_updated_at
before update on public.service_categories
for each row
execute function public.set_updated_at();

create index if not exists idx_service_categories_sort_order
on public.service_categories(sort_order);

create index if not exists idx_service_categories_is_active
on public.service_categories(is_active);

-- =========================
-- 2) SERVICES
-- =========================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete cascade,
  slug text not null unique,
  name text not null,
  short_description text,
  long_description text,
  duration_minutes integer,
  price_type text not null default 'custom'
    check (price_type in ('fixed', 'custom')),
  price numeric(10,2),
  currency text not null default 'TRY',
  is_featured boolean not null default false,
  is_hero boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_fixed_price_check
    check (
      (price_type = 'fixed' and price is not null)
      or
      (price_type = 'custom')
    )
);

create trigger trg_services_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

create index if not exists idx_services_category_id
on public.services(category_id);

create index if not exists idx_services_sort_order
on public.services(category_id, sort_order);

create index if not exists idx_services_is_active
on public.services(is_active);

create index if not exists idx_services_is_featured
on public.services(is_featured);

-- =========================
-- 3) SPECIALISTS
-- =========================
create table if not exists public.specialists (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text,
  bio text,
  avatar_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_specialists_updated_at
before update on public.specialists
for each row
execute function public.set_updated_at();

create index if not exists idx_specialists_sort_order
on public.specialists(sort_order);

-- =========================
-- 4) SERVICE <-> SPECIALIST
-- =========================
create table if not exists public.service_specialists (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(service_id, specialist_id)
);

create index if not exists idx_service_specialists_service_id
on public.service_specialists(service_id);

create index if not exists idx_service_specialists_specialist_id
on public.service_specialists(specialist_id);

-- =========================
-- 5) BOOKING REQUESTS
-- =========================
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  specialist_id uuid references public.specialists(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  requested_date date,
  requested_time time,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_booking_requests_updated_at
before update on public.booking_requests
for each row
execute function public.set_updated_at();

create index if not exists idx_booking_requests_status
on public.booking_requests(status);

create index if not exists idx_booking_requests_requested_date
on public.booking_requests(requested_date);

-- =========================
-- 6) BOOKING TIMELINE LOGS
-- =========================
create table if not exists public.booking_timeline_logs (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references public.booking_requests(id) on delete cascade,
    action text not null,
    note text,
    created_at timestamptz not null default now()
);

-- =========================
-- 7) CONTACT REQUESTS
-- =========================
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

-- =========================
-- 7) NEWSLETTER SUBSCRIBERS
-- =========================
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed Data
insert into public.service_categories
(slug, name, marketing_title, short_description, booking_description, sort_order)
values
('cilt-bakimlari', 'Cilt Bakımları', 'Cilt Yenileme & Gençleştirme', 'Daha parlak, canlı ve dengeli bir cilt görünümü.', 'Daha sağlıklı, dengeli ve canlı bir cilt için özel uygulamalar', 1),
('lazer-epilasyon', 'Lazer Epilasyon', 'Lazer Epilasyon', 'Kalıcı pürüzsüzlük ve konfor.', 'Yeni nesil lazer uygulamaları ile etkili sonuçlar', 2),
('cilt-yenileme-onarim', 'Cilt Yenileme & Onarım', 'Leke & Ton Eşitleme', 'Leke, ton eşitsizliği ve cilt yenileme odaklı uygulamalar.', 'Cilt tonu, doku ve yenilenme için özel uygulamalar', 3),
('lifting-yuz-masajlari', 'Lifting Yüz Masajları', 'Masaj & Rahatlama Terapileri', 'Yüz kaslarını destekleyen lifting etkili manuel uygulamalar.', 'Yüz hatlarını destekleyen özel masaj teknikleri', 4),
('vucut-bakimlari', 'Vücut Bakımları', 'Vücut Şekillendirme & Sıkılaşma', 'Sıkılaşma, incelme ve vücut formunu destekleyen uygulamalar.', 'Daha sıkı ve formda bir görünüm için özel uygulamalar', 5);

insert into public.services
(category_id, slug, name, short_description, duration_minutes, price_type, price, is_featured, sort_order)
select id, 'anti-aging-cilt-bakimi', 'Anti-Aging Cilt Bakımı', 'İnce kırışıklık görünümünü azaltmayı destekler', 60, 'custom', null, false, 1
from public.service_categories where slug = 'cilt-bakimlari';

insert into public.services
(category_id, slug, name, short_description, duration_minutes, price_type, price, is_featured, sort_order)
select id, 'medikal-cilt-analizi-bakim', 'Medikal Cilt Analizi & Bakım', 'Gözenekleri arındırır ve cildi nefes aldırır', 45, 'fixed', 1500, false, 2
from public.service_categories where slug = 'cilt-bakimlari';

insert into public.services
(category_id, slug, name, short_description, duration_minutes, price_type, price, is_featured, sort_order)
select id, 'signature-hydrafacial', 'Signature Hydrafacial', 'Cildi neme doyurur ve tam ışıltı kazandırır', 75, 'custom', null, true, 3
from public.service_categories where slug = 'cilt-bakimlari';

-- RLS
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.specialists enable row level security;
alter table public.booking_requests enable row level security;
alter table public.contact_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Setup temporary ALL permissions to allow seamless dev (these should be restrictive in prod!)
create policy "Public can read active categories" on public.service_categories for select using (is_active = true);
create policy "Public can read active services" on public.services for select using (is_active = true);
create policy "Public can read active specialists" on public.specialists for select using (is_active = true);
create policy "Public can insert booking requests" on public.booking_requests for insert with check (true);
create policy "Public can insert contact requests" on public.contact_requests for insert with check (true);
create policy "Public can insert newsletter subscribers" on public.newsletter_subscribers for insert with check (true);

-- Adding temporarily admin override policies because UI edits it
CREATE POLICY "Admin All service_categories" ON public.service_categories FOR ALL USING (true);
CREATE POLICY "Admin All services" ON public.services FOR ALL USING (true);
