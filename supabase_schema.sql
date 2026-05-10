-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    nom text not null,
    avatar text
);

-- REUNIONS
create table public.reunions (
    id uuid default uuid_generate_v4() primary key,
    nom text not null,
    description text,
    date_creation timestamp with time zone default timezone('utc'::text, now()) not null,
    date_expiration timestamp with time zone not null,
    id_createur uuid references public.profiles(id) on delete set null
);

-- MEMBRES_REUNION
create table public.membres_reunion (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    id_profile uuid references public.profiles(id) on delete cascade not null,
    role text not null default 'membre', -- 'admin', 'membre'
    poste text, -- 'Président', 'Secrétaire', etc.
    unique(id_reunion, id_profile)
);

-- ACTIONS
create table public.actions (
    id uuid default uuid_generate_v4() primary key,
    titre text not null,
    texte text not null,
    categorie text not null, -- 'Cotisation Tontine', 'Épargne', 'Prêt', 'Autre'
    image_url text,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    id_auteur uuid references public.profiles(id) on delete cascade not null,
    date_creation timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.reunions enable row level security;
alter table public.membres_reunion enable row level security;
alter table public.actions enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Policies for Reunions
create policy "Users can view reunions they are members of."
  on reunions for select
  using ( 
    exists (
      select 1 from membres_reunion 
      where membres_reunion.id_reunion = reunions.id 
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Authenticated users can create reunions."
  on reunions for insert
  with check ( auth.role() = 'authenticated' );

create policy "Creators can update their reunions."
  on reunions for update
  using ( id_createur = auth.uid() );

-- Policies for Membres Reunion
create policy "Users can view members of their reunions."
  on membres_reunion for select
  using ( 
    exists (
      select 1 from membres_reunion mr
      where mr.id_reunion = membres_reunion.id_reunion 
      and mr.id_profile = auth.uid()
    )
  );

create policy "Admins can manage members."
  on membres_reunion for all
  using ( 
    exists (
      select 1 from membres_reunion mr
      where mr.id_reunion = membres_reunion.id_reunion 
      and mr.id_profile = auth.uid()
      and mr.role = 'admin'
    )
  );

-- Policy to allow creator to insert themselves as admin when creating a reunion
create policy "Users can join reunions or creators can add themselves"
  on membres_reunion for insert
  with check ( auth.uid() = id_profile );

-- Policies for Actions
create policy "Users can view actions in their reunions."
  on actions for select
  using ( 
    exists (
      select 1 from membres_reunion 
      where membres_reunion.id_reunion = actions.id_reunion 
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Users can insert actions in their reunions."
  on actions for insert
  with check ( 
    auth.uid() = id_auteur and
    exists (
      select 1 from membres_reunion 
      where membres_reunion.id_reunion = actions.id_reunion 
      and membres_reunion.id_profile = auth.uid()
    )
  );
