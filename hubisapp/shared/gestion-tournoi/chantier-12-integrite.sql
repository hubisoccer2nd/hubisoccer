-- ════════════════════════════════════════════════════════════
-- HubISoccer — CHANTIER 12
-- Mise en conformité de la base avec le code du gestionnaire
-- de tournoi.
-- ────────────────────────────────────────────────────────────
-- CE QUE FAIT CE SCRIPT
--
-- Il crée ce qui manque, et RIEN D'AUTRE :
--     CREATE TABLE IF NOT EXISTS
--     ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--
-- Il ne contient AUCUN :
--     DROP, DELETE, TRUNCATE, ALTER COLUMN, RENAME,
--     CREATE POLICY, ALTER ... ENABLE ROW LEVEL SECURITY
--
-- Rien de ce qui est déjà en base n'est modifié ni supprimé.
-- Une colonne qui existe déjà est laissée exactement comme elle
-- est, y compris son type. On peut le relancer autant de fois
-- qu'on veut : il ne fait rien la deuxième fois.
--
-- ────────────────────────────────────────────────────────────
-- POURQUOI IL EXISTE
--
-- Quand une page écrit dans une colonne absente, PostgreSQL
-- répond 42703 et refuse LA LIGNE ENTIÈRE — pas seulement la
-- colonne fautive. Et jusqu'au chantier 12, la plupart de ces
-- échecs finissaient dans un console.warn() : la page affichait
-- quand même « enregistré ».
--
-- C'est l'origine de :
--   · « la formation de départ n'est plus là »
--   · « tout est mélangé » dans la composition
--   · les relevés d'observation qui ne se retiennent pas
--   · les buts attribués à personne
--
-- ────────────────────────────────────────────────────────────
-- COMMENT S'EN SERVIR
--
--   1. Ouvre hubisapp/shared/gestion-tournoi/gt-diagnostic.html
--      dans le navigateur et lance l'analyse. Elle te dit ce qui
--      manque VRAIMENT dans ta base, et elle écrit un SQL réduit
--      à ça.
--   2. Si tu préfères ne pas t'embêter : exécute ce fichier-ci
--      en entier. Il couvre tout, et ce qui existe déjà est
--      ignoré.
--   3. Supabase → SQL Editor → coller → Run.
--   4. Relance le diagnostic : tout doit être au vert.
--
-- 10 tables · 248 colonnes
-- ════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. Effectif et composition
--    Table : supabaseAuthPrive_gt_team_players
--    Pages : mon-equipe.html, team-details.html, match-details.html, match-report.html
--    Si elle est incomplète : L'effectif ne se charge plus. Le sélecteur du relevé d'observation n'affiche plus que le mot du sport répété, et l'arbitre ne peut désigner personne dans son rapport.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_team_players" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS member_name text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS member_photo_url text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS member_category text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS position_detail text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS position_category text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS jersey_number integer;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS is_captain boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS is_starting boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS is_coach boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS is_president boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS is_manager boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS is_injured boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS height_cm integer;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS languages_spoken text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS pos_x numeric;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS pos_y numeric;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS slot_key text;
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public."supabaseAuthPrive_gt_team_players"
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 2. Équipes
--    Table : supabaseAuthPrive_gt_teams
--    Pages : mon-equipe.html, manage-tournament.html, team-details.html
--    Si elle est incomplète : La formation par défaut de l'équipe n'est jamais retenue : au retour sur la page, le terrain est vide et tout le monde est au banc.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_teams" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS creator_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS age_category text;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS default_formation text;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS team_format integer;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS sport_code text;
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public."supabaseAuthPrive_gt_teams"
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 3. Composition par rencontre
--    Table : supabaseAuthPrive_gt_match_lineups
--    Pages : mon-equipe.html, match-details.html
--    Si elle est incomplète : La composition d'un match ne s'enregistre pas. Chaque retour sur la page repart de zéro et la formation choisie est perdue.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_match_lineups" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS match_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS team_player_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS player_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS member_name text;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS jersey_number integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS is_starter boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS pos_x numeric;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS pos_y numeric;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS slot_key text;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS position_group text;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS position_detail text;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS formation text;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS team_format integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS bench_order integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS is_captain boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS is_injured boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS injury_minute integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS sub_in_minute integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS sub_out_minute integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public."supabaseAuthPrive_gt_match_lineups"
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 4. Événements de match
--    Table : supabaseAuthPrive_gt_match_events
--    Pages : match-report.html, match-details.html
--    Si elle est incomplète : Les buts, cartons et remplacements saisis par l'arbitre ne quittent jamais le rapport : aucune statistique ne peut être calculée.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_match_events" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS match_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS player_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS assist_player_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS minute integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS detail text;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS source_report_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_events"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 5. Statistiques par rencontre
--    Table : supabaseAuthPrive_gt_player_match_stats
--    Pages : match-details.html, player-stats.html, stats-compare.html, rankings.html
--    Si elle est incomplète : Le relevé d'observation ne s'enregistre pas et « Calculer depuis les rapports » n'écrit rien. Une seule colonne manquante suffit : PostgREST refuse la ligne entière.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_player_match_stats" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS match_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS player_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS match_rating numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS rating_attack numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS rating_passing numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS rating_dribbling numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS rating_defence numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS rating_goalkeeping numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS heatmap jsonb;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS minutes_played integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS is_starter boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS position_played text;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS goals integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS own_goals integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS assists integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS yellow_cards integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS red_cards integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS is_motm boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS team_of_the_week boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS expected_goals numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS shots_total integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS shots_on_target integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS shots_off_target integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS shots_blocked integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS shots_woodwork integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS big_chances integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS big_chances_missed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS offsides integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS penalties_won integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS penalties_scored integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS penalties_missed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS expected_assists numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS passes_completed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS passes_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS key_passes integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS big_chances_created integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS crosses_completed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS crosses_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS passes_own_half_completed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS passes_own_half_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS passes_opposition_half_completed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS passes_opposition_half_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS long_balls_completed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS long_balls_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS chipped_passes_completed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS chipped_passes_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS defensive_actions integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS tackles_won integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS tackles_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS interceptions integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS clearances integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS blocked_shots integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS recoveries integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS possession_won_final_third integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS last_man_tackle boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS dribbled_past integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS errors_leading_to_shot integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS errors_leading_to_goal integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS penalties_conceded integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS fouls_committed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS fouls_suffered integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS duels_won integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS duels_total integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS ground_duels_won integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS ground_duels_total integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS aerial_duels_won integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS aerial_duels_total integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS saves integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS saves_inside_box integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS goals_prevented integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS punches integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS high_claims integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS high_claims_successful integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS sweeper_actions integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS goals_conceded integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS clean_sheet boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS penalties_saved integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS touches integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS dribbles_completed integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS dribbles_attempted integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS unsuccessful_touches integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS possession_lost integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS running_km numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS high_speed_running_km numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS sprint_km numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS total_progression_m numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS distance_km numeric;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS sprints integer;
ALTER TABLE public."supabaseAuthPrive_gt_player_match_stats"
    ADD COLUMN IF NOT EXISTS top_speed_kmh numeric;

