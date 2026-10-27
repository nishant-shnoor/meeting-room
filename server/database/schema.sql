create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  email varchar(255) not null unique,
  password_hash text not null,
  role varchar(20) not null default 'employee' check (role in ('employee', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table users enable row level security;

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

alter table resources enable row level security;

create extension if not exists btree_gist;

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

alter table bookings enable row level security;
