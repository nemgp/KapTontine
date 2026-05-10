-- Extend schema with Finance and Social tables

-- LOANS (PRÊTS)
create table public.loans (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    member_name text not null, -- For now, keep name, or reference profile if possible
    amount decimal not null,
    date date not null,
    status text not null default 'en_cours', -- 'en_cours', 'rembourse'
    notes text,
    id_auteur uuid references public.profiles(id) on delete set null,
    date_creation timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SAVINGS (ÉPARGNES)
create table public.savings (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    member_name text not null,
    amount decimal not null,
    date date not null,
    type text not null, -- 'depot', 'retrait'
    notes text,
    id_auteur uuid references public.profiles(id) on delete set null,
    date_creation timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUPPORTS (SECOURS)
create table public.supports (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    member_name text not null,
    type text not null, -- 'naissance', 'mariage', 'hospitalisation', 'deces'
    amount decimal not null,
    date date not null,
    notes text,
    id_auteur uuid references public.profiles(id) on delete set null,
    date_creation timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.loans enable row level security;
alter table public.savings enable row level security;
alter table public.supports enable row level security;

-- Policies (Simplified: members of the reunion can view, admins can manage)
create policy "View loans" on loans for select using (exists (select 1 from membres_reunion where id_reunion = loans.id_reunion and id_profile = auth.uid()));
create policy "Manage loans" on loans for all using (exists (select 1 from membres_reunion where id_reunion = loans.id_reunion and id_profile = auth.uid() and role = 'admin'));

create policy "View savings" on savings for select using (exists (select 1 from membres_reunion where id_reunion = savings.id_reunion and id_profile = auth.uid()));
create policy "Manage savings" on savings for all using (exists (select 1 from membres_reunion where id_reunion = savings.id_reunion and id_profile = auth.uid() and role = 'admin'));

create policy "View supports" on supports for select using (exists (select 1 from membres_reunion where id_reunion = supports.id_reunion and id_profile = auth.uid()));
create policy "Manage supports" on supports for all using (exists (select 1 from membres_reunion where id_reunion = supports.id_reunion and id_profile = auth.uid() and role = 'admin'));
