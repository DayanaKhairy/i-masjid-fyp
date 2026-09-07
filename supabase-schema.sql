-- ══════════════════════════════════════════════════
-- i@masjid — Custom Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ═══ DROP EXISTING TABLES (Allows clean re-runs) ═══
drop table if exists public.registrations cascade;
drop table if exists public.announcements cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;
drop table if exists public.admins cascade;
drop table if exists public.mosques cascade;

-- ═══ TABLES ═══════════════════════════════════════

-- Mosques
create table if not exists public.mosques (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  zone_code  text default 'MLK001',
  address    text,
  state      text default 'Melaka',
  created_at timestamptz default now()
);

-- Profiles (Custom user table)
create table if not exists public.profiles (
  id           serial primary key,
  first_name   text not null,
  last_name    text not null,
  email        text not null unique,
  phone_number text,
  password     text not null,
  updated_at   timestamptz default now()
);

-- Admins
create table if not exists public.admins (
  id       serial primary key,
  email    text not null unique,
  password text not null,
  name     text not null
);

-- Events (icon_fa = Font Awesome 6 class e.g. "fa-mosque")
create table if not exists public.events (
  id           text primary key,
  mosque_id    uuid references public.mosques(id),
  title        text not null,
  description  text,
  category     text check (category in ('religious','education','community','charity')),
  date         date not null,
  time_range   text,
  speaker      text,
  location     text,
  capacity     integer default 100,
  icon_fa      text default 'fa-calendar-days',
  image_url    text,
  youtube_link text,
  created_at   timestamptz default now()
);

-- Registrations
create table if not exists public.registrations (
  id            serial primary key,
  event_id      text references public.events(id) on delete cascade,
  name          text not null,
  email         text not null,
  phone_number  text,
  registered_at timestamptz default now(),
  unique(email, event_id)
);

-- Announcements
create table if not exists public.announcements (
  id         uuid primary key default uuid_generate_v4(),
  mosque_id  uuid references public.mosques(id),
  title      text not null,
  content    text,
  is_pinned  boolean default false,
  created_at timestamptz default now()
);

-- Qurban / Korban Campaigns
create table if not exists public.korban_campaigns (
  id             serial primary key,
  mosque_id      uuid references public.mosques(id),
  year           integer not null,
  animal_type    text not null, -- e.g., 'Lembu', 'Kambing'
  price_per_part numeric(10,2) not null,
  total_parts    integer not null,
  created_at     timestamptz default now()
);

-- Qurban / Korban Participants
create table if not exists public.korban_participants (
  id               uuid primary key default uuid_generate_v4(),
  campaign_id      integer references public.korban_campaigns(id) on delete cascade,
  name             text not null,
  phone_number     text not null,
  parts_qty        integer not null,
  payment_status   text default 'pending', -- 'pending' or 'paid'
  payment_method   text default 'full',    -- 'full' | 'installment_3' | 'installment_6'
  installment_months integer default null, -- 3 or 6 (null for full)
  charge_fee       numeric(10,2) default 0.00, -- extra fee for 6-month plan
  registered_at    timestamptz default now()
);

-- Safe-add columns for existing databases (no error if already exists)
alter table public.korban_participants add column if not exists payment_method   text default 'full';
alter table public.korban_participants add column if not exists installment_months integer default null;
alter table public.korban_participants add column if not exists charge_fee       numeric(10,2) default 0.00;

-- Khairat Kematian registrations and payment verification
create table if not exists public.khairat_members (
  id               text primary key,
  name             text not null,
  ic_number        text not null,
  phone_number     text not null,
  email            text,
  address          text not null,
  members_count    integer not null,
  amount           numeric(10,2) not null,
  payment_method   text default 'toyyibpay',
  payment_status   text default 'pending',
  registered_at    timestamptz default now()
);


-- ═══ ROW LEVEL SECURITY & POLICIES ═══
-- Re-enable RLS but add explicit public allow-all policies
-- This ensures the JavaScript client can perform CRUD without an auth token

alter table public.mosques       enable row level security;
alter table public.profiles      enable row level security;
alter table public.admins        enable row level security;
alter table public.events        enable row level security;
alter table public.registrations enable row level security;
alter table public.announcements enable row level security;
alter table public.korban_campaigns enable row level security;
alter table public.korban_participants enable row level security;
alter table public.khairat_members enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow public everything on mosques" on public.mosques;
drop policy if exists "Allow public everything on profiles" on public.profiles;
drop policy if exists "Allow public everything on admins" on public.admins;
drop policy if exists "Allow public everything on events" on public.events;
drop policy if exists "Allow public everything on registrations" on public.registrations;
drop policy if exists "Allow public everything on announcements" on public.announcements;
drop policy if exists "Allow public everything on korban_campaigns" on public.korban_campaigns;
drop policy if exists "Allow public everything on korban_participants" on public.korban_participants;
drop policy if exists "Allow public everything on khairat_members" on public.khairat_members;

