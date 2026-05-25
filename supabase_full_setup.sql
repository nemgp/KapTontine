-- ============================================================
-- KAPTONTINE — Script SQL Complet d'Initialisation
-- À exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- ============================================================

-- 1. Extensions
-- ============================================================
create extension if not exists "uuid-ossp";


-- 2. TABLES
-- ============================================================

-- Profils utilisateurs (synchronisé avec auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    nom text not null,
    avatar text,
    created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Réunions / Groupes Tontine
create table if not exists public.reunions (
    id uuid default uuid_generate_v4() primary key,
    nom text not null,
    description text default 'Réunion KapTontine',
    date_creation timestamp with time zone default timezone('utc', now()) not null,
    date_expiration timestamp with time zone not null,
    id_createur uuid references public.profiles(id) on delete set null
);

-- Membres d'une réunion (table de liaison)
create table if not exists public.membres_reunion (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    id_profile uuid references public.profiles(id) on delete cascade not null,
    role text not null default 'membre',  -- 'admin' | 'membre'
    poste text default 'Membre',          -- 'Président', 'Trésorier', etc.
    joined_at timestamp with time zone default timezone('utc', now()) not null,
    unique(id_reunion, id_profile)
);

-- Fil d'actions (notifications sociales)
create table if not exists public.actions (
    id uuid default uuid_generate_v4() primary key,
    titre text not null,
    texte text not null,
    categorie text not null, -- 'Cotisation Tontine' | 'Cotisation Épargne' | 'Demande de Prêt' | 'Autre'
    image_url text,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    id_auteur uuid references public.profiles(id) on delete cascade not null,
    date_creation timestamp with time zone default timezone('utc', now()) not null
);

-- Prêts
create table if not exists public.loans (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    member_name text not null,
    amount decimal(12,2) not null,
    date date not null,
    status text not null default 'en_cours', -- 'en_cours' | 'rembourse'
    notes text,
    id_auteur uuid references public.profiles(id) on delete set null,
    date_creation timestamp with time zone default timezone('utc', now()) not null
);

-- Épargnes / Cotisations
create table if not exists public.savings (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    member_name text not null,
    amount decimal(12,2) not null,
    date date not null,
    type text not null, -- 'depot' | 'retrait'
    notes text,
    id_auteur uuid references public.profiles(id) on delete set null,
    date_creation timestamp with time zone default timezone('utc', now()) not null
);

-- Secours / Supports
create table if not exists public.supports (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    member_name text not null,
    type text not null, -- 'naissance' | 'mariage' | 'hospitalisation' | 'deces'
    amount decimal(12,2) not null,
    date date not null,
    notes text,
    id_auteur uuid references public.profiles(id) on delete set null,
    date_creation timestamp with time zone default timezone('utc', now()) not null
);


-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.reunions enable row level security;
alter table public.membres_reunion enable row level security;
alter table public.actions enable row level security;
alter table public.loans enable row level security;
alter table public.savings enable row level security;
alter table public.supports enable row level security;


-- 4. POLITIQUES RLS — Profiles
-- ============================================================
create policy "Profiles visibles par tous"
  on public.profiles for select using (true);

create policy "Utilisateur peut créer son profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Utilisateur peut modifier son profil"
  on public.profiles for update
  using (auth.uid() = id);


-- 5. POLITIQUES RLS — Reunions
-- ============================================================
create policy "Membre peut voir ses réunions"
  on public.reunions for select
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = reunions.id
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Utilisateur authentifié peut créer une réunion"
  on public.reunions for insert
  with check (auth.role() = 'authenticated');

create policy "Créateur peut modifier sa réunion"
  on public.reunions for update
  using (id_createur = auth.uid());

create policy "Créateur peut supprimer sa réunion"
  on public.reunions for delete
  using (id_createur = auth.uid());


-- 6. POLITIQUES RLS — Membres Réunion
-- ============================================================
create policy "Membres peuvent voir les autres membres de leur réunion"
  on public.membres_reunion for select
  using (
    exists (
      select 1 from public.membres_reunion mr
      where mr.id_reunion = membres_reunion.id_reunion
      and mr.id_profile = auth.uid()
    )
  );

create policy "Utilisateur peut s'ajouter à une réunion"
  on public.membres_reunion for insert
  with check (auth.uid() = id_profile);

create policy "Admin peut modifier les membres de sa réunion"
  on public.membres_reunion for update
  using (
    exists (
      select 1 from public.membres_reunion mr
      where mr.id_reunion = membres_reunion.id_reunion
      and mr.id_profile = auth.uid()
      and mr.role = 'admin'
    )
  );

create policy "Admin peut supprimer des membres"
  on public.membres_reunion for delete
  using (
    exists (
      select 1 from public.membres_reunion mr
      where mr.id_reunion = membres_reunion.id_reunion
      and mr.id_profile = auth.uid()
      and mr.role = 'admin'
    )
  );


-- 7. POLITIQUES RLS — Actions
-- ============================================================
create policy "Membre peut voir les actions de sa réunion"
  on public.actions for select
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = actions.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Membre peut créer une action dans sa réunion"
  on public.actions for insert
  with check (
    auth.uid() = id_auteur and
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = actions.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Auteur peut supprimer son action"
  on public.actions for delete
  using (auth.uid() = id_auteur);


-- 8. POLITIQUES RLS — Loans
-- ============================================================
create policy "Membre peut voir les prêts de sa réunion"
  on public.loans for select
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = loans.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Membre peut créer un prêt"
  on public.loans for insert
  with check (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = loans.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Admin peut modifier les prêts"
  on public.loans for update
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = loans.id_reunion
      and membres_reunion.id_profile = auth.uid()
      and membres_reunion.role = 'admin'
    )
  );

create policy "Admin peut supprimer les prêts"
  on public.loans for delete
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = loans.id_reunion
      and membres_reunion.id_profile = auth.uid()
      and membres_reunion.role = 'admin'
    )
  );


