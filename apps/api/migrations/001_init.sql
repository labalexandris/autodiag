-- AutoDiag: αρχικό σχήμα. Κάθε επιχειρησιακός πίνακας έχει shop_id (multi-tenant).

create table shops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  vat_number  text,
  phone       text,
  address     text,
  ics_token   text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at  timestamptz not null default now()
);

create table users (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops(id) on delete cascade,
  email         text not null unique,
  name          text not null,
  password_hash text not null,
  role          text not null default 'owner' check (role in ('owner', 'tech')),
  created_at    timestamptz not null default now()
);

create table sessions (
  token       text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create table customers (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,
  full_name   text not null,
  phone       text,
  email       text,
  vat_number  text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index customers_shop_idx on customers(shop_id);

create table vehicles (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  plate       text not null,
  plate_norm  text not null,
  vin         text,
  make        text,
  model       text,
  year        int,
  engine      text,
  fuel        text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index vehicles_shop_plate_uq on vehicles(shop_id, plate_norm);
create index vehicles_customer_idx on vehicles(customer_id);

create table work_orders (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  number         int not null,
  vehicle_id     uuid not null references vehicles(id) on delete cascade,
  customer_id    uuid references customers(id) on delete set null,
  status         text not null default 'open'
                 check (status in ('open', 'in_progress', 'ready', 'delivered')),
  odometer_km    int,
  complaint      text,
  diagnosis      text,
  dtc_codes      text[] not null default '{}',
  internal_notes text,
  vat_rate       numeric(5,2) not null default 24,
  opened_at      timestamptz not null default now(),
  ready_at       timestamptz,
  delivered_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (shop_id, number)
);
create index work_orders_shop_status_idx on work_orders(shop_id, status);
create index work_orders_vehicle_idx on work_orders(vehicle_id);

create table work_order_items (
  id            uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  kind          text not null check (kind in ('labor', 'part')),
  description   text not null,
  part_code     text,
  quantity      numeric(10,2) not null default 1,
  unit_price    numeric(10,2) not null default 0,
  position      int not null default 0,
  created_at    timestamptz not null default now()
);
create index work_order_items_wo_idx on work_order_items(work_order_id);

create table appointments (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  vehicle_id    uuid references vehicles(id) on delete set null,
  work_order_id uuid references work_orders(id) on delete set null,
  title         text not null,
  notes         text,
  starts_at     timestamptz not null,
  duration_min  int not null default 60,
  status        text not null default 'scheduled'
                check (status in ('scheduled', 'arrived', 'done', 'no_show', 'cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index appointments_shop_time_idx on appointments(shop_id, starts_at);

create table attachments (
  id            uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  file_name     text not null,
  mime          text not null,
  size_bytes    int not null,
  created_at    timestamptz not null default now()
);
create index attachments_wo_idx on attachments(work_order_id);
