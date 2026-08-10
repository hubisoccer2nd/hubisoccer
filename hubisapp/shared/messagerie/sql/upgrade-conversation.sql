-- ============================================================
-- HUBISOCCER — MESSAGERIE : MISE À NIVEAU PAGE CONVERSATION
-- À exécuter dans l'éditeur SQL de Supabase (RLS désactivés / dev)
-- Toutes les instructions sont idempotentes (re-exécutables sans risque)
-- ============================================================

-- 1) Conversations épinglées (par utilisateur)
create table if not exists "supabaseAuthPrive_pinned_conversations" (
    user_hubisoccer_id text not null,
    conversation_id    text not null,
    created_at         timestamptz default now(),
    primary key (user_hubisoccer_id, conversation_id)
);

-- 2) Conversations en sourdine (muted_until NULL = pour toujours)
create table if not exists "supabaseAuthPrive_muted_conversations" (
    user_hubisoccer_id text not null,
    conversation_id    text not null,
    muted_until        timestamptz,
    created_at         timestamptz default now(),
    primary key (user_hubisoccer_id, conversation_id)
);

-- 3) Brouillons de messages (écrits par discuss.html, lus par conversation.html)
create table if not exists "supabaseAuthPrive_msg_drafts" (
    user_hubisoccer_id text not null,
    conversation_id    text not null,
    content            text,
    updated_at         timestamptz default now(),
    primary key (user_hubisoccer_id, conversation_id)
);

-- 4) Dossiers personnalisés (façon Telegram) + affectation des conversations
create table if not exists "supabaseAuthPrive_msg_folders" (
    id                 uuid primary key default gen_random_uuid(),
    user_hubisoccer_id text not null,
    name               text not null,
    created_at         timestamptz default now()
);

create table if not exists "supabaseAuthPrive_msg_folder_items" (
    folder_id          uuid not null,
    conversation_id    text not null,
    primary key (folder_id, conversation_id)
);

-- 5) Marquage manuel "non lu" (pastille sans nouveau message)
alter table "supabaseAuthPrive_conversation_participants"
    add column if not exists manually_unread boolean default false;

-- 6) Index utiles pour la page conversation
create index if not exists idx_msgs_conv_created
    on "supabaseAuthPrive_messages" (conversation_id, created_at desc);
create index if not exists idx_participants_user
    on "supabaseAuthPrive_conversation_participants" (user_hubisoccer_id);