-- Create ALL access policies for anon/authenticated (public access)
create policy "Allow public everything on mosques" on public.mosques for all using (true) with check (true);
create policy "Allow public everything on profiles" on public.profiles for all using (true) with check (true);
create policy "Allow public everything on admins" on public.admins for all using (true) with check (true);
create policy "Allow public everything on events" on public.events for all using (true) with check (true);
create policy "Allow public everything on registrations" on public.registrations for all using (true) with check (true);
create policy "Allow public everything on announcements" on public.announcements for all using (true) with check (true);
create policy "Allow public everything on korban_campaigns" on public.korban_campaigns for all using (true) with check (true);
create policy "Allow public everything on korban_participants" on public.korban_participants for all using (true) with check (true);
create policy "Allow public everything on khairat_members" on public.khairat_members for all using (true) with check (true);

-- ═══ SEED DATA ════════════════════════════════════

-- Insert mosque
insert into public.mosques (name, zone_code, address, state)
values ('Masjid Al-Rahman', 'MLK001', 'Jalan Masjid, Melaka Tengah, 75000 Melaka', 'Melaka')
on conflict do nothing;

-- Insert Admin
insert into public.admins (email, password, name)
values ('apekadmin@gmail.com', 'apekadmin', 'apekadmin')
on conflict do nothing;

-- Insert events (3+ per category: religious, education, community, charity)
do $$
declare
  v_mosque_id uuid;
