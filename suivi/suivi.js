// ========== SUIVI.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : TRADUCTIONS (24 LANGUES) ==========
const translations = {
    fr: {
      'loader.message': 'Chargement...',
      'hub_market': 'HUBISOCCER MARKET',
      'hub_community': 'HUB COMMUNITY',
      'scouting': 'SCOUTING',
      'processus': 'PROCESSUS',
      'affiliation': 'AFFILIATION',
      'premier_pas': 'PREMIER-PAS',
      'acteurs': 'DEVENEZ UN ACTEUR',
      'artiste': 'DEVENEZ UN ARTISTE',
      'tournoi_public': 'TOURNOI PUBLIC',
      'esp': 'SAVOIR+',
      'connexion': 'Connexion',
      'inscrire': 'S\'inscrire',
      'suivi.title': 'Suivi de candidature sportif',
      'suivi.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
      'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
      'suivi.check': 'Vérifier',
      'suivi.messages.title': 'Messages',
      'suivi.messages.send': 'Envoyer un message',
      'suivi.messages.empty': 'Aucun message pour le moment.',
      'suivi.support': 'Une question ?',
      'suivi.support.link': 'Contactez le support',
      'suivi.exam.title': 'Résultat de l\'examen',
      'suivi.exam.pending': 'Votre examen est en cours de correction.',
      'suivi.exam.corrected': 'Votre examen a été corrigé.',
      'suivi.exam.note': 'Note finale : {note}/20',
      'suivi.exam.comment': 'Commentaire : {comment}',
      'suivi.exam.passed': 'Félicitations, vous avez réussi !',
      'suivi.exam.failed': 'Malheureusement, vous n\'avez pas atteint la moyenne.',
      'suivi.testpratique.title': 'Test pratique',
      'footer_conformite': 'Conformité APDP Bénin',
      'footer_reglementation': 'Règlementation FIFA',
      'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
      'contact_tel': '📞 +229 01 95 97 31 57',
      'contact_email': '📧 contacthubisoccer@gmail.com',
      'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
      'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
      'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
      'toast.error_check': 'Erreur lors de la vérification.',
      'toast.error_load_messages': 'Erreur chargement messages',
      'toast.empty_message': 'Message vide',
      'toast.message_sent': 'Message envoyé',
      'toast.error_send': 'Erreur envoi message',
      'toast.enter_id': 'Veuillez saisir un identifiant.',
      'status.en_attente': 'En attente',
      'status.valide_public': 'Approuvé',
      'status.rejete': 'Rejeté',
      'status.bloque': 'Bloqué',
      'status.supprime': 'Supprimé',
      'status.test_ecrit': 'Test écrit',
      'status.test_pratique': 'Test pratique',
      'sport_label.football': 'Football',
      'sport_label.basketball': 'Basketball',
      'sport_label.tennis': 'Tennis',
      'sport_label.athletisme': 'Athlétisme',
      'sport_label.handball': 'Handball',
      'sport_label.volleyball': 'Volley-ball',
      'sport_label.rugby': 'Rugby',
      'sport_label.natation': 'Natation',
      'sport_label.arts_martiaux': 'Arts martiaux',
      'sport_label.cyclisme': 'Cyclisme',
      'field.full_name': 'Nom complet',
      'field.birth_date': 'Date de naissance',
      'field.phone': 'Téléphone',
      'field.diploma_title': 'Diplôme / formation',
      'field.parent_name': 'Parent / tuteur',
      'field.inscription_code': 'Code d\'inscription',
      'field.affiliate_id': 'ID affilié',
      'field.sport': 'Sport',
      'field.role': 'Rôle',
      'field.created_at': 'Date de soumission',
      'field.email': 'Email',
      'field.login': 'Identifiant de connexion'
    },
    en: {
      'loader.message': 'Loading...',
      'hub_market': 'HUBISOCCER MARKET',
      'hub_community': 'Hub Community',
      'scouting': 'Scouting',
      'processus': 'Process',
      'affiliation': 'Affiliation',
      'premier_pas': 'FIRST STEP',
      'acteurs': 'Become an actor',
      'artiste': 'Become an artist',
      'tournoi_public': 'Public Tournament',
      'esp': 'Learn more',
      'connexion': 'Login',
      'inscrire': 'Sign up',
      'suivi.title': 'Athlete application tracking',
      'suivi.subtitle': 'Enter the ID you received after registration.',
      'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
      'suivi.check': 'Check',
      'suivi.messages.title': 'Messages',
      'suivi.messages.send': 'Send a message',
      'suivi.messages.empty': 'No messages yet.',
      'suivi.support': 'A question?',
      'suivi.support.link': 'Contact support',
      'suivi.exam.title': 'Exam result',
      'suivi.exam.pending': 'Your exam is being corrected.',
      'suivi.exam.corrected': 'Your exam has been corrected.',
      'suivi.exam.note': 'Final mark: {note}/20',
      'suivi.exam.comment': 'Comment: {comment}',
      'suivi.exam.passed': 'Congratulations, you passed!',
      'suivi.exam.failed': 'Unfortunately, you did not reach the average.',
      'suivi.testpratique.title': 'Practical test',
      'footer_conformite': 'APDP Benin Compliance',
      'footer_reglementation': 'FIFA Regulations',
      'footer_double_projet': 'Triple Sport-Studies-Career Project',
      'contact_tel': '📞 +229 01 95 97 31 57',
      'contact_email': '📧 contacthubisoccer@gmail.com',
      'rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
      'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
      'toast.id_not_found': 'ID not found. Please check your code.',
      'toast.error_check': 'Error during verification.',
      'toast.error_load_messages': 'Error loading messages',
      'toast.empty_message': 'Empty message',
      'toast.message_sent': 'Message sent',
      'toast.error_send': 'Error sending message',
      'toast.enter_id': 'Please enter an ID.',
      'status.en_attente': 'Pending',
      'status.valide_public': 'Approved',
      'status.rejete': 'Rejected',
      'status.bloque': 'Blocked',
      'status.supprime': 'Deleted',
      'status.test_ecrit': 'Written test',
      'status.test_pratique': 'Practical test',
      'sport_label.football': 'Football',
      'sport_label.basketball': 'Basketball',
      'sport_label.tennis': 'Tennis',
      'sport_label.athletisme': 'Athletics',
      'sport_label.handball': 'Handball',
      'sport_label.volleyball': 'Volleyball',
      'sport_label.rugby': 'Rugby',
      'sport_label.natation': 'Swimming',
      'sport_label.arts_martiaux': 'Martial arts',
      'sport_label.cyclisme': 'Cycling',
      'field.full_name': 'Full name',
      'field.birth_date': 'Date of birth',
      'field.phone': 'Phone',
      'field.diploma_title': 'Diploma / training',
      'field.parent_name': 'Parent / guardian',
      'field.inscription_code': 'Registration code',
      'field.affiliate_id': 'Affiliate ID',
      'field.sport': 'Sport',
      'field.role': 'Role',
      'field.created_at': 'Submission date',
      'field.email': 'Email',
      'field.login': 'Login ID'
    },
    yo: {
        'loader.message': 'Nlọ...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'Ilana',
        'affiliation': 'Ifọwọsi',
        'premier_pas': 'Igbese Akọkọ',
        'acteurs': 'Di Oṣere',
        'artiste': 'Di Oṣere',
        'tournoi_public': 'Idije Gbogbo eniyan',
        'esp': 'Kọ Ẹkọ Siwaju',
        'connexion': 'Wo ile',
        'inscrire': 'Forukọsilẹ',
        'suivi.title': 'Abẹwo si faili elere idaraya',
        'suivi.subtitle': 'Tẹ ID ti o gba lẹhin iforukọsilẹ rẹ.',
        'suivi.placeholder': 'Apeere: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Ṣayẹwo',
        'suivi.messages.title': 'Awọn ifiranṣẹ',
        'suivi.messages.send': 'Fi ifiranṣẹ ranṣẹ',
        'suivi.messages.empty': 'Ko si ifiranṣẹ fun akoko yii.',
        'suivi.support': 'Ibeere kan?',
        'suivi.support.link': 'Kan si atilẹyin',
        'suivi.exam.title': 'Abajade idanwo',
        'suivi.exam.pending': 'Idanwo rẹ n ṣe atunṣe.',
        'suivi.exam.corrected': 'Idanwo rẹ ti ṣe atunṣe.',
        'suivi.exam.note': 'Ami ikẹhin: {note}/20',
        'suivi.exam.comment': 'Ọrọ asọye: {comment}',
        'suivi.exam.passed': 'Oriire, o ṣege!',
        'suivi.exam.failed': 'Laanu, o ko de ipele apapọ.',
        'suivi.testpratique.title': 'Idanwo adani',
        'footer_conformite': 'Ifaramọ APDP Benin',
        'footer_reglementation': 'Awọn ilana FIFA',
        'footer_double_projet': 'Ise agbese Idaraya-Ẹkọ-Meji',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.',
        'toast.id_not_found': 'A ko ri ID yii. Jọwọ ṣayẹwo koodu rẹ.',
        'toast.error_check': 'Aṣiṣe lakoko ṣiṣewadii.',
        'toast.error_load_messages': 'Aṣiṣe gbigba awọn ifiranṣẹ',
        'toast.empty_message': 'Ifiranṣẹ ofo',
        'toast.message_sent': 'Ifiranṣẹ ti ranṣẹ',
        'toast.error_send': 'Aṣiṣe fifi ifiranṣẹ ranṣẹ',
        'toast.enter_id': 'Jọwọ tẹ ID kan.',
        'status.en_attente': 'Ni idaduro',
        'status.valide_public': 'Ti fọwọsi',
        'status.rejete': 'Ti kọ',
        'status.bloque': 'Ti dina',
        'status.supprime': 'Ti paarẹ',
        'status.test_ecrit': 'Idanwo kikọ',
        'status.test_pratique': 'Idanwo adani',
        'sport_label.football': 'Bọọlu afẹsẹgba',
        'sport_label.basketball': 'Bọọlu agbọn',
        'sport_label.tennis': 'Tẹnisi',
        'sport_label.athletisme': 'Idaraya',
        'sport_label.handball': 'Bọọlu ọwọ',
        'sport_label.volleyball': 'Bọọlu afẹfẹ',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Odo',
        'sport_label.arts_martiaux': 'Iṣẹ ọna ogun',
        'sport_label.cyclisme': 'Kẹkẹ ẹlẹsẹ',
        'field.full_name': 'Orukọ kikun',
        'field.birth_date': 'Ọjọ ibi',
        'field.phone': 'Foonu',
        'field.diploma_title': 'Diploma / ikẹkọ',
        'field.parent_name': 'Obi / olutọju',
        'field.inscription_code': 'Koodu iforukọsilẹ',
        'field.affiliate_id': 'ID ti o ni ifọwọsi',
        'field.sport': 'Idaraya',
        'field.role': 'Ipa',
        'field.created_at': 'Ọjọ ifisilẹ',
        'field.email': 'Imeeli',
        'field.login': 'ID iwọle'
    },
    fon: {
        'loader.message': 'Tɛn ɖo...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Byɔ xɔntin',
        'inscrire': 'Nyikɔ wlan',
        'suivi.title': 'Suivi de candidature sportif',
        'suivi.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Vérifier',
        'suivi.messages.title': 'Messages',
        'suivi.messages.send': 'Envoyer un message',
        'suivi.messages.empty': 'Aucun message pour le moment.',
        'suivi.support': 'Une question ?',
        'suivi.support.link': 'Contactez le support',
        'suivi.exam.title': 'Résultat de l\'examen',
        'suivi.exam.pending': 'Votre examen est en cours de correction.',
        'suivi.exam.corrected': 'Votre examen a été corrigé.',
        'suivi.exam.note': 'Note finale : {note}/20',
        'suivi.exam.comment': 'Commentaire : {comment}',
        'suivi.exam.passed': 'Félicitations, vous avez réussi !',
        'suivi.exam.failed': 'Malheureusement, vous n\'avez pas atteint la moyenne.',
        'suivi.testpratique.title': 'Test pratique',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
        'toast.error_check': 'Erreur lors de la vérification.',
        'toast.error_load_messages': 'Erreur chargement messages',
        'toast.empty_message': 'Message vide',
        'toast.message_sent': 'Message envoyé',
        'toast.error_send': 'Erreur envoi message',
        'toast.enter_id': 'Veuillez saisir un identifiant.',
        'status.en_attente': 'En attente',
        'status.valide_public': 'Approuvé',
        'status.rejete': 'Rejeté',
        'status.bloque': 'Bloqué',
        'status.supprime': 'Supprimé',
        'status.test_ecrit': 'Test écrit',
        'status.test_pratique': 'Test pratique',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley-ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'field.full_name': 'Nom complet',
        'field.birth_date': 'Date de naissance',
        'field.phone': 'Téléphone',
        'field.diploma_title': 'Diplôme / formation',
        'field.parent_name': 'Parent / tuteur',
        'field.inscription_code': 'Code d\'inscription',
        'field.affiliate_id': 'ID affilié',
        'field.sport': 'Sport',
        'field.role': 'Rôle',
        'field.created_at': 'Date de soumission',
        'field.email': 'Email',
        'field.login': 'Identifiant de connexion'
    },
    mina: {
        'loader.message': 'Chargement...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Gé ɖé émè',
        'inscrire': 'Ŋkɔ́ wlá',
        'suivi.title': 'Suivi de candidature sportif',
        'suivi.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Vérifier',
        'suivi.messages.title': 'Messages',
        'suivi.messages.send': 'Envoyer un message',
        'suivi.messages.empty': 'Aucun message pour le moment.',
        'suivi.support': 'Une question ?',
        'suivi.support.link': 'Contactez le support',
        'suivi.exam.title': 'Résultat de l\'examen',
        'suivi.exam.pending': 'Votre examen est en cours de correction.',
        'suivi.exam.corrected': 'Votre examen a été corrigé.',
        'suivi.exam.note': 'Note finale : {note}/20',
        'suivi.exam.comment': 'Commentaire : {comment}',
        'suivi.exam.passed': 'Félicitations, vous avez réussi !',
        'suivi.exam.failed': 'Malheureusement, vous n\'avez pas atteint la moyenne.',
        'suivi.testpratique.title': 'Test pratique',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
        'toast.error_check': 'Erreur lors de la vérification.',
        'toast.error_load_messages': 'Erreur chargement messages',
        'toast.empty_message': 'Message vide',
        'toast.message_sent': 'Message envoyé',
        'toast.error_send': 'Erreur envoi message',
        'toast.enter_id': 'Veuillez saisir un identifiant.',
        'status.en_attente': 'En attente',
        'status.valide_public': 'Approuvé',
        'status.rejete': 'Rejeté',
        'status.bloque': 'Bloqué',
        'status.supprime': 'Supprimé',
        'status.test_ecrit': 'Test écrit',
        'status.test_pratique': 'Test pratique',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley-ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'field.full_name': 'Nom complet',
        'field.birth_date': 'Date de naissance',
        'field.phone': 'Téléphone',
        'field.diploma_title': 'Diplôme / formation',
        'field.parent_name': 'Parent / tuteur',
        'field.inscription_code': 'Code d\'inscription',
        'field.affiliate_id': 'ID affilié',
        'field.sport': 'Sport',
        'field.role': 'Rôle',
        'field.created_at': 'Date de soumission',
        'field.email': 'Email',
        'field.login': 'Identifiant de connexion'
    },
    lin: {
        'loader.message': 'Chargement...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Kota',
        'inscrire': 'Komikomisa',
        'suivi.title': 'Suivi de candidature sportif',
        'suivi.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Vérifier',
        'suivi.messages.title': 'Messages',
        'suivi.messages.send': 'Envoyer un message',
        'suivi.messages.empty': 'Aucun message pour le moment.',
        'suivi.support': 'Une question ?',
        'suivi.support.link': 'Contactez le support',
        'suivi.exam.title': 'Résultat de l\'examen',
        'suivi.exam.pending': 'Votre examen est en cours de correction.',
        'suivi.exam.corrected': 'Votre examen a été corrigé.',
        'suivi.exam.note': 'Note finale : {note}/20',
        'suivi.exam.comment': 'Commentaire : {comment}',
        'suivi.exam.passed': 'Félicitations, vous avez réussi !',
        'suivi.exam.failed': 'Malheureusement, vous n\'avez pas atteint la moyenne.',
        'suivi.testpratique.title': 'Test pratique',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
        'toast.error_check': 'Erreur lors de la vérification.',
        'toast.error_load_messages': 'Erreur chargement messages',
        'toast.empty_message': 'Message vide',
        'toast.message_sent': 'Message envoyé',
        'toast.error_send': 'Erreur envoi message',
        'toast.enter_id': 'Veuillez saisir un identifiant.',
        'status.en_attente': 'En attente',
        'status.valide_public': 'Approuvé',
        'status.rejete': 'Rejeté',
        'status.bloque': 'Bloqué',
        'status.supprime': 'Supprimé',
        'status.test_ecrit': 'Test écrit',
        'status.test_pratique': 'Test pratique',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley-ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'field.full_name': 'Nom complet',
        'field.birth_date': 'Date de naissance',
        'field.phone': 'Téléphone',
        'field.diploma_title': 'Diplôme / formation',
        'field.parent_name': 'Parent / tuteur',
        'field.inscription_code': 'Code d\'inscription',
        'field.affiliate_id': 'ID affilié',
        'field.sport': 'Sport',
        'field.role': 'Rôle',
        'field.created_at': 'Date de soumission',
        'field.email': 'Email',
        'field.login': 'Identifiant de connexion'
    },
    wol: {
        'loader.message': 'Chargement...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Dugg',
        'inscrire': 'Seetal',
        'suivi.title': 'Suivi de candidature sportif',
        'suivi.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Vérifier',
        'suivi.messages.title': 'Messages',
        'suivi.messages.send': 'Envoyer un message',
        'suivi.messages.empty': 'Aucun message pour le moment.',
        'suivi.support': 'Une question ?',
        'suivi.support.link': 'Contactez le support',
        'suivi.exam.title': 'Résultat de l\'examen',
        'suivi.exam.pending': 'Votre examen est en cours de correction.',
        'suivi.exam.corrected': 'Votre examen a été corrigé.',
        'suivi.exam.note': 'Note finale : {note}/20',
        'suivi.exam.comment': 'Commentaire : {comment}',
        'suivi.exam.passed': 'Félicitations, vous avez réussi !',
        'suivi.exam.failed': 'Malheureusement, vous n\'avez pas atteint la moyenne.',
        'suivi.testpratique.title': 'Test pratique',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
        'toast.error_check': 'Erreur lors de la vérification.',
        'toast.error_load_messages': 'Erreur chargement messages',
        'toast.empty_message': 'Message vide',
        'toast.message_sent': 'Message envoyé',
        'toast.error_send': 'Erreur envoi message',
        'toast.enter_id': 'Veuillez saisir un identifiant.',
        'status.en_attente': 'En attente',
        'status.valide_public': 'Approuvé',
        'status.rejete': 'Rejeté',
        'status.bloque': 'Bloqué',
        'status.supprime': 'Supprimé',
        'status.test_ecrit': 'Test écrit',
        'status.test_pratique': 'Test pratique',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley-ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'field.full_name': 'Nom complet',
        'field.birth_date': 'Date de naissance',
        'field.phone': 'Téléphone',
        'field.diploma_title': 'Diplôme / formation',
        'field.parent_name': 'Parent / tuteur',
        'field.inscription_code': 'Code d\'inscription',
        'field.affiliate_id': 'ID affilié',
        'field.sport': 'Sport',
        'field.role': 'Rôle',
        'field.created_at': 'Date de soumission',
        'field.email': 'Email',
        'field.login': 'Identifiant de connexion'
    },
    diou: {
        'loader.message': 'Chargement...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Dɔ́n',
        'inscrire': 'Sɛ̀bɛ̀n',
        'suivi.title': 'Suivi de candidature sportif',
        'suivi.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Vérifier',
        'suivi.messages.title': 'Messages',
        'suivi.messages.send': 'Envoyer un message',
        'suivi.messages.empty': 'Aucun message pour le moment.',
        'suivi.support': 'Une question ?',
        'suivi.support.link': 'Contactez le support',
        'suivi.exam.title': 'Résultat de l\'examen',
        'suivi.exam.pending': 'Votre examen est en cours de correction.',
        'suivi.exam.corrected': 'Votre examen a été corrigé.',
        'suivi.exam.note': 'Note finale : {note}/20',
        'suivi.exam.comment': 'Commentaire : {comment}',
        'suivi.exam.passed': 'Félicitations, vous avez réussi !',
        'suivi.exam.failed': 'Malheureusement, vous n\'avez pas atteint la moyenne.',
        'suivi.testpratique.title': 'Test pratique',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
        'toast.error_check': 'Erreur lors de la vérification.',
        'toast.error_load_messages': 'Erreur chargement messages',
        'toast.empty_message': 'Message vide',
        'toast.message_sent': 'Message envoyé',
        'toast.error_send': 'Erreur envoi message',
        'toast.enter_id': 'Veuillez saisir un identifiant.',
        'status.en_attente': 'En attente',
        'status.valide_public': 'Approuvé',
        'status.rejete': 'Rejeté',
        'status.bloque': 'Bloqué',
        'status.supprime': 'Supprimé',
        'status.test_ecrit': 'Test écrit',
        'status.test_pratique': 'Test pratique',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley-ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'field.full_name': 'Nom complet',
        'field.birth_date': 'Date de naissance',
        'field.phone': 'Téléphone',
        'field.diploma_title': 'Diplôme / formation',
        'field.parent_name': 'Parent / tuteur',
        'field.inscription_code': 'Code d\'inscription',
        'field.affiliate_id': 'ID affilié',
        'field.sport': 'Sport',
        'field.role': 'Rôle',
        'field.created_at': 'Date de soumission',
        'field.email': 'Email',
        'field.login': 'Identifiant de connexion'
    },
    ha: {
        'loader.message': 'Ana lodi...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'TSARI',
        'affiliation': 'ALAƘA',
        'premier_pas': 'MATAKI NA FARKO',
        'acteurs': 'ZAMA DAN WASAN',
        'artiste': 'ZAMA MAWAKI',
        'tournoi_public': 'GASAR JAM\'IYYA',
        'esp': 'KARA KOYO',
        'connexion': 'Shiga',
        'inscrire': 'Yi rajista',
        'suivi.title': 'Bin diddigin ɗan wasa',
        'suivi.subtitle': 'Shigar da ID ɗin da kuka karɓa bayan rajista.',
        'suivi.placeholder': 'Misali: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Duba',
        'suivi.messages.title': 'Saƙonni',
        'suivi.messages.send': 'Aika saƙo',
        'suivi.messages.empty': 'Babu saƙo a yanzu.',
        'suivi.support': 'Tambaya?',
        'suivi.support.link': 'Tuntuɓi tallafi',
        'suivi.exam.title': 'Sakamakon jarrabawa',
        'suivi.exam.pending': 'Jarrabawarku tana kan gyara.',
        'suivi.exam.corrected': 'An gyara jarrabawarku.',
        'suivi.exam.note': 'Maki na ƙarshe: {note}/20',
        'suivi.exam.comment': 'Sharhi: {comment}',
        'suivi.exam.passed': 'Taya murna, kun ci!',
        'suivi.exam.failed': 'Abin takaici, ba ku kai matsakaici ba.',
        'suivi.testpratique.title': 'Jarrabawa mai amfani',
        'footer_conformite': 'APDP Benin Amincewa',
        'footer_reglementation': 'Dokokin FIFA',
        'footer_double_projet': 'Tsarin Wasanni-Ilimi-Aiki Uku',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Duk haƙƙoƙin mallaka.',
        'toast.id_not_found': 'Ba a sami ID ba. Tabbatar da lambar.',
        'toast.error_check': 'Kuskure yayin dubawa.',
        'toast.error_load_messages': 'Kuskure wajen ɗaukar saƙonni',
        'toast.empty_message': 'Saƙo babu komai',
        'toast.message_sent': 'An aika saƙo',
        'toast.error_send': 'Kuskure wajen aika saƙo',
        'toast.enter_id': 'Shigar da ID.',
        'status.en_attente': 'Yana jiran',
        'status.valide_public': 'An amince',
        'status.rejete': 'An ƙi',
        'status.bloque': 'An toshe',
        'status.supprime': 'An share',
        'status.test_ecrit': 'Jarrabawa rubutacce',
        'status.test_pratique': 'Jarrabawa mai amfani',
        'sport_label.football': 'Ƙwallon ƙafa',
        'sport_label.basketball': 'Kwando',
        'sport_label.tennis': 'Tenis',
        'sport_label.athletisme': 'Wasannin motsa jiki',
        'sport_label.handball': 'Hannun ƙwallo',
        'sport_label.volleyball': 'Ƙwallon raga',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Ruwa',
        'sport_label.arts_martiaux': 'Fadan gargajiya',
        'sport_label.cyclisme': 'Keke',
        'field.full_name': 'Cikakken suna',
        'field.birth_date': 'Ranar haihuwa',
        'field.phone': 'Waya',
        'field.diploma_title': 'Diploma / horo',
        'field.parent_name': 'Mahaifi / waliyyi',
        'field.inscription_code': 'Lambar rajista',
        'field.affiliate_id': 'ID na alaƙa',
        'field.sport': 'Wasanni',
        'field.role': 'Matsayi',
        'field.created_at': 'Ranar ƙaddamarwa',
        'field.email': 'Imel',
        'field.login': 'ID shiga'
    },
    sw: {
        'loader.message': 'Inapakia...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'MCHAKATO',
        'affiliation': 'Uhusiano',
        'premier_pas': 'HATUA YA KWANZA',
        'acteurs': 'KUWA MTAALAMU',
        'artiste': 'KUWA MSANII',
        'tournoi_public': 'MASHINDANO YA UMMA',
        'esp': 'JIFUNZE ZAIDI',
        'connexion': 'Ingia',
        'inscrire': 'Jiandikishe',
        'suivi.title': 'Ufuatiliaji wa maombi ya mwanariadha',
        'suivi.subtitle': 'Weka kitambulisho ulichopokea baada ya usajili.',
        'suivi.placeholder': 'Mfano: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Angalia',
        'suivi.messages.title': 'Ujumbe',
        'suivi.messages.send': 'Tuma ujumbe',
        'suivi.messages.empty': 'Hakuna ujumbe kwa sasa.',
        'suivi.support': 'Swali?',
        'suivi.support.link': 'Wasiliana na msaada',
        'suivi.exam.title': 'Matokeo ya mtihani',
        'suivi.exam.pending': 'Mtihani wako unarekebishwa.',
        'suivi.exam.corrected': 'Mtihani wako umerekebishwa.',
        'suivi.exam.note': 'Alama ya mwisho: {note}/20',
        'suivi.exam.comment': 'Maoni: {comment}',
        'suivi.exam.passed': 'Hongera, umefaulu!',
        'suivi.exam.failed': 'Kwa bahati mbaya, haukufikia wastani.',
        'suivi.testpratique.title': 'Mtihani wa vitendo',
        'footer_conformite': 'Uzingatiaji wa APDP Benin',
        'footer_reglementation': 'Kanuni za FIFA',
        'footer_double_projet': 'Mradi wa Michezo-Masomo-Kazi Mara Tatu',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Haki zote zimehifadhiwa.',
        'toast.id_not_found': 'Kitambulisho hakipatikani. Angalia nambari yako.',
        'toast.error_check': 'Hitilafu wakati wa kuthibitisha.',
        'toast.error_load_messages': 'Hitilafu kupakia ujumbe',
        'toast.empty_message': 'Ujumbe tupu',
        'toast.message_sent': 'Ujumbe umetumwa',
        'toast.error_send': 'Hitilafu kutuma ujumbe',
        'toast.enter_id': 'Tafadhali weka kitambulisho.',
        'status.en_attente': 'Inasubiri',
        'status.valide_public': 'Imeidhinishwa',
        'status.rejete': 'Imekataliwa',
        'status.bloque': 'Imezuiwa',
        'status.supprime': 'Imefutwa',
        'status.test_ecrit': 'Mtihani wa maandishi',
        'status.test_pratique': 'Mtihani wa vitendo',
        'sport_label.football': 'Soka',
        'sport_label.basketball': 'Kikapu',
        'sport_label.tennis': 'Tenis',
        'sport_label.athletisme': 'Riadha',
        'sport_label.handball': 'Mpira wa mkono',
        'sport_label.volleyball': 'Mpira wa wavu',
        'sport_label.rugby': 'Ragbi',
        'sport_label.natation': 'Kuogelea',
        'sport_label.arts_martiaux': 'Sanaa za kijeshi',
        'sport_label.cyclisme': 'Baiskeli',
        'field.full_name': 'Jina kamili',
        'field.birth_date': 'Tarehe ya kuzaliwa',
        'field.phone': 'Simu',
        'field.diploma_title': 'Diploma / mafunzo',
        'field.parent_name': 'Mzazi / mlezi',
        'field.inscription_code': 'Nambari ya usajili',
        'field.affiliate_id': 'Kitambulisho cha ushirika',
        'field.sport': 'Mchezo',
        'field.role': 'Jukumu',
        'field.created_at': 'Tarehe ya kuwasilisha',
        'field.email': 'Barua pepe',
        'field.login': 'Kitambulisho cha kuingia'
    },
    es: {
        'loader.message': 'Cargando...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESO',
        'affiliation': 'AFILIACIÓN',
        'premier_pas': 'PRIMER PASO',
        'acteurs': 'CONVIÉRTETE EN ACTOR',
        'artiste': 'CONVIÉRTETE EN ARTISTA',
        'tournoi_public': 'TORNEO PÚBLICO',
        'esp': 'SABER MÁS',
        'connexion': 'Iniciar sesión',
        'inscrire': 'Registrarse',
        'suivi.title': 'Seguimiento de solicitud de deportista',
        'suivi.subtitle': 'Ingrese el identificador que recibió después de inscribirse.',
        'suivi.placeholder': 'Ej: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Verificar',
        'suivi.messages.title': 'Mensajes',
        'suivi.messages.send': 'Enviar un mensaje',
        'suivi.messages.empty': 'No hay mensajes todavía.',
        'suivi.support': '¿Una pregunta?',
        'suivi.support.link': 'Contactar con soporte',
        'suivi.exam.title': 'Resultado del examen',
        'suivi.exam.pending': 'Su examen está siendo corregido.',
        'suivi.exam.corrected': 'Su examen ha sido corregido.',
        'suivi.exam.note': 'Nota final: {note}/20',
        'suivi.exam.comment': 'Comentario: {comment}',
        'suivi.exam.passed': '¡Felicidades, has aprobado!',
        'suivi.exam.failed': 'Desafortunadamente, no has alcanzado la media.',
        'suivi.testpratique.title': 'Prueba práctica',
        'footer_conformite': 'Conformidad APDP Benín',
        'footer_reglementation': 'Reglamento FIFA',
        'footer_double_projet': 'Triple Proyecto Deporte-Estudios-Carrera',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.',
        'toast.id_not_found': 'Identificador no encontrado. Verifique el código.',
        'toast.error_check': 'Error durante la verificación.',
        'toast.error_load_messages': 'Error al cargar mensajes',
        'toast.empty_message': 'Mensaje vacío',
        'toast.message_sent': 'Mensaje enviado',
        'toast.error_send': 'Error al enviar mensaje',
        'toast.enter_id': 'Por favor ingrese un identificador.',
        'status.en_attente': 'Pendiente',
        'status.valide_public': 'Aprobado',
        'status.rejete': 'Rechazado',
        'status.bloque': 'Bloqueado',
        'status.supprime': 'Eliminado',
        'status.test_ecrit': 'Examen escrito',
        'status.test_pratique': 'Prueba práctica',
        'sport_label.football': 'Fútbol',
        'sport_label.basketball': 'Baloncesto',
        'sport_label.tennis': 'Tenis',
        'sport_label.athletisme': 'Atletismo',
        'sport_label.handball': 'Balonmano',
        'sport_label.volleyball': 'Voleibol',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natación',
        'sport_label.arts_martiaux': 'Artes marciales',
        'sport_label.cyclisme': 'Ciclismo',
        'field.full_name': 'Nombre completo',
        'field.birth_date': 'Fecha de nacimiento',
        'field.phone': 'Teléfono',
        'field.diploma_title': 'Diploma / formación',
        'field.parent_name': 'Padre / tutor',
        'field.inscription_code': 'Código de inscripción',
        'field.affiliate_id': 'ID de afiliado',
        'field.sport': 'Deporte',
        'field.role': 'Rol',
        'field.created_at': 'Fecha de envío',
        'field.email': 'Correo electrónico',
        'field.login': 'ID de inicio de sesión'
    },
    pt: {
        'loader.message': 'Carregando...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSO',
        'affiliation': 'AFILIAÇÃO',
        'premier_pas': 'PRIMEIRO PASSO',
        'acteurs': 'TORNE-SE UM ATOR',
        'artiste': 'TORNE-SE UM ARTISTA',
        'tournoi_public': 'TORNEIO PÚBLICO',
        'esp': 'SAIBA MAIS',
        'connexion': 'Entrar',
        'inscrire': 'Inscrever-se',
        'suivi.title': 'Acompanhamento de candidatura de atleta',
        'suivi.subtitle': 'Insira o identificador que recebeu após a inscrição.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Verificar',
        'suivi.messages.title': 'Mensagens',
        'suivi.messages.send': 'Enviar uma mensagem',
        'suivi.messages.empty': 'Nenhuma mensagem no momento.',
        'suivi.support': 'Uma pergunta?',
        'suivi.support.link': 'Contacte o suporte',
        'suivi.exam.title': 'Resultado do exame',
        'suivi.exam.pending': 'O seu exame está a ser corrigido.',
        'suivi.exam.corrected': 'O seu exame foi corrigido.',
        'suivi.exam.note': 'Nota final: {note}/20',
        'suivi.exam.comment': 'Comentário: {comment}',
        'suivi.exam.passed': 'Parabéns, passou!',
        'suivi.exam.failed': 'Infelizmente, não atingiu a média.',
        'suivi.testpratique.title': 'Teste prático',
        'footer_conformite': 'Conformidade APDP Benim',
        'footer_reglementation': 'Regulamento FIFA',
        'footer_double_projet': 'Triplo Projeto Esporte-Estudos-Carreira',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.',
        'toast.id_not_found': 'Identificador não encontrado. Verifique o código.',
        'toast.error_check': 'Erro durante a verificação.',
        'toast.error_load_messages': 'Erro ao carregar mensagens',
        'toast.empty_message': 'Mensagem vazia',
        'toast.message_sent': 'Mensagem enviada',
        'toast.error_send': 'Erro ao enviar mensagem',
        'toast.enter_id': 'Por favor, insira um identificador.',
        'status.en_attente': 'Pendente',
        'status.valide_public': 'Aprovado',
        'status.rejete': 'Rejeitado',
        'status.bloque': 'Bloqueado',
        'status.supprime': 'Eliminado',
        'status.test_ecrit': 'Exame escrito',
        'status.test_pratique': 'Teste prático',
        'sport_label.football': 'Futebol',
        'sport_label.basketball': 'Basquetebol',
        'sport_label.tennis': 'Ténis',
        'sport_label.athletisme': 'Atletismo',
        'sport_label.handball': 'Andebol',
        'sport_label.volleyball': 'Voleibol',
        'sport_label.rugby': 'Râguebi',
        'sport_label.natation': 'Natação',
        'sport_label.arts_martiaux': 'Artes marciais',
        'sport_label.cyclisme': 'Ciclismo',
        'field.full_name': 'Nome completo',
        'field.birth_date': 'Data de nascimento',
        'field.phone': 'Telefone',
        'field.diploma_title': 'Diploma / formação',
        'field.parent_name': 'Pai / tutor',
        'field.inscription_code': 'Código de inscrição',
        'field.affiliate_id': 'ID de afiliado',
        'field.sport': 'Desporto',
        'field.role': 'Função',
        'field.created_at': 'Data de submissão',
        'field.email': 'E-mail',
        'field.login': 'ID de início de sessão'
    },
    de: {
        'loader.message': 'Laden...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROZESS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'ERSTER SCHRITT',
        'acteurs': 'WERDE AKTEUR',
        'artiste': 'WERDE KÜNSTLER',
        'tournoi_public': 'ÖFFENTLICHES TURNIER',
        'esp': 'MEHR ERFAHREN',
        'connexion': 'Anmelden',
        'inscrire': 'Registrieren',
        'suivi.title': 'Bewerbungsverfolgung Sportler',
        'suivi.subtitle': 'Geben Sie die nach der Registrierung erhaltene Kennung ein.',
        'suivi.placeholder': 'Bsp: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Überprüfen',
        'suivi.messages.title': 'Nachrichten',
        'suivi.messages.send': 'Nachricht senden',
        'suivi.messages.empty': 'Noch keine Nachrichten.',
        'suivi.support': 'Eine Frage?',
        'suivi.support.link': 'Support kontaktieren',
        'suivi.exam.title': 'Prüfungsergebnis',
        'suivi.exam.pending': 'Ihre Prüfung wird noch korrigiert.',
        'suivi.exam.corrected': 'Ihre Prüfung wurde korrigiert.',
        'suivi.exam.note': 'Endnote: {note}/20',
        'suivi.exam.comment': 'Kommentar: {comment}',
        'suivi.exam.passed': 'Glückwunsch, Sie haben bestanden!',
        'suivi.exam.failed': 'Leider haben Sie den Durchschnitt nicht erreicht.',
        'suivi.testpratique.title': 'Praktischer Test',
        'footer_conformite': 'APDP Benin Konformität',
        'footer_reglementation': 'FIFA-Regulierung',
        'footer_double_projet': 'Dreifachprojekt Sport-Studium-Beruf',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.',
        'toast.id_not_found': 'Kennung nicht gefunden. Überprüfen Sie den Code.',
        'toast.error_check': 'Fehler bei der Überprüfung.',
        'toast.error_load_messages': 'Fehler beim Laden der Nachrichten',
        'toast.empty_message': 'Leere Nachricht',
        'toast.message_sent': 'Nachricht gesendet',
        'toast.error_send': 'Fehler beim Senden der Nachricht',
        'toast.enter_id': 'Bitte geben Sie eine Kennung ein.',
        'status.en_attente': 'Ausstehend',
        'status.valide_public': 'Genehmigt',
        'status.rejete': 'Abgelehnt',
        'status.bloque': 'Blockiert',
        'status.supprime': 'Gelöscht',
        'status.test_ecrit': 'Schriftlicher Test',
        'status.test_pratique': 'Praktischer Test',
        'sport_label.football': 'Fußball',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Leichtathletik',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volleyball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Schwimmen',
        'sport_label.arts_martiaux': 'Kampfsport',
        'sport_label.cyclisme': 'Radsport',
        'field.full_name': 'Vollständiger Name',
        'field.birth_date': 'Geburtsdatum',
        'field.phone': 'Telefon',
        'field.diploma_title': 'Diplom / Ausbildung',
        'field.parent_name': 'Elternteil / Vormund',
        'field.inscription_code': 'Registrierungscode',
        'field.affiliate_id': 'Partner-ID',
        'field.sport': 'Sport',
        'field.role': 'Rolle',
        'field.created_at': 'Einreichungsdatum',
        'field.email': 'E-Mail',
        'field.login': 'Login-ID'
    },
    it: {
        'loader.message': 'Caricamento...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSO',
        'affiliation': 'AFFILIAZIONE',
        'premier_pas': 'PRIMO PASSO',
        'acteurs': 'DIVENTA UN ATTORE',
        'artiste': 'DIVENTA UN ARTISTA',
        'tournoi_public': 'TORNEO PUBBLICO',
        'esp': 'SCOPRI DI PIÙ',
        'connexion': 'Accedi',
        'inscrire': 'Registrati',
        'suivi.title': 'Monitoraggio candidatura atleta',
        'suivi.subtitle': 'Inserisci l\'identificativo ricevuto dopo l\'iscrizione.',
        'suivi.placeholder': 'Es: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Verifica',
        'suivi.messages.title': 'Messaggi',
        'suivi.messages.send': 'Invia un messaggio',
        'suivi.messages.empty': 'Nessun messaggio al momento.',
        'suivi.support': 'Una domanda?',
        'suivi.support.link': 'Contatta il supporto',
        'suivi.exam.title': 'Risultato dell\'esame',
        'suivi.exam.pending': 'Il tuo esame è in fase di correzione.',
        'suivi.exam.corrected': 'Il tuo esame è stato corretto.',
        'suivi.exam.note': 'Voto finale: {note}/20',
        'suivi.exam.comment': 'Commento: {comment}',
        'suivi.exam.passed': 'Complimenti, hai superato!',
        'suivi.exam.failed': 'Purtroppo non hai raggiunto la media.',
        'suivi.testpratique.title': 'Test pratico',
        'footer_conformite': 'Conformità APDP Benin',
        'footer_reglementation': 'Regolamento FIFA',
        'footer_double_projet': 'Triplo Progetto Sport-Studi-Carriera',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.',
        'toast.id_not_found': 'Identificativo non trovato. Verifica il codice.',
        'toast.error_check': 'Errore durante la verifica.',
        'toast.error_load_messages': 'Errore caricamento messaggi',
        'toast.empty_message': 'Messaggio vuoto',
        'toast.message_sent': 'Messaggio inviato',
        'toast.error_send': 'Errore invio messaggio',
        'toast.enter_id': 'Inserisci un identificativo.',
        'status.en_attente': 'In attesa',
        'status.valide_public': 'Approvato',
        'status.rejete': 'Respinto',
        'status.bloque': 'Bloccato',
        'status.supprime': 'Eliminato',
        'status.test_ecrit': 'Test scritto',
        'status.test_pratique': 'Test pratico',
        'sport_label.football': 'Calcio',
        'sport_label.basketball': 'Pallacanestro',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Atletica',
        'sport_label.handball': 'Pallamano',
        'sport_label.volleyball': 'Pallavolo',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Nuoto',
        'sport_label.arts_martiaux': 'Arti marziali',
        'sport_label.cyclisme': 'Ciclismo',
        'field.full_name': 'Nome completo',
        'field.birth_date': 'Data di nascita',
        'field.phone': 'Telefono',
        'field.diploma_title': 'Diploma / formazione',
        'field.parent_name': 'Genitore / tutore',
        'field.inscription_code': 'Codice di registrazione',
        'field.affiliate_id': 'ID affiliato',
        'field.sport': 'Sport',
        'field.role': 'Ruolo',
        'field.created_at': 'Data di invio',
        'field.email': 'Email',
        'field.login': 'ID di accesso'
    },
    ar: {
        'loader.message': 'جار التحميل...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'الاستكشاف',
        'processus': 'العملية',
        'affiliation': 'الانتماء',
        'premier_pas': 'الخطوة الأولى',
        'acteurs': 'كن فاعلاً',
        'artiste': 'كن فناناً',
        'tournoi_public': 'بطولة عامة',
        'esp': 'اعرف المزيد',
        'connexion': 'تسجيل الدخول',
        'inscrire': 'التسجيل',
        'suivi.title': 'تتبع طلب الرياضي',
        'suivi.subtitle': 'أدخل المعرف الذي تلقيته بعد التسجيل.',
        'suivi.placeholder': 'مثال: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'تحقق',
        'suivi.messages.title': 'الرسائل',
        'suivi.messages.send': 'إرسال رسالة',
        'suivi.messages.empty': 'لا توجد رسائل حتى الآن.',
        'suivi.support': 'هل لديك سؤال؟',
        'suivi.support.link': 'اتصل بالدعم',
        'suivi.exam.title': 'نتيجة الامتحان',
        'suivi.exam.pending': 'امتحانك قيد التصحيح.',
        'suivi.exam.corrected': 'تم تصحيح امتحانك.',
        'suivi.exam.note': 'الدرجة النهائية: {note}/20',
        'suivi.exam.comment': 'تعليق: {comment}',
        'suivi.exam.passed': 'تهانينا، لقد نجحت!',
        'suivi.exam.failed': 'للأسف، لم تصل إلى المعدل.',
        'suivi.testpratique.title': 'اختبار عملي',
        'footer_conformite': 'الامتثال لـ APDP بنين',
        'footer_reglementation': 'لوائح الفيفا',
        'footer_double_projet': 'مشروع الرياضة والدراسة والمهنة الثلاثي',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.',
        'toast.id_not_found': 'المعرف غير موجود. تحقق من الرمز.',
        'toast.error_check': 'خطأ أثناء التحقق.',
        'toast.error_load_messages': 'خطأ في تحميل الرسائل',
        'toast.empty_message': 'رسالة فارغة',
        'toast.message_sent': 'تم إرسال الرسالة',
        'toast.error_send': 'خطأ في إرسال الرسالة',
        'toast.enter_id': 'يرجى إدخال معرف.',
        'status.en_attente': 'قيد الانتظار',
        'status.valide_public': 'موافق عليه',
        'status.rejete': 'مرفوض',
        'status.bloque': 'محظور',
        'status.supprime': 'محذوف',
        'status.test_ecrit': 'اختبار كتابي',
        'status.test_pratique': 'اختبار عملي',
        'sport_label.football': 'كرة القدم',
        'sport_label.basketball': 'كرة السلة',
        'sport_label.tennis': 'تنس',
        'sport_label.athletisme': 'ألعاب القوى',
        'sport_label.handball': 'كرة اليد',
        'sport_label.volleyball': 'الكرة الطائرة',
        'sport_label.rugby': 'رجبي',
        'sport_label.natation': 'سباحة',
        'sport_label.arts_martiaux': 'فنون قتالية',
        'sport_label.cyclisme': 'ركوب الدراجات',
        'field.full_name': 'الاسم الكامل',
        'field.birth_date': 'تاريخ الميلاد',
        'field.phone': 'الهاتف',
        'field.diploma_title': 'الدبلوم / التدريب',
        'field.parent_name': 'الوالد / الوصي',
        'field.inscription_code': 'رمز التسجيل',
        'field.affiliate_id': 'معرف الانتساب',
        'field.sport': 'الرياضة',
        'field.role': 'الدور',
        'field.created_at': 'تاريخ التقديم',
        'field.email': 'البريد الإلكتروني',
        'field.login': 'معرف الدخول'
    },
    zh: {
        'loader.message': '加载中...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': '球探',
        'processus': '流程',
        'affiliation': '隶属',
        'premier_pas': '第一步',
        'acteurs': '成为行动者',
        'artiste': '成为艺术家',
        'tournoi_public': '公开锦标赛',
        'esp': '了解更多',
        'connexion': '登录',
        'inscrire': '注册',
        'suivi.title': '运动员申请跟踪',
        'suivi.subtitle': '输入您注册后收到的标识符。',
        'suivi.placeholder': '例: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': '检查',
        'suivi.messages.title': '消息',
        'suivi.messages.send': '发送消息',
        'suivi.messages.empty': '暂无消息。',
        'suivi.support': '有问题？',
        'suivi.support.link': '联系支持',
        'suivi.exam.title': '考试结果',
        'suivi.exam.pending': '您的考试正在批改中。',
        'suivi.exam.corrected': '您的考试已批改。',
        'suivi.exam.note': '最终成绩: {note}/20',
        'suivi.exam.comment': '评语: {comment}',
        'suivi.exam.passed': '恭喜，您通过了！',
        'suivi.exam.failed': '很遗憾，您未达到平均分。',
        'suivi.testpratique.title': '实践测试',
        'footer_conformite': 'APDP 贝宁合规',
        'footer_reglementation': 'FIFA 规则',
        'footer_double_projet': '体育-学业-职业三重项目',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa。 版权所有。',
        'toast.id_not_found': '未找到标识符。请检查代码。',
        'toast.error_check': '验证时出错。',
        'toast.error_load_messages': '加载消息出错',
        'toast.empty_message': '空消息',
        'toast.message_sent': '消息已发送',
        'toast.error_send': '发送消息出错',
        'toast.enter_id': '请输入标识符。',
        'status.en_attente': '待处理',
        'status.valide_public': '已批准',
        'status.rejete': '已拒绝',
        'status.bloque': '已封锁',
        'status.supprime': '已删除',
        'status.test_ecrit': '笔试',
        'status.test_pratique': '实践测试',
        'sport_label.football': '足球',
        'sport_label.basketball': '篮球',
        'sport_label.tennis': '网球',
        'sport_label.athletisme': '田径',
        'sport_label.handball': '手球',
        'sport_label.volleyball': '排球',
        'sport_label.rugby': '橄榄球',
        'sport_label.natation': '游泳',
        'sport_label.arts_martiaux': '武术',
        'sport_label.cyclisme': '自行车',
        'field.full_name': '全名',
        'field.birth_date': '出生日期',
        'field.phone': '电话',
        'field.diploma_title': '文凭/培训',
        'field.parent_name': '家长/监护人',
        'field.inscription_code': '注册代码',
        'field.affiliate_id': '隶属ID',
        'field.sport': '运动',
        'field.role': '角色',
        'field.created_at': '提交日期',
        'field.email': '电子邮件',
        'field.login': '登录ID'
    },
    ru: {
        'loader.message': 'Загрузка...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'СКАУТИНГ',
        'processus': 'ПРОЦЕСС',
        'affiliation': 'ПАРТНЕРСТВО',
        'premier_pas': 'ПЕРВЫЙ ШАГ',
        'acteurs': 'СТАНЬ ДЕЯТЕЛЕМ',
        'artiste': 'СТАНЬ АРТИСТОМ',
        'tournoi_public': 'ПУБЛИЧНЫЙ ТУРНИР',
        'esp': 'УЗНАТЬ БОЛЬШЕ',
        'connexion': 'Войти',
        'inscrire': 'Регистрация',
        'suivi.title': 'Отслеживание заявки спортсмена',
        'suivi.subtitle': 'Введите идентификатор, полученный после регистрации.',
        'suivi.placeholder': 'Пример: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Проверить',
        'suivi.messages.title': 'Сообщения',
        'suivi.messages.send': 'Отправить сообщение',
        'suivi.messages.empty': 'Пока сообщений нет.',
        'suivi.support': 'Вопрос?',
        'suivi.support.link': 'Связаться с поддержкой',
        'suivi.exam.title': 'Результат экзамена',
        'suivi.exam.pending': 'Ваш экзамен проверяется.',
        'suivi.exam.corrected': 'Ваш экзамен проверен.',
        'suivi.exam.note': 'Итоговая оценка: {note}/20',
        'suivi.exam.comment': 'Комментарий: {comment}',
        'suivi.exam.passed': 'Поздравляем, вы сдали!',
        'suivi.exam.failed': 'К сожалению, вы не набрали проходной балл.',
        'suivi.testpratique.title': 'Практический тест',
        'footer_conformite': 'Соответствие APDP Бенин',
        'footer_reglementation': 'Регламент ФИФА',
        'footer_double_projet': 'Тройной проект Спорт-Учёба-Карьера',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Все права защищены.',
        'toast.id_not_found': 'Идентификатор не найден. Проверьте код.',
        'toast.error_check': 'Ошибка при проверке.',
        'toast.error_load_messages': 'Ошибка загрузки сообщений',
        'toast.empty_message': 'Пустое сообщение',
        'toast.message_sent': 'Сообщение отправлено',
        'toast.error_send': 'Ошибка отправки сообщения',
        'toast.enter_id': 'Введите идентификатор.',
        'status.en_attente': 'В ожидании',
        'status.valide_public': 'Одобрено',
        'status.rejete': 'Отклонено',
        'status.bloque': 'Заблокировано',
        'status.supprime': 'Удалено',
        'status.test_ecrit': 'Письменный тест',
        'status.test_pratique': 'Практический тест',
        'sport_label.football': 'Футбол',
        'sport_label.basketball': 'Баскетбол',
        'sport_label.tennis': 'Теннис',
        'sport_label.athletisme': 'Лёгкая атлетика',
        'sport_label.handball': 'Гандбол',
        'sport_label.volleyball': 'Волейбол',
        'sport_label.rugby': 'Регби',
        'sport_label.natation': 'Плавание',
        'sport_label.arts_martiaux': 'Боевые искусства',
        'sport_label.cyclisme': 'Велоспорт',
        'field.full_name': 'Полное имя',
        'field.birth_date': 'Дата рождения',
        'field.phone': 'Телефон',
        'field.diploma_title': 'Диплом / обучение',
        'field.parent_name': 'Родитель / опекун',
        'field.inscription_code': 'Регистрационный код',
        'field.affiliate_id': 'ID партнёра',
        'field.sport': 'Спорт',
        'field.role': 'Роль',
        'field.created_at': 'Дата подачи',
        'field.email': 'Эл. почта',
        'field.login': 'Логин'
    },
    ja: {
        'loader.message': '読み込み中...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'スカウティング',
        'processus': 'プロセス',
        'affiliation': 'アフィリエイト',
        'premier_pas': '第一歩',
        'acteurs': 'アクターになる',
        'artiste': 'アーティストになる',
        'tournoi_public': '公開トーナメント',
        'esp': 'もっと知る',
        'connexion': 'ログイン',
        'inscrire': '登録',
        'suivi.title': 'アスリート申し込み追跡',
        'suivi.subtitle': '登録後に受け取ったIDを入力してください。',
        'suivi.placeholder': '例: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': '確認',
        'suivi.messages.title': 'メッセージ',
        'suivi.messages.send': 'メッセージを送信',
        'suivi.messages.empty': 'まだメッセージはありません。',
        'suivi.support': '質問がありますか？',
        'suivi.support.link': 'サポートに連絡',
        'suivi.exam.title': '試験結果',
        'suivi.exam.pending': '試験は採点中です。',
        'suivi.exam.corrected': '試験の採点が完了しました。',
        'suivi.exam.note': '最終点数: {note}/20',
        'suivi.exam.comment': 'コメント: {comment}',
        'suivi.exam.passed': 'おめでとうございます、合格しました！',
        'suivi.exam.failed': '残念ながら平均点に達しませんでした。',
        'suivi.testpratique.title': '実技テスト',
        'footer_conformite': 'APDP ベナン準拠',
        'footer_reglementation': 'FIFA 規則',
        'footer_double_projet': 'スポーツ・勉強・職業のトリプルプロジェクト',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. 全著作権所有。',
        'toast.id_not_found': 'IDが見つかりません。コードを確認してください。',
        'toast.error_check': '確認中にエラーが発生しました。',
        'toast.error_load_messages': 'メッセージの読み込みエラー',
        'toast.empty_message': '空のメッセージ',
        'toast.message_sent': 'メッセージが送信されました',
        'toast.error_send': 'メッセージ送信エラー',
        'toast.enter_id': 'IDを入力してください。',
        'status.en_attente': '保留中',
        'status.valide_public': '承認済み',
        'status.rejete': '却下',
        'status.bloque': 'ブロック',
        'status.supprime': '削除済み',
        'status.test_ecrit': '筆記試験',
        'status.test_pratique': '実技テスト',
        'sport_label.football': 'サッカー',
        'sport_label.basketball': 'バスケットボール',
        'sport_label.tennis': 'テニス',
        'sport_label.athletisme': '陸上競技',
        'sport_label.handball': 'ハンドボール',
        'sport_label.volleyball': 'バレーボール',
        'sport_label.rugby': 'ラグビー',
        'sport_label.natation': '水泳',
        'sport_label.arts_martiaux': '武道',
        'sport_label.cyclisme': '自転車競技',
        'field.full_name': '氏名',
        'field.birth_date': '生年月日',
        'field.phone': '電話番号',
        'field.diploma_title': '学位/研修',
        'field.parent_name': '保護者名',
        'field.inscription_code': '登録コード',
        'field.affiliate_id': '所属ID',
        'field.sport': 'スポーツ',
        'field.role': '役割',
        'field.created_at': '提出日',
        'field.email': 'メール',
        'field.login': 'ログインID'
    },
    tr: {
        'loader.message': 'Yükleniyor...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'SÜREÇ',
        'affiliation': 'BAĞLILIK',
        'premier_pas': 'İLK ADIM',
        'acteurs': 'AKTÖR OL',
        'artiste': 'SANATÇI OL',
        'tournoi_public': 'AÇIK TURNUVA',
        'esp': 'DAHA FAZLA',
        'connexion': 'Giriş',
        'inscrire': 'Kaydol',
        'suivi.title': 'Sporcu başvuru takibi',
        'suivi.subtitle': 'Kayıttan sonra aldığınız kimliği girin.',
        'suivi.placeholder': 'Örn: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Kontrol et',
        'suivi.messages.title': 'Mesajlar',
        'suivi.messages.send': 'Mesaj gönder',
        'suivi.messages.empty': 'Henüz mesaj yok.',
        'suivi.support': 'Bir sorunuz mu var?',
        'suivi.support.link': 'Destekle iletişime geç',
        'suivi.exam.title': 'Sınav sonucu',
        'suivi.exam.pending': 'Sınavınız düzeltiliyor.',
        'suivi.exam.corrected': 'Sınavınız düzeltildi.',
        'suivi.exam.note': 'Final notu: {note}/20',
        'suivi.exam.comment': 'Yorum: {comment}',
        'suivi.exam.passed': 'Tebrikler, geçtiniz!',
        'suivi.exam.failed': 'Maalesef ortalamayı tutturamadınız.',
        'suivi.testpratique.title': 'Uygulamalı test',
        'footer_conformite': 'APDP Benin Uyumluluğu',
        'footer_reglementation': 'FIFA Düzenlemeleri',
        'footer_double_projet': 'Üçlü Proje Spor-Eğitim-Kariyer',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.',
        'toast.id_not_found': 'Kimlik bulunamadı. Kodu kontrol edin.',
        'toast.error_check': 'Doğrulama hatası.',
        'toast.error_load_messages': 'Mesaj yükleme hatası',
        'toast.empty_message': 'Boş mesaj',
        'toast.message_sent': 'Mesaj gönderildi',
        'toast.error_send': 'Mesaj gönderme hatası',
        'toast.enter_id': 'Lütfen bir kimlik girin.',
        'status.en_attente': 'Beklemede',
        'status.valide_public': 'Onaylandı',
        'status.rejete': 'Reddedildi',
        'status.bloque': 'Engellendi',
        'status.supprime': 'Silindi',
        'status.test_ecrit': 'Yazılı sınav',
        'status.test_pratique': 'Uygulamalı test',
        'sport_label.football': 'Futbol',
        'sport_label.basketball': 'Basketbol',
        'sport_label.tennis': 'Tenis',
        'sport_label.athletisme': 'Atletizm',
        'sport_label.handball': 'Hentbol',
        'sport_label.volleyball': 'Voleybol',
        'sport_label.rugby': 'Ragbi',
        'sport_label.natation': 'Yüzme',
        'sport_label.arts_martiaux': 'Dövüş sanatları',
        'sport_label.cyclisme': 'Bisiklet',
        'field.full_name': 'Tam ad',
        'field.birth_date': 'Doğum tarihi',
        'field.phone': 'Telefon',
        'field.diploma_title': 'Diploma / eğitim',
        'field.parent_name': 'Ebeveyn / vasi',
        'field.inscription_code': 'Kayıt kodu',
        'field.affiliate_id': 'Bağlılık kimliği',
        'field.sport': 'Spor',
        'field.role': 'Rol',
        'field.created_at': 'Gönderim tarihi',
        'field.email': 'E-posta',
        'field.login': 'Giriş ID'
    },
    ko: {
        'loader.message': '로딩 중...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': '스카우팅',
        'processus': '프로세스',
        'affiliation': '제휴',
        'premier_pas': '첫걸음',
        'acteurs': '액터 되기',
        'artiste': '아티스트 되기',
        'tournoi_public': '공개 토너먼트',
        'esp': '더 알아보기',
        'connexion': '로그인',
        'inscrire': '가입',
        'suivi.title': '선수 지원 추적',
        'suivi.subtitle': '등록 후 받은 식별자를 입력하세요.',
        'suivi.placeholder': '예: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': '확인',
        'suivi.messages.title': '메시지',
        'suivi.messages.send': '메시지 보내기',
        'suivi.messages.empty': '아직 메시지가 없습니다.',
        'suivi.support': '질문이 있나요?',
        'suivi.support.link': '지원팀에 연락',
        'suivi.exam.title': '시험 결과',
        'suivi.exam.pending': '시험이 채점 중입니다.',
        'suivi.exam.corrected': '시험이 채점되었습니다.',
        'suivi.exam.note': '최종 점수: {note}/20',
        'suivi.exam.comment': '코멘트: {comment}',
        'suivi.exam.passed': '축하합니다, 합격하셨습니다!',
        'suivi.exam.failed': '안타깝게도 평균에 도달하지 못했습니다.',
        'suivi.testpratique.title': '실기 테스트',
        'footer_conformite': 'APDP 베냉 준수',
        'footer_reglementation': 'FIFA 규정',
        'footer_double_projet': '스포츠-공부-직업 삼중 프로젝트',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. 모든 권리 보유.',
        'toast.id_not_found': '식별자를 찾을 수 없습니다. 코드를 확인하세요.',
        'toast.error_check': '확인 중 오류.',
        'toast.error_load_messages': '메시지 로딩 오류',
        'toast.empty_message': '빈 메시지',
        'toast.message_sent': '메시지 전송됨',
        'toast.error_send': '메시지 전송 오류',
        'toast.enter_id': '식별자를 입력하세요.',
        'status.en_attente': '대기 중',
        'status.valide_public': '승인됨',
        'status.rejete': '거부됨',
        'status.bloque': '차단됨',
        'status.supprime': '삭제됨',
        'status.test_ecrit': '필기 시험',
        'status.test_pratique': '실기 테스트',
        'sport_label.football': '축구',
        'sport_label.basketball': '농구',
        'sport_label.tennis': '테니스',
        'sport_label.athletisme': '육상',
        'sport_label.handball': '핸드볼',
        'sport_label.volleyball': '배구',
        'sport_label.rugby': '럭비',
        'sport_label.natation': '수영',
        'sport_label.arts_martiaux': '무술',
        'sport_label.cyclisme': '사이클',
        'field.full_name': '전체 이름',
        'field.birth_date': '생년월일',
        'field.phone': '전화번호',
        'field.diploma_title': '학위/훈련',
        'field.parent_name': '부모/보호자',
        'field.inscription_code': '등록 코드',
        'field.affiliate_id': '소속 ID',
        'field.sport': '스포츠',
        'field.role': '역할',
        'field.created_at': '제출일',
        'field.email': '이메일',
        'field.login': '로그인 ID'
    },
    hi: {
        'loader.message': 'लोड हो रहा है...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'स्काउटिंग',
        'processus': 'प्रक्रिया',
        'affiliation': 'संबद्धता',
        'premier_pas': 'पहला कदम',
        'acteurs': 'एक एक्टर बनें',
        'artiste': 'एक कलाकार बनें',
        'tournoi_public': 'सार्वजनिक टूर्नामेंट',
        'esp': 'और जानें',
        'connexion': 'लॉग इन',
        'inscrire': 'साइन अप',
        'suivi.title': 'खिलाड़ी आवेदन ट्रैकिंग',
        'suivi.subtitle': 'पंजीकरण के बाद प्राप्त पहचानकर्ता दर्ज करें।',
        'suivi.placeholder': 'उदा: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'जाँचें',
        'suivi.messages.title': 'संदेश',
        'suivi.messages.send': 'संदेश भेजें',
        'suivi.messages.empty': 'अभी तक कोई संदेश नहीं।',
        'suivi.support': 'एक प्रश्न?',
        'suivi.support.link': 'सपोर्ट से संपर्क करें',
        'suivi.exam.title': 'परीक्षा परिणाम',
        'suivi.exam.pending': 'आपकी परीक्षा की जाँच हो रही है।',
        'suivi.exam.corrected': 'आपकी परीक्षा की जाँच हो गई है।',
        'suivi.exam.note': 'अंतिम अंक: {note}/20',
        'suivi.exam.comment': 'टिप्पणी: {comment}',
        'suivi.exam.passed': 'बधाई हो, आप उत्तीर्ण हुए!',
        'suivi.exam.failed': 'दुर्भाग्यवश, आप औसत तक नहीं पहुँच पाए।',
        'suivi.testpratique.title': 'प्रायोगिक परीक्षण',
        'footer_conformite': 'APDP बेनिन अनुपालन',
        'footer_reglementation': 'फीफा नियम',
        'footer_double_projet': 'खेल-अध्ययन-पेशा ट्रिपल प्रोजेक्ट',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।',
        'toast.id_not_found': 'पहचानकर्ता नहीं मिला। कृपया कोड जाँचें।',
        'toast.error_check': 'सत्यापन के दौरान त्रुटि।',
        'toast.error_load_messages': 'संदेश लोड करने में त्रुटि',
        'toast.empty_message': 'खाली संदेश',
        'toast.message_sent': 'संदेश भेज दिया गया',
        'toast.error_send': 'संदेश भेजने में त्रुटि',
        'toast.enter_id': 'कृपया एक पहचानकर्ता दर्ज करें।',
        'status.en_attente': 'लंबित',
        'status.valide_public': 'स्वीकृत',
        'status.rejete': 'अस्वीकृत',
        'status.bloque': 'अवरुद्ध',
        'status.supprime': 'हटाया गया',
        'status.test_ecrit': 'लिखित परीक्षा',
        'status.test_pratique': 'प्रायोगिक परीक्षण',
        'sport_label.football': 'फ़ुटबॉल',
        'sport_label.basketball': 'बास्केटबॉल',
        'sport_label.tennis': 'टेनिस',
        'sport_label.athletisme': 'एथलेटिक्स',
        'sport_label.handball': 'हैंडबॉल',
        'sport_label.volleyball': 'वॉलीबॉल',
        'sport_label.rugby': 'रग्बी',
        'sport_label.natation': 'तैराकी',
        'sport_label.arts_martiaux': 'मार्शल आर्ट',
        'sport_label.cyclisme': 'साइकिलिंग',
        'field.full_name': 'पूरा नाम',
        'field.birth_date': 'जन्म तिथि',
        'field.phone': 'फ़ोन',
        'field.diploma_title': 'डिप्लोमा / प्रशिक्षण',
        'field.parent_name': 'माता-पिता / अभिभावक',
        'field.inscription_code': 'पंजीकरण कोड',
        'field.affiliate_id': 'संबद्ध आईडी',
        'field.sport': 'खेल',
        'field.role': 'भूमिका',
        'field.created_at': 'जमा करने की तिथि',
        'field.email': 'ईमेल',
        'field.login': 'लॉगिन आईडी'
    },
    nl: {
        'loader.message': 'Laden...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCES',
        'affiliation': 'AFFILIATIE',
        'premier_pas': 'EERSTE STAP',
        'acteurs': 'WORD EEN ACTEUR',
        'artiste': 'WORD EEN ARTIST',
        'tournoi_public': 'OPENBAAR TOERNOOI',
        'esp': 'MEER WETEN',
        'connexion': 'Inloggen',
        'inscrire': 'Inschrijven',
        'suivi.title': 'Volg uw sportaanmelding',
        'suivi.subtitle': 'Voer de identifier in die u na registratie hebt ontvangen.',
        'suivi.placeholder': 'Bijv: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Controleren',
        'suivi.messages.title': 'Berichten',
        'suivi.messages.send': 'Stuur een bericht',
        'suivi.messages.empty': 'Nog geen berichten.',
        'suivi.support': 'Een vraag?',
        'suivi.support.link': 'Contact opnemen met support',
        'suivi.exam.title': 'Examenresultaat',
        'suivi.exam.pending': 'Uw examen wordt nagekeken.',
        'suivi.exam.corrected': 'Uw examen is nagekeken.',
        'suivi.exam.note': 'Eindcijfer: {note}/20',
        'suivi.exam.comment': 'Opmerking: {comment}',
        'suivi.exam.passed': 'Gefeliciteerd, u bent geslaagd!',
        'suivi.exam.failed': 'Helaas hebt u het gemiddelde niet gehaald.',
        'suivi.testpratique.title': 'Praktische test',
        'footer_conformite': 'APDP Benin Naleving',
        'footer_reglementation': 'FIFA Regelgeving',
        'footer_double_projet': 'Triple Project Sport-Studie-Beroep',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.',
        'toast.id_not_found': 'Identifier niet gevonden. Controleer de code.',
        'toast.error_check': 'Fout bij controle.',
        'toast.error_load_messages': 'Fout bij laden berichten',
        'toast.empty_message': 'Leeg bericht',
        'toast.message_sent': 'Bericht verzonden',
        'toast.error_send': 'Fout bij verzenden bericht',
        'toast.enter_id': 'Voer een identifier in.',
        'status.en_attente': 'In afwachting',
        'status.valide_public': 'Goedgekeurd',
        'status.rejete': 'Afgewezen',
        'status.bloque': 'Geblokkeerd',
        'status.supprime': 'Verwijderd',
        'status.test_ecrit': 'Schriftelijke test',
        'status.test_pratique': 'Praktische test',
        'sport_label.football': 'Voetbal',
        'sport_label.basketball': 'Basketbal',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Atletiek',
        'sport_label.handball': 'Handbal',
        'sport_label.volleyball': 'Volleybal',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Zwemmen',
        'sport_label.arts_martiaux': 'Vechtsporten',
        'sport_label.cyclisme': 'Wielrennen',
        'field.full_name': 'Volledige naam',
        'field.birth_date': 'Geboortedatum',
        'field.phone': 'Telefoon',
        'field.diploma_title': 'Diploma / opleiding',
        'field.parent_name': 'Ouder / voogd',
        'field.inscription_code': 'Registratiecode',
        'field.affiliate_id': 'Aangesloten ID',
        'field.sport': 'Sport',
        'field.role': 'Rol',
        'field.created_at': 'Indieningsdatum',
        'field.email': 'E-mail',
        'field.login': 'Login ID'
    },
    pl: {
        'loader.message': 'Ładowanie...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SKAUTING',
        'processus': 'PROCES',
        'affiliation': 'AFILIACJA',
        'premier_pas': 'PIERWSZY KROK',
        'acteurs': 'ZOSTAŃ AKTOREM',
        'artiste': 'ZOSTAŃ ARTYSTĄ',
        'tournoi_public': 'TURNIEJ PUBLICZNY',
        'esp': 'DOWIEDZ SIĘ WIĘCEJ',
        'connexion': 'Zaloguj',
        'inscrire': 'Zarejestruj',
        'suivi.title': 'Śledzenie zgłoszenia sportowca',
        'suivi.subtitle': 'Wprowadź identyfikator otrzymany po rejestracji.',
        'suivi.placeholder': 'Np: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Sprawdź',
        'suivi.messages.title': 'Wiadomości',
        'suivi.messages.send': 'Wyślij wiadomość',
        'suivi.messages.empty': 'Brak wiadomości.',
        'suivi.support': 'Pytanie?',
        'suivi.support.link': 'Skontaktuj się z pomocą',
        'suivi.exam.title': 'Wynik egzaminu',
        'suivi.exam.pending': 'Twój egzamin jest sprawdzany.',
        'suivi.exam.corrected': 'Twój egzamin został sprawdzony.',
        'suivi.exam.note': 'Ocena końcowa: {note}/20',
        'suivi.exam.comment': 'Komentarz: {comment}',
        'suivi.exam.passed': 'Gratulacje, zdałeś!',
        'suivi.exam.failed': 'Niestety nie osiągnąłeś średniej.',
        'suivi.testpratique.title': 'Test praktyczny',
        'footer_conformite': 'Zgodność APDP Benin',
        'footer_reglementation': 'Regulacje FIFA',
        'footer_double_projet': 'Potrójny Projekt Sport-Nauka-Zawód',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.',
        'toast.id_not_found': 'Identyfikator nie znaleziony. Sprawdź kod.',
        'toast.error_check': 'Błąd podczas weryfikacji.',
        'toast.error_load_messages': 'Błąd ładowania wiadomości',
        'toast.empty_message': 'Pusta wiadomość',
        'toast.message_sent': 'Wiadomość wysłana',
        'toast.error_send': 'Błąd wysyłania wiadomości',
        'toast.enter_id': 'Wprowadź identyfikator.',
        'status.en_attente': 'Oczekuje',
        'status.valide_public': 'Zatwierdzony',
        'status.rejete': 'Odrzucony',
        'status.bloque': 'Zablokowany',
        'status.supprime': 'Usunięty',
        'status.test_ecrit': 'Test pisemny',
        'status.test_pratique': 'Test praktyczny',
        'sport_label.football': 'Piłka nożna',
        'sport_label.basketball': 'Koszykówka',
        'sport_label.tennis': 'Tenis',
        'sport_label.athletisme': 'Lekkoatletyka',
        'sport_label.handball': 'Piłka ręczna',
        'sport_label.volleyball': 'Siatkówka',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Pływanie',
        'sport_label.arts_martiaux': 'Sztuki walki',
        'sport_label.cyclisme': 'Kolarstwo',
        'field.full_name': 'Pełne imię i nazwisko',
        'field.birth_date': 'Data urodzenia',
        'field.phone': 'Telefon',
        'field.diploma_title': 'Dyplom / szkolenie',
        'field.parent_name': 'Rodzic / opiekun',
        'field.inscription_code': 'Kod rejestracyjny',
        'field.affiliate_id': 'ID afiliata',
        'field.sport': 'Sport',
        'field.role': 'Rola',
        'field.created_at': 'Data złożenia',
        'field.email': 'E-mail',
        'field.login': 'Login ID'
    },
    vi: {
        'loader.message': 'Đang tải...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'TUYỂN TRẠCH',
        'processus': 'QUY TRÌNH',
        'affiliation': 'LIÊN KẾT',
        'premier_pas': 'BƯỚC ĐẦU TIÊN',
        'acteurs': 'TRỞ THÀNH DIỄN VIÊN',
        'artiste': 'TRỞ THÀNH NGHỆ SĨ',
        'tournoi_public': 'GIẢI ĐẤU CÔNG KHAI',
        'esp': 'TÌM HIỂU THÊM',
        'connexion': 'Đăng nhập',
        'inscrire': 'Đăng ký',
        'suivi.title': 'Theo dõi hồ sơ vận động viên',
        'suivi.subtitle': 'Nhập mã định danh bạn nhận được sau khi đăng ký.',
        'suivi.placeholder': 'Ví dụ: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Kiểm tra',
        'suivi.messages.title': 'Tin nhắn',
        'suivi.messages.send': 'Gửi tin nhắn',
        'suivi.messages.empty': 'Chưa có tin nhắn nào.',
        'suivi.support': 'Một câu hỏi?',
        'suivi.support.link': 'Liên hệ hỗ trợ',
        'suivi.exam.title': 'Kết quả bài kiểm tra',
        'suivi.exam.pending': 'Bài kiểm tra của bạn đang được chấm.',
        'suivi.exam.corrected': 'Bài kiểm tra của bạn đã được chấm.',
        'suivi.exam.note': 'Điểm cuối cùng: {note}/20',
        'suivi.exam.comment': 'Nhận xét: {comment}',
        'suivi.exam.passed': 'Chúc mừng, bạn đã vượt qua!',
        'suivi.exam.failed': 'Rất tiếc, bạn chưa đạt mức trung bình.',
        'suivi.testpratique.title': 'Bài kiểm tra thực hành',
        'footer_conformite': 'Tuân thủ APDP Benin',
        'footer_reglementation': 'Quy định FIFA',
        'footer_double_projet': 'Dự án ba mục Thể thao-Học tập-Nghề nghiệp',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.',
        'toast.id_not_found': 'Không tìm thấy mã định danh. Vui lòng kiểm tra lại mã.',
        'toast.error_check': 'Lỗi trong quá trình xác minh.',
        'toast.error_load_messages': 'Lỗi tải tin nhắn',
        'toast.empty_message': 'Tin nhắn trống',
        'toast.message_sent': 'Đã gửi tin nhắn',
        'toast.error_send': 'Lỗi gửi tin nhắn',
        'toast.enter_id': 'Vui lòng nhập mã định danh.',
        'status.en_attente': 'Đang chờ',
        'status.valide_public': 'Đã duyệt',
        'status.rejete': 'Bị từ chối',
        'status.bloque': 'Bị khóa',
        'status.supprime': 'Đã xóa',
        'status.test_ecrit': 'Bài kiểm tra viết',
        'status.test_pratique': 'Bài kiểm tra thực hành',
        'sport_label.football': 'Bóng đá',
        'sport_label.basketball': 'Bóng rổ',
        'sport_label.tennis': 'Quần vợt',
        'sport_label.athletisme': 'Điền kinh',
        'sport_label.handball': 'Bóng ném',
        'sport_label.volleyball': 'Bóng chuyền',
        'sport_label.rugby': 'Bóng bầu dục',
        'sport_label.natation': 'Bơi lội',
        'sport_label.arts_martiaux': 'Võ thuật',
        'sport_label.cyclisme': 'Đua xe đạp',
        'field.full_name': 'Họ và tên',
        'field.birth_date': 'Ngày sinh',
        'field.phone': 'Điện thoại',
        'field.diploma_title': 'Bằng cấp / đào tạo',
        'field.parent_name': 'Cha mẹ / người giám hộ',
        'field.inscription_code': 'Mã đăng ký',
        'field.affiliate_id': 'ID liên kết',
        'field.sport': 'Môn thể thao',
        'field.role': 'Vai trò',
        'field.created_at': 'Ngày nộp',
        'field.email': 'Email',
        'field.login': 'ID đăng nhập'
    }
};
// ========== FIN : TRADUCTIONS ==========
// ========== DÉBUT : FONCTIONS DE TRADUCTION ==========
let currentLang = localStorage.getItem('hubiLang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) {
                el.placeholder = t(key);
            } else {
                el.innerHTML = t(key);
            }
        }
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
        if (currentInscription) {
            displayInscription(currentInscription);
            loadMessages(currentInscription.pp_id);
            loadExamResult(currentInscription.pp_id);
            loadTestPratique(currentInscription.pp_id);
        }
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