-- ────────────────────────────────────────────────────────────
-- 6. Calendrier et rencontres
--    Table : supabaseAuthPrive_gt_matches
--    Pages : tournament-details.html, match-details.html, manage-tournament.html
--    Si elle est incomplète : Le calendrier, le tableau final et le classement ne se construisent plus.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_matches" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS team_a_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS team_b_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS match_date timestamptz;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS round text;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS matchday integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS leg integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS bracket_position integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS is_bye boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS score_a integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS score_b integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS penalty_a integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS penalty_b integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS penalty_winner_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS forfeit_team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS lineups_locked boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS lineup_a_confirmed boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS lineup_b_confirmed boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public."supabaseAuthPrive_gt_matches"
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 7. Classement
--    Table : supabaseAuthPrive_gt_standings
--    Pages : rankings.html, tournament-details.html
--    Si elle est incomplète : Le classement reste vide ou s'affiche à plat, sans respecter les groupes du format choisi par l'organisateur.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_standings" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS played integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS wins integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS draws integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS losses integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS goals_for integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS goals_against integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS goal_difference integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS points integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS discipline_points integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS current_rank integer;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS qualification_zone text;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS recent_form text;
ALTER TABLE public."supabaseAuthPrive_gt_standings"
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 8. Rapports de match
--    Table : supabaseAuthPrive_gt_match_reports
--    Pages : match-report.html, match-details.html, match-report-export.html
--    Si elle est incomplète : Les officiels ne peuvent plus déposer de rapport.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_match_reports" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS match_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS role_code text;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS report_type text;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS signature_data text;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS version_count integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public."supabaseAuthPrive_gt_match_reports"
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 9. Versions des rapports
--    Table : supabaseAuthPrive_gt_match_report_versions
--    Pages : match-report.html
--    Si elle est incomplète : Le suivi des trois versions d'un rapport ne fonctionne plus.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_match_report_versions" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS match_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS role_code text;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS version_number integer;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS review_comment text;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS signature_data text;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public."supabaseAuthPrive_gt_match_report_versions"
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 10. Désignation des officiels
--    Table : supabaseAuthPrive_gt_tournament_officials
--    Pages : manage-tournament.html, match-report.html, match-details.html
--    Si elle est incomplète : Personne n'est autorisé à rédiger un rapport ni à saisir un relevé.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."supabaseAuthPrive_gt_tournament_officials" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS match_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS role_code text;
ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;
ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS designated_by uuid;
ALTER TABLE public."supabaseAuthPrive_gt_tournament_officials"
    ADD COLUMN IF NOT EXISTS designated_at timestamptz;

-- ────────────────────────────────────────────────────────────
-- 11. VESTIGE : player_name
-- ────────────────────────────────────────────────────────────
-- Cette colonne était lue par trois pages et écrite par aucune :
-- un reste de l'ancien effectif en texte libre, retiré depuis.
-- Si elle n'existait pas, les trois requêtes échouaient EN
-- ENTIER et l'effectif revenait vide — c'est ce qui vidait le
-- sélecteur du relevé d'observation.
--
-- Le chantier 12 a retiré sa lecture du code : tu n'as donc
-- RIEN à faire ici. La ligne ci-dessous est laissée en
-- commentaire au cas où d'anciennes données y seraient encore
-- stockées et où tu voudrais les conserver.
--
-- ALTER TABLE public."supabaseAuthPrive_gt_team_players"
--     ADD COLUMN IF NOT EXISTS player_name text;


-- ────────────────────────────────────────────────────────────
-- APRÈS L'EXÉCUTION
-- ────────────────────────────────────────────────────────────
-- 1. Relance gt-diagnostic.html : tout doit être au vert.
-- 2. Va dans « Mon équipe », pose ta composition, enregistre.
--    Le message doit être vert. S'il est rouge, il te dit
--    maintenant exactement pourquoi.
-- 3. Recharge la page : la formation doit être là.
-- 4. Sur un match déjà joué, ouvre « Détails d'un match » →
--    « Calculer depuis les rapports ». Le sélecteur du relevé
--    doit afficher « #14 · NOM Prénom », plus jamais
--    « Footballeur » quatorze fois.
--
-- Aucune donnée existante n'a été touchée par ce script.
-- ════════════════════════════════════════════════════════════