-- 9. POLITIQUES RLS — Savings
-- ============================================================
create policy "Membre peut voir l'épargne de sa réunion"
  on public.savings for select
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = savings.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Membre peut enregistrer une épargne"
  on public.savings for insert
  with check (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = savings.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Admin peut modifier l'épargne"
  on public.savings for update
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = savings.id_reunion
      and membres_reunion.id_profile = auth.uid()
      and membres_reunion.role = 'admin'
    )
  );

create policy "Admin peut supprimer l'épargne"
  on public.savings for delete
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = savings.id_reunion
      and membres_reunion.id_profile = auth.uid()
      and membres_reunion.role = 'admin'
    )
  );


-- 10. POLITIQUES RLS — Supports
-- ============================================================
create policy "Membre peut voir les secours de sa réunion"
  on public.supports for select
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = supports.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Membre peut enregistrer un secours"
  on public.supports for insert
  with check (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = supports.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Admin peut modifier les secours"
  on public.supports for update
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = supports.id_reunion
      and membres_reunion.id_profile = auth.uid()
      and membres_reunion.role = 'admin'
    )
  );


-- 11. TRIGGER — Création automatique du profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nom)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Supprimer l'ancien trigger s'il existe, puis recréer
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- 12. INDEXES pour performances
-- ============================================================
create index if not exists idx_membres_reunion_profile on public.membres_reunion(id_profile);
create index if not exists idx_membres_reunion_reunion on public.membres_reunion(id_reunion);
create index if not exists idx_actions_reunion on public.actions(id_reunion);
create index if not exists idx_actions_date on public.actions(date_creation desc);
create index if not exists idx_loans_reunion on public.loans(id_reunion);
create index if not exists idx_savings_reunion on public.savings(id_reunion);
create index if not exists idx_supports_reunion on public.supports(id_reunion);


-- ============================================================
-- ✅ TERMINÉ — Toutes les tables, RLS et triggers sont créés.
-- Prochaine étape : Créer un bucket "action-images" dans Storage
-- ============================================================