let currentInscription = null;
let replyQuill = null;

// ========== DÉBUT : UTILITAIRES ==========
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div>
        <div class="toast-content">${escapeHtml(message)}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : GESTION DU STATUT ==========
function updateStatusBadge(status) {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;
    const statusMap = {
        'en_attente': 'en_attente',
        'valide_public': 'valide_public',
        'rejete': 'rejete',
        'bloque': 'bloque',
        'supprime': 'supprime',
        'test_ecrit': 'test_ecrit',
        'test_pratique': 'test_pratique'
    };
    const statusClass = statusMap[status] || 'en_attente';
    const statusText = t(`status.${status}`) || t('status.en_attente');
    badge.textContent = statusText;
    badge.className = `status-badge ${statusClass}`;
}
// ========== FIN : GESTION DU STATUT ==========

// ========== DÉBUT : CHARGEMENT INSCRIPTION ==========
async function loadInscription(ppId) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_premierpas')
            .select('*')
            .eq('pp_id', ppId)
            .single();
        if (error || !data) {
            showToast(t('toast.id_not_found'), 'error');
            document.getElementById('resultCard').style.display = 'none';
            return null;
        }
        currentInscription = data;
        displayInscription(data);
        await loadMessages(data.pp_id);
        await loadExamResult(data.pp_id);
        await loadTestPratique(data.pp_id);
        document.getElementById('resultCard').style.display = 'block';
        return data;
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_check'), 'error');
        document.getElementById('resultCard').style.display = 'none';
        return null;
    } finally {
        hideLoader();
    }
}

