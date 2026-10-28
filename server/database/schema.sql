create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  email varchar(255) not null unique,
  password_hash text not null,
  role varchar(20) not null default 'employee' check (role in ('employee', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  type varchar(20) not null check (type in ('room', 'equipment')),
  capacity integer check (capacity > 0),
  facilities text not null default '',
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint rooms_need_capacity check (type <> 'room' or capacity is not null)
);

create unique index if not exists resources_name_unique on resources (lower(name));

create table if not exists operating_hours (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '18:00',
  unique (resource_id, day_of_week),
  constraint close_after_open check (close_time > open_time)
);

create table if not exists booking_restrictions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null unique references resources (id) on delete cascade,
  min_duration_minutes integer not null default 30 check (min_duration_minutes > 0),
  max_duration_minutes integer not null default 240 check (max_duration_minutes > 0),
  max_advance_days integer not null default 30 check (max_advance_days > 0),
  slot_step_minutes integer not null default 30 check (slot_step_minutes > 0),
  constraint max_not_below_min check (max_duration_minutes >= min_duration_minutes)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources (id) on delete cascade,
  user_id uuid not null references users (id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  purpose varchar(255),
  status varchar(20) not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancelled_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time),
  constraint no_double_booking exclude using gist (
    resource_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status = 'confirmed')
);

create index if not exists bookings_resource_start_idx on bookings (resource_id, start_time);
create index if not exists bookings_user_start_idx on bookings (user_id, start_time desc);
create index if not exists bookings_start_idx on bookings (start_time);

create table if not exists booking_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  changed_by uuid not null references users (id),
  action varchar(20) not null check (action in ('created', 'edited', 'cancelled')),
  details text,
  created_at timestamptz not null default now()
);

create index if not exists booking_history_booking_idx on booking_history (booking_id, created_at);

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists bookings_touch_updated_at on bookings;
create trigger bookings_touch_updated_at
  before update on bookings
  for each row execute function touch_updated_at();

insert into operating_hours (resource_id, day_of_week, is_open)
select r.id, day, day <> 0
from resources r
cross join generate_series(0, 6) as day
on conflict (resource_id, day_of_week) do nothing;

insert into booking_restrictions (resource_id)
select id from resources
on conflict (resource_id) do nothing;

alter table users enable row level security;
alter table resources enable row level security;
alter table operating_hours enable row level security;
alter table booking_restrictions enable row level security;
alter table bookings enable row level security;
alter table booking_history enable row level security;