begin
  select id into v_mosque_id from public.mosques where name = 'Masjid Al-Rahman' limit 1;

  insert into public.events
    (id, mosque_id, title, description, category, date, time_range, speaker, location, icon_fa, image_url, youtube_link)
  values

  -- ══════════════ RELIGIOUS (A1-A4) ══════════════

  ('A1', v_mosque_id,
   'Kuliah Subuh Perdana',
   'A special morning lecture discussing Adab & Akhlak in the Modern Era with light breakfast served afterwards. A wonderful way to start your day with knowledge and community.',
   'religious', '2026-06-24', '06:15 AM - 07:30 AM',
   'Ustaz Dr. Abdul Halim', 'Dewan Solat Utama',
   'fa-book-open', 'assets/images/kuliah-subuh.jpg', null),

  ('A2', v_mosque_id,
   'Solat Hajat Berjemaah & Tazkirah Malam',
   'A congregational night prayer (Solat Hajat) followed by a tazkirah session on strengthening faith and reliance upon Allah in times of difficulty. Open to all community members.',
   'religious', '2026-07-03', '09:00 PM - 10:30 PM',
   'Imam Haji Roslan', 'Dewan Solat Utama',
   'fa-moon', null, null),

  ('A3', v_mosque_id,
   'Maulid Al-Rasul Celebration',
   'Annual celebration of the Prophet Muhammad''s (PBUH) birthday with nasheed performances, lectures on his seerah, and a communal feast. Families are encouraged to attend together.',
   'religious', '2026-07-14', '08:00 PM - 10:30 PM',
   'Panel of Ustaz', 'Dewan Masjid Utama',
   'fa-star-and-crescent', null, null),

  ('A4', v_mosque_id,
   'Podcast Dakwah Digital: Islam di Era Moden',
   'A live Islamic talk podcast streamed on YouTube — covering Dakwah in the digital age, social media responsibility, and how to thrive as a Muslim in the modern world. Featuring an open Q&A session.',
   'religious', '2026-07-15', '08:00 PM - 09:30 PM',
   'Ustaz Syafiq Riza Basri', 'YouTube Live / Masjid Al-Rahman',
   'fa-microphone', null, 'https://youtube.com/@imasjid'),

  -- ══════════════ EDUCATION (B1-B4) ══════════════

  ('B1', v_mosque_id,
   'Tajweed & Quranic Circle',
   'Weekly class focused on improving Quranic recitation, tajweed rules, and memorization verification. Suitable for all levels from beginner to advanced.',
   'education', '2026-06-26', '08:00 PM - 09:30 PM',
   'Imam Haji Ghazali', 'Bilik Kuliah 1',
   'fa-graduation-cap', null, null),

  ('B2', v_mosque_id,
   'Fiqh of Worship Seminar',
   'Intensive 1-day seminar covering the essentials of Solat, Taharah, Zakat, and modern day Fiqh challenges faced by Muslims today. Certificate of attendance provided.',
   'education', '2026-07-10', '09:00 AM - 04:00 PM',
   'Dr. Mufti Muhammad', 'Seminar Hall',
   'fa-mosque', null, null),

  ('B3', v_mosque_id,
   'Islamic Parenting Workshop',
   'A practical workshop on raising children with Islamic values in the modern era. Topics include screen time management, moral education, and building a faith-centred home environment.',
   'education', '2026-07-19', '09:00 AM - 01:00 PM',
   'Ustazah Dr. Siti Aminah', 'Bilik Kuliah 2',
   'fa-people-roof', null, null),

  ('B4', v_mosque_id,
   'Arabic Language for Beginners',
   'A 4-week introductory course in Arabic language focusing on conversational phrases, reading Quranic vocabulary, and basic grammar. Enrolment is limited to 25 participants.',
   'education', '2026-07-26', '10:00 AM - 12:00 PM',
   'Ustaz Ahmad Firdaus', 'Bilik Kuliah 1',
   'fa-language', null, null),

  -- ══════════════ COMMUNITY (C1-C4) ══════════════

  ('C1', v_mosque_id,
   'Community Gotong-Royong',
   'Clean-up and beautification campaign of the mosque area, gardens, and community hall. Join us to earn pahala and strengthen community bonds. Refreshments provided.',
   'community', '2026-06-30', '08:00 AM - 12:00 PM',
   'Masjid Committee', 'Mosque Compound',
   'fa-people-group', null, null),

  ('C2', v_mosque_id,
   'Youth Futsal Friendly Tournament',
   'Sporting event for the youths of the community to build friendship, discipline, and healthy active lifestyles. Register your team of 5-7 players before slots fill up.',
   'community', '2026-07-06', '04:30 PM - 07:00 PM',
   'Youth Bureau', 'Kompleks Sukan Komuniti',
   'fa-futbol', null, null),

  ('C3', v_mosque_id,
   'Mosque Open Day & Community Carnival',
   'A family-friendly open day welcoming all community members and visitors. Features guided mosque tours, cultural booths, kids'' activities, and a shared community meal.',
   'community', '2026-07-12', '10:00 AM - 05:00 PM',
   'Masjid Committee', 'Mosque Grounds',
   'fa-door-open', null, null),

  ('C4', v_mosque_id,
   'Seniors Gathering & Health Screening',
   'A dedicated afternoon for our senior community members featuring light tazkirah, health screening services (blood pressure, sugar level), and a communal tea session.',
   'community', '2026-07-20', '02:00 PM - 05:00 PM',
   'Community Welfare Unit', 'Dewan Serbaguna',
   'fa-heart-pulse', null, null),

  -- ══════════════ CHARITY (D1-D4) ══════════════

  ('D1', v_mosque_id,
   'Infaq & Food Bank Distribution',
   'Distribution of essential goods and food supplies to registered Asnaf and families in need. Volunteers are welcome to assist in preparation and distribution.',
   'charity', '2026-07-01', '09:00 AM - 01:00 PM',
   'Charity Unit', 'Masjid Foyer',
   'fa-hand-holding-dollar', null, null),

  ('D2', v_mosque_id,
   'Blood Donation Campaign',
   'Partnering with Hospital Melaka for a community blood donation drive. All blood types needed. Donors receive complimentary health check, refreshments, and a certificate of appreciation.',
   'charity', '2026-07-08', '09:00 AM - 03:00 PM',
   'Hospital Melaka & Masjid Committee', 'Dewan Serbaguna',
   'fa-droplet', null, null),

  ('D3', v_mosque_id,
   'Back-to-School Supply Drive',
   'Collecting and distributing school bags, stationery, uniforms, and books to underprivileged students ahead of the new school term. Donations of goods or funds are welcome.',
   'charity', '2026-07-22', '09:00 AM - 12:00 PM',
   'Education Welfare Unit', 'Masjid Foyer',
   'fa-school', null, null),

  ('D4', v_mosque_id,
   'Zakat & Asnaf Assistance Program',
   'Registration and assistance programme for eligible Asnaf families. Zakat contributions distributed directly to verified recipients. Bring IC and relevant documents for eligibility check.',
   'charity', '2026-07-29', '09:00 AM - 01:00 PM',
   'Lembaga Zakat Melaka', 'Bilik Mesyuarat',
   'fa-hand-holding-heart', null, null);

  -- ══════════════ KORBAN CAMPAIGNS ══════════════
  insert into public.korban_campaigns (mosque_id, year, animal_type, price_per_part, total_parts)
  values 
  (v_mosque_id, 2026, 'Lembu (Cow)', 750.00, 35),
  (v_mosque_id, 2026, 'Kambing (Goat)', 950.00, 10);

end $$;
