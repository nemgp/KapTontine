-- ============================================================
-- SQL Script for Reunion Documents Table
-- Execute this script in your Supabase SQL Editor
-- ============================================================

create table if not exists public.reunion_documents (
    id uuid default uuid_generate_v4() primary key,
    id_reunion uuid references public.reunions(id) on delete cascade not null,
    doc_type text not null, -- 'doc_ag' | 'doc_cycle' | 'doc_finance' | 'doc_epargne'
    file_url text,         -- URL of uploaded file (in storage)
    file_name text,        -- Name of uploaded file
    link_url text,         -- External link (Google Drive, etc.)
    updated_at timestamp with time zone default timezone('utc', now()) not null,
    unique(id_reunion, doc_type)
);

-- Enable RLS
alter table public.reunion_documents enable row level security;

-- Policies
create policy "Membres peuvent voir les documents de la reunion"
  on public.reunion_documents for select
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = reunion_documents.id_reunion
      and membres_reunion.id_profile = auth.uid()
    )
  );

create policy "Admins peuvent modifier les documents de la reunion"
  on public.reunion_documents for all
  using (
    exists (
      select 1 from public.membres_reunion
      where membres_reunion.id_reunion = reunion_documents.id_reunion
      and membres_reunion.id_profile = auth.uid()
      and membres_reunion.role = 'admin'
    )
  );
