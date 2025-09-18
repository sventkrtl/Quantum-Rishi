-- Ensure the uuid generator extension is available
create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_inr integer not null check (price_inr >= 0), -- price in rupees (integer)
  sku text unique,
  visible boolean default true,
  created_at timestamptz default now()
);

-- Example inserts (1-5)
insert into products (title, description, price_inr, sku) values
('Quantum Rishi Premium Episode', 'Full-length AI-narrated episode export', 299, 'QR-EP-299'),
('Quantum Rishi Creator Token Pack', '100 credits for creators', 499, 'QR-TOK-100'),
('Quantum Rishi Mini Workshop', 'Online 60-minute workshop', 199, 'QR-WS-1'),
('Donation — Support QR', 'Donation to support charitable storytelling', 50, 'QR-DON-50'),
('Physical Sticker Pack', 'Set of 5 Quantum Rishi stickers (shipping extra)', 149, 'QR-STK-5');
