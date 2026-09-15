/* ============================================================
   HubISoccer — gt-schema.js
   Systeme Gestion Tournois — ce que le code attend de la base
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Pendant des semaines, les pages ont ecrit dans des colonnes
   qui n'existaient pas. PostgREST repond alors 42703
   (« column ... does not exist ») et refuse TOUTE la requete :
   pas seulement la colonne fautive, la ligne entiere.

   Et comme la plupart de ces echecs finissaient dans un
   console.warn(), la page affichait quand meme « enregistre ».
   L'organisateur voyait un message vert et ne retrouvait rien
   au retour. C'est l'origine de « la formation de depart n'est
   plus la » et de « tout est chamboule ».

   Ce fichier est la LISTE DE REFERENCE : pour chaque table, les
   colonnes que le code lit ou ecrit vraiment, relevees dans le
   code lui-meme. gt-diagnostic.html s'en sert pour interroger la
   vraie base et dire, colonne par colonne, ce qui manque — puis
   pour engendrer le SQL exact qui repare, sans rien detruire.

   COMMENT LE TENIR A JOUR

   Une colonne ajoutee dans une page se rajoute ici. Rien
   d'autre a faire : le diagnostic la verifiera au prochain
   passage.
   ============================================================ */
window.GTSchema = (function () {
    'use strict';

    // Les 84 compteurs de gt-stats.js. Ils sont ecrits d'un seul
    // bloc : si UN SEUL manque, l'insertion entiere est refusee
    // et aucune statistique n'est enregistree pour le match.
    var COMPTEURS_STATS = [
        'minutes_played', 'is_starter', 'position_played',
        'goals', 'own_goals', 'assists', 'yellow_cards', 'red_cards',
        'is_motm', 'team_of_the_week',
        'expected_goals', 'shots_total', 'shots_on_target', 'shots_off_target',
        'shots_blocked', 'shots_woodwork', 'big_chances', 'big_chances_missed',
        'offsides', 'penalties_won', 'penalties_scored', 'penalties_missed',
        'expected_assists', 'passes_completed', 'passes_attempted', 'key_passes',
        'big_chances_created', 'crosses_completed', 'crosses_attempted',
        'passes_own_half_completed', 'passes_own_half_attempted',
        'passes_opposition_half_completed', 'passes_opposition_half_attempted',
        'long_balls_completed', 'long_balls_attempted',
        'chipped_passes_completed', 'chipped_passes_attempted',
        'defensive_actions', 'tackles_won', 'tackles_attempted', 'interceptions',
        'clearances', 'blocked_shots', 'recoveries', 'possession_won_final_third',
        'last_man_tackle', 'dribbled_past', 'errors_leading_to_shot',
        'errors_leading_to_goal', 'penalties_conceded', 'fouls_committed',
        'fouls_suffered', 'duels_won', 'duels_total', 'ground_duels_won',
        'ground_duels_total', 'aerial_duels_won', 'aerial_duels_total',
        'saves', 'saves_inside_box', 'goals_prevented', 'punches', 'high_claims',
        'high_claims_successful', 'sweeper_actions', 'goals_conceded',
        'clean_sheet', 'penalties_saved', 'touches', 'dribbles_completed',
        'dribbles_attempted', 'unsuccessful_touches', 'possession_lost',
        'running_km', 'high_speed_running_km', 'sprint_km', 'total_progression_m',
        'distance_km', 'sprints', 'top_speed_kmh'
    ];

    // ═══════════════════════════════════════════════════════
    // LES TABLES
    // -------------------------------------------------------
    // module   : a quoi elle sert, en francais
    // casse    : ce qui ne marche plus si elle manque
    // colonnes : { nom: 'type SQL' } — le type sert au SQL de
    //            reparation engendre par le diagnostic
    // ═══════════════════════════════════════════════════════
    var TABLES = [
        {
            nom: 'supabaseAuthPrive_gt_team_players',
            module: 'Effectif et composition',
            pages: ['mon-equipe.html', 'team-details.html', 'match-details.html', 'match-report.html'],
            casse: "L'effectif ne se charge plus. Le sélecteur du relevé d'observation " +
                   "n'affiche plus que le mot du sport répété, et l'arbitre ne peut " +
                   "désigner personne dans son rapport.",
            colonnes: {
                id:                'uuid',
                team_id:           'uuid',
                user_id:           'uuid',
                member_name:       'text',
                member_photo_url:  'text',
                member_category:   'text',
                position:          'text',
                position_detail:   'text',
                position_category: 'text',
                jersey_number:     'integer',
                is_captain:        'boolean',
                is_starting:       'boolean',
                is_coach:          'boolean',
                is_president:      'boolean',
                is_manager:        'boolean',
                is_injured:        'boolean',
                is_suspended:      'boolean',
                age:               'integer',
                height_cm:         'integer',
                languages_spoken:  'text',
                pos_x:             'numeric',
                pos_y:             'numeric',
                slot_key:          'text',
                created_at:        'timestamptz',
                updated_at:        'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_teams',
            module: 'Équipes',
            pages: ['mon-equipe.html', 'manage-tournament.html', 'team-details.html'],
            casse: "La formation par défaut de l'équipe n'est jamais retenue : " +
                   "au retour sur la page, le terrain est vide et tout le monde est au banc.",
            colonnes: {
                id:                'uuid',
                tournament_id:     'uuid',
                name:              'text',
                logo_url:          'text',
                creator_id:        'uuid',
                age_category:      'text',
                group_name:        'text',
                default_formation: 'text',
                team_format:       'integer',
                sport_code:        'text',
                created_at:        'timestamptz',
                updated_at:        'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_match_lineups',
            module: 'Composition par rencontre',
            pages: ['mon-equipe.html', 'match-details.html'],
            casse: "La composition d'un match ne s'enregistre pas. Chaque retour sur " +
                   "la page repart de zéro et la formation choisie est perdue.",
            colonnes: {
                id:               'uuid',
                match_id:         'uuid',
                tournament_id:    'uuid',
                team_id:          'uuid',
                team_player_id:   'uuid',
                player_id:        'uuid',
                member_name:      'text',
                jersey_number:    'integer',
                is_starter:       'boolean',
                pos_x:            'numeric',
                pos_y:            'numeric',
                slot_key:         'text',
                position_group:   'text',
                position_detail:  'text',
                formation:        'text',
                team_format:      'integer',
                bench_order:      'integer',
                is_captain:       'boolean',
                is_injured:       'boolean',
                injury_minute:    'integer',
                sub_in_minute:    'integer',
                sub_out_minute:   'integer',
                status:           'text',
                created_by:       'uuid',
                updated_by:       'uuid',
                created_at:       'timestamptz',
                updated_at:       'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_match_events',
            module: 'Événements de match',
            pages: ['match-report.html', 'match-details.html'],
            casse: "Les buts, cartons et remplacements saisis par l'arbitre ne " +
                   "quittent jamais le rapport : aucune statistique ne peut être calculée.",
            colonnes: {
                id:               'uuid',
                match_id:         'uuid',
                team_id:          'uuid',
                player_id:        'uuid',
                assist_player_id: 'uuid',
                event_type:       'text',
                minute:           'integer',
                detail:           'text',
                source_report_id: 'uuid',
                created_at:       'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_player_match_stats',
            module: 'Statistiques par rencontre',
            pages: ['match-details.html', 'player-stats.html', 'stats-compare.html', 'rankings.html'],
            casse: "Le relevé d'observation ne s'enregistre pas et « Calculer depuis " +
                   "les rapports » n'écrit rien. Une seule colonne manquante suffit : " +
                   "PostgREST refuse la ligne entière.",
            colonnes: (function () {
                var c = {
                    id:              'uuid',
                    match_id:        'uuid',
                    player_id:       'uuid',
                    team_id:         'uuid',
                    tournament_id:   'uuid',
                    match_rating:    'numeric',
                    rating_attack:   'numeric',
                    rating_passing:  'numeric',
                    rating_dribbling:'numeric',
                    rating_defence:  'numeric',
                    rating_goalkeeping: 'numeric',
                    heatmap:         'jsonb',
                    source:          'text',
                    updated_by:      'uuid',
                    created_at:      'timestamptz',
                    updated_at:      'timestamptz'
                };
                COMPTEURS_STATS.forEach(function (cle) {
                    if (c[cle]) return;
                    if (cle === 'position_played') { c[cle] = 'text'; return; }
                    if (cle === 'is_starter' || cle === 'is_motm' ||
                        cle === 'team_of_the_week' || cle === 'clean_sheet' ||
                        cle === 'last_man_tackle') { c[cle] = 'boolean'; return; }
                    if (/_km$|_kmh$|^expected_|_m$/.test(cle)) { c[cle] = 'numeric'; return; }
                    c[cle] = 'integer';
                });
                return c;
            })()
        },
        {
            nom: 'supabaseAuthPrive_gt_matches',
            module: 'Calendrier et rencontres',
            pages: ['tournament-details.html', 'match-details.html', 'manage-tournament.html'],
            casse: "Le calendrier, le tableau final et le classement ne se construisent plus.",
            colonnes: {
                id:                'uuid',
                tournament_id:     'uuid',
                team_a_id:         'uuid',
                team_b_id:         'uuid',
                match_date:        'timestamptz',
                venue:             'text',
                round:             'text',
                matchday:          'integer',
                leg:               'integer',
                group_name:        'text',
                bracket_position:  'integer',
                is_bye:            'boolean',
                status:            'text',
                score_a:           'integer',
                score_b:           'integer',
                penalty_a:         'integer',
                penalty_b:         'integer',
                penalty_winner_id: 'uuid',
                forfeit_team_id:   'uuid',
                duration_minutes:  'integer',
                lineups_locked:    'boolean',
                lineup_a_confirmed:'boolean',
                lineup_b_confirmed:'boolean',
                created_at:        'timestamptz',
                updated_at:        'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_standings',
            module: 'Classement',
            pages: ['rankings.html', 'tournament-details.html'],
            casse: "Le classement reste vide ou s'affiche à plat, sans respecter les " +
                   "groupes du format choisi par l'organisateur.",
            colonnes: {
                id:                 'uuid',
                tournament_id:      'uuid',
                team_id:            'uuid',
                group_name:         'text',
                played:             'integer',
                wins:               'integer',
                draws:              'integer',
                losses:             'integer',
                goals_for:          'integer',
                goals_against:      'integer',
                goal_difference:    'integer',
                points:             'integer',
                discipline_points:  'integer',
                current_rank:       'integer',
                qualification_zone: 'text',
                recent_form:        'text',
                updated_at:         'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_match_reports',
            module: 'Rapports de match',
            pages: ['match-report.html', 'match-details.html', 'match-report-export.html'],
            casse: "Les officiels ne peuvent plus déposer de rapport.",
            colonnes: {
                id:             'uuid',
                match_id:       'uuid',
                tournament_id:  'uuid',
                team_id:        'uuid',
                user_id:        'uuid',
                role_code:      'text',
                report_type:    'text',
                content:        'jsonb',
                file_url:       'text',
                signature_data: 'text',
                status:         'text',
                is_locked:      'boolean',
                version_count:  'integer',
                created_at:     'timestamptz',
                updated_at:     'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_match_report_versions',
            module: 'Versions des rapports',
            pages: ['match-report.html'],
            casse: "Le suivi des trois versions d'un rapport ne fonctionne plus.",
            colonnes: {
                id:             'uuid',
                match_id:       'uuid',
                user_id:        'uuid',
                role_code:      'text',
                version_number: 'integer',
                content:        'jsonb',
                status:         'text',
                is_locked:      'boolean',
                review_comment: 'text',
                signature_data: 'text',
                submitted_at:   'timestamptz',
                created_at:     'timestamptz'
            }
        },
        {
            nom: 'supabaseAuthPrive_gt_tournament_officials',
            module: 'Désignation des officiels',
            pages: ['manage-tournament.html', 'match-report.html', 'match-details.html'],
            casse: "Personne n'est autorisé à rédiger un rapport ni à saisir un relevé.",
            colonnes: {
                id:             'uuid',
                tournament_id:  'uuid',
                match_id:       'uuid',
                team_id:        'uuid',
                user_id:        'uuid',
                role_code:      'text',
                is_active:      'boolean',
                designated_by:  'uuid',
                designated_at:  'timestamptz'
            }
        }
    ];

    // Les colonnes qu'AUCUNE page n'ecrit jamais mais que
    // certaines lisent encore : vestiges d'un systeme retire.
    // Les lire fait echouer la requete entiere si elles
    // n'existent pas.
    var VESTIGES = [
        {
            colonne: 'player_name',
            table: 'supabaseAuthPrive_gt_team_players',
            lue_par: ['match-details.js:699', 'match-report.js:333', 'manage-tournament.js:1075'],
            ecrite_par: [],
            note: "Reste d'un effectif en texte libre, retiré (voir le commentaire " +
                  "de manage-tournament.js). Aucune page ne l'écrit plus. Si la colonne " +
                  "n'existe pas, les trois requêtes échouent en entier et l'effectif " +
                  "revient vide — c'est ce qui vide le sélecteur du relevé d'observation."
        }
    ];

    return {
        TABLES: TABLES,
        VESTIGES: VESTIGES,
        COMPTEURS_STATS: COMPTEURS_STATS,
        colonnesDe: function (nomTable) {
            var t = TABLES.filter(function (x) { return x.nom === nomTable; })[0];
            return t ? Object.keys(t.colonnes) : [];
        },
        total: function () {
            return TABLES.reduce(function (n, t) { return n + Object.keys(t.colonnes).length; }, 0);
        }
    };
})();