function displayInscription(ins) {
    updateStatusBadge(ins.status);
    document.getElementById('applicantName').textContent = ins.full_name || 'Candidat';

    const infoGrid = document.getElementById('infoGrid');
    infoGrid.innerHTML = `
        <div class="info-item"><strong>${t('field.full_name')}</strong><span>${escapeHtml(ins.full_name)}</span></div>
        <div class="info-item"><strong>${t('field.birth_date')}</strong><span>${formatDate(ins.birth_date)}</span></div>
        <div class="info-item"><strong>${t('field.phone')}</strong><span>${escapeHtml(ins.phone)}</span></div>
        <div class="info-item"><strong>${t('field.diploma_title')}</strong><span>${escapeHtml(ins.diploma_title)}</span></div>
        <div class="info-item"><strong>${t('field.sport')}</strong><span>${t(`sport_label.${ins.sport}`) || ins.sport}</span></div>
        <div class="info-item"><strong>${t('field.role')}</strong><span>${escapeHtml(ins.role)}</span></div>
        <div class="info-item"><strong>${t('field.created_at')}</strong><span>${formatDate(ins.created_at)}</span></div>
    `;
    if (ins.parent_name) {
        infoGrid.innerHTML += `<div class="info-item"><strong>${t('field.parent_name')}</strong><span>${escapeHtml(ins.parent_name)}</span></div>`;
    }
    if (ins.inscription_code) {
        infoGrid.innerHTML += `<div class="info-item"><strong>${t('field.inscription_code')}</strong><span>${escapeHtml(ins.inscription_code)}</span></div>`;
    }
    if (ins.affiliate_id) {
        infoGrid.innerHTML += `<div class="info-item"><strong>${t('field.affiliate_id')}</strong><span>${escapeHtml(ins.affiliate_id)}</span></div>`;
    }

    // Afficher l'identifiant de connexion si approuvé
    const adminNotesDiv = document.getElementById('adminNotes');
    if (ins.status === 'valide_public' && ins.login) {
        adminNotesDiv.innerHTML = `<i class="fas fa-info-circle"></i> Votre compte est activé. Identifiant de connexion : <strong>${escapeHtml(ins.login)}</strong>`;
        adminNotesDiv.style.display = 'block';
    } else if (ins.status === 'rejete' && ins.role_data?.motif_rejet) {
        adminNotesDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Motif du rejet : ${escapeHtml(ins.role_data.motif_rejet)}`;
        adminNotesDiv.style.display = 'block';
    } else {
        adminNotesDiv.style.display = 'none';
    }

    // Données sportives
    const sportDataDiv = document.getElementById('sportData');
    if (ins.sport_data && Object.keys(ins.sport_data).length > 0) {
        let html = `<h3>Informations sportives</h3><div class="sport-data-grid">`;
        for (const [key, value] of Object.entries(ins.sport_data)) {
            if (value) {
                html += `<div class="info-item"><strong>${formatSportKey(key)}</strong><span>${escapeHtml(String(value))}</span></div>`;
            }
        }
        html += `</div>`;
        sportDataDiv.innerHTML = html;
        sportDataDiv.style.display = 'block';
    } else {
        sportDataDiv.style.display = 'none';
    }
}

function formatSportKey(key) {
    const labels = {
        poste: 'Poste', piedDominant: 'Pied dominant', taille: 'Taille (cm)', poids: 'Poids (kg)',
        statistiques: 'Statistiques', club: 'Club', anneesPratique: 'Années pratique',
        niveau: 'Niveau', mainDominante: 'Main dominante', envergure: 'Envergure (cm)',
        detente: 'Détente (cm)', typeJeu: 'Type jeu', coupDroit: 'Coup droit', revers: 'Revers',
        classement: 'Classement', surfacePref: 'Surface préférée', meilleurResultat: 'Meilleur résultat',
        vitesseService: 'Vitesse service (km/h)', discipline: 'Discipline', meilleurePerf: 'Meilleure performance',
        record100: 'Record 100m', record10k: 'Record 10km', entrainementsSemaine: 'Entraînements/sem',
        blessures: 'Blessures', vitesseTir: 'Vitesse tir (km/h)', detenteAttaque: 'Détente attaque (cm)',
        detenteContre: 'Détente contre (cm)', vitesse40: 'Vitesse 40m (s)', plaquage: 'Plaquage',
        matchsSaison: 'Matchs saison', nage: 'Nage', meilleur50: '50m', meilleur100: '100m',
        meilleur200: '200m', chrono50: 'Chrono 50m', grade: 'Grade', poidsCompetition: 'Poids compétition (kg)',
        palmares: 'Palmarès', specialite: 'Spécialité', preparationPhysique: 'Préparation physique',
        ftp: 'FTP (W)', fcm: 'FC max', kmSemaine: 'Km/semaine'
    };
    return labels[key] || key;
}
// ========== FIN : CHARGEMENT INSCRIPTION ==========

// ========== DÉBUT : EXAMEN ET TEST PRATIQUE ==========
async function loadExamResult(ppId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_examens')
            .select('note_finale, commentaire_admin, statut')
            .eq('pp_id', ppId)
            .order('date_soumission', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !data) {
            document.getElementById('examSection').style.display = 'none';
            return;
        }
        const examSection = document.getElementById('examSection');
        const examResultDiv = document.getElementById('examResult');
        if (data.statut === 'corrige' && data.note_finale !== null) {
            const note = data.note_finale;
            const comment = data.commentaire_admin || '';
            const passed = note >= 10;
            let html = `<p>${t('suivi.exam.corrected')}</p>`;
            html += `<p class="note">${t('suivi.exam.note', { note })}</p>`;
            if (comment) html += `<p>${t('suivi.exam.comment', { comment: escapeHtml(comment) })}</p>`;
            html += `<p class="${passed ? 'reussi' : 'echoue'}">${passed ? t('suivi.exam.passed') : t('suivi.exam.failed')}</p>`;
            examResultDiv.innerHTML = html;
            examSection.style.display = 'block';
        } else {
            examResultDiv.innerHTML = `<p>${t('suivi.exam.pending')}</p>`;
            examSection.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('examSection').style.display = 'none';
    }
}

async function loadTestPratique(ppId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_analyses_videos')
            .select('statut, commentaire_admin, date_soumission, date_traitement')
            .eq('pp_id', ppId)
            .order('date_soumission', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !data) {
            document.getElementById('testPratiqueSection').style.display = 'none';
            return;
        }
        const section = document.getElementById('testPratiqueSection');
        const container = document.getElementById('testPratiqueContent');
        let statusText = '';
        let statusClass = '';
        switch (data.statut) {
            case 'en_attente': statusText = 'En attente de correction'; statusClass = 'warning'; break;
            case 'valide': statusText = 'Validé'; statusClass = 'success'; break;
            case 'rejete': statusText = 'Rejeté'; statusClass = 'danger'; break;
            default: statusText = data.statut; statusClass = 'info';
        }
        let html = `<p><strong>Statut :</strong> <span class="badge ${statusClass}">${statusText}</span></p>`;
        html += `<p><strong>Soumis le :</strong> ${new Date(data.date_soumission).toLocaleString()}</p>`;
        if (data.date_traitement) {
            html += `<p><strong>Traité le :</strong> ${new Date(data.date_traitement).toLocaleString()}</p>`;
        }
        if (data.commentaire_admin) {
            html += `<p><strong>Commentaire :</strong> ${escapeHtml(data.commentaire_admin)}</p>`;
        }
        container.innerHTML = html;
        section.style.display = 'block';
    } catch (err) {
        console.error(err);
        document.getElementById('testPratiqueSection').style.display = 'none';
    }
}
// ========== FIN : EXAMEN ET TEST PRATIQUE ==========

// ========== DÉBUT : MESSAGERIE ==========
async function loadMessages(ppId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_suivi_messages')
            .select('*')
            .eq('pp_id', ppId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        renderMessages(data || []);
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_messages'), 'error');
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    if (messages.length === 0) {
        container.innerHTML = `<p class="empty-message">${t('suivi.messages.empty')}</p>`;
        return;
    }
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender}">
            <div class="message-bubble">
                <div>${msg.content}</div>
                <div class="message-time">${new Date(msg.created_at).toLocaleString('fr-FR')}</div>
            </div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

async function sendReply() {
    if (!currentInscription || !replyQuill) return;
    const content = replyQuill.root.innerHTML.trim();
    if (!content || content === '<p><br></p>') {
        showToast(t('toast.empty_message'), 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_suivi_messages')
            .insert([{
                pp_id: currentInscription.pp_id,
                sender: 'candidate',
                content: content
            }]);
        if (error) throw error;
        replyQuill.root.innerHTML = '';
        await loadMessages(currentInscription.pp_id);
        showToast(t('toast.message_sent'), 'success');
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_send'), 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : MESSAGERIE ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    const input = document.getElementById('trackingId');
    const checkBtn = document.getElementById('checkBtn');
    if (idFromUrl) {
        input.value = idFromUrl;
        loadInscription(idFromUrl);
    }
    checkBtn.addEventListener('click', () => {
        const id = input.value.trim();
        if (id) loadInscription(id);
        else showToast(t('toast.enter_id'), 'warning');
    });
    // Initialisation de Quill
    const observer = new MutationObserver(() => {
        const replyEditor = document.getElementById('replyEditor');
        if (replyEditor && !replyQuill && document.getElementById('resultCard').style.display === 'block') {
            replyQuill = new Quill(replyEditor, {
                theme: 'snow',
                placeholder: 'Écrivez votre message...',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['link', 'blockquote', 'code-block'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['clean']
                    ]
                }
            });
            observer.disconnect();
        }
    });
    observer.observe(document.getElementById('resultCard'), { childList: true, subtree: true });
    document.getElementById('sendReplyBtn').addEventListener('click', sendReply);

    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('open');
            }
        });
    }
});
// ========== FIN : INITIALISATION ==========
// ========== FIN DE SUIVI.JS ==========