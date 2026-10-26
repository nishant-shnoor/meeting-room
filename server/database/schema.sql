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
