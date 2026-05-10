// ========== PREMIER-PAS.JS ==========
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
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
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
        'premierpas.header.title': 'First Step',
        'premierpas.header.highlight': 'to the Future',
        'premierpas.header.subtitle': 'Official membership to the HubISoccer program. We certify your talent only if your academic or professional background is proven.',
        'form.title': 'Application File (Athletes)',
        'form.who': 'Who are you?',
        'form.definition': 'Please define yourself *',
        'form.myself': 'Myself',
        'form.parent': 'My parent',
        'form.guardian': 'My guardian',
        'form.relative': 'My relative',
        'form.fullname': 'Full name *',
        'form.birthdate': 'Date of birth *',
        'form.email': 'Email *',
        'form.phone': 'Phone *',
        'form.parentname': 'Parent/guardian name (if minor)',
        'form.inscription_code': 'Registration code (optional)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Are you affiliated?',
        'form.yes': 'Yes',
        'form.no': 'No',
        'form.affiliate_id': 'Affiliate ID',
        'form.academic': 'Academic & Professional Path',
        'form.diploma_title': 'Current diploma / training *',
        'form.diploma_file': 'Certificate / Diploma *',
        'form.idcard_file': 'ID Document *',
        'form.upload_click': 'Click to upload (PDF, JPG, PNG)',
        'form.art_section': 'Artistic discipline',
        'form.sport_section': 'Sport practiced',
        'form.choose_sport': '-- Choose a sport --',
        'form.certify': 'I certify the accuracy of the documents provided. Any fraud will lead to permanent exclusion.',
        'form.submit': 'Submit my First Step',
        'footer_conformite': 'APDP Benin Compliance',
        'footer_reglementation': 'FIFA Regulations',
        'footer_double_projet': 'Triple Sport-Studies-Career Project',
        'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'modal.title': 'Registration sent!',
        'modal.message': 'Your file is pending verification.',
        'modal.id_label': 'Your unique ID:',
        'modal.copy': 'Copy',
        'modal.note': 'Keep this ID safe. You will receive your login credentials after validation by our team.',
        'modal.link': 'Access follow-up',
        'modal.close': 'Close',
        'toast.file_selected': 'File selected: {filename}',
        'toast.upload_error': 'Upload error: {error}',
        'toast.fill_required': 'Please fill in all required fields.',
        'toast.files_required': 'Please upload the two required files.',
        'toast.submit_error': 'Registration error: {error}',
        'toast.copy_error': 'Copy error',
        'toast.copy_success': 'Copied!'
    },
    yo: {
        'loader.message': 'Nlọ...',
        'hub_market': 'HUBISOCCER ỌJA',
        'hub_community': 'Agbegbe Hub',
        'scouting': 'Wiwa',
        'processus': 'Ilana',
        'affiliation': 'Ifọwọsi',
        'premier_pas': 'IGBESE AKỌKỌ',
        'acteurs': 'Di Oṣere',
        'artiste': 'Di Oṣere',
        'tournoi_public': 'Idije Gbogbo eniyan',
        'esp': 'Kọ Ẹkọ Siwaju',
        'connexion': 'Wo ile',
        'inscrire': 'Forukọsilẹ',
        'premierpas.header.title': 'Igbese Akọkọ',
        'premierpas.header.highlight': 'si Ọjọ iwaju',
        'premierpas.header.subtitle': 'Iforukọsilẹ osise si eto HubISoccer. A jẹrisi talenti rẹ nikan ti ọna ile-iwe tabi ọjọgbọn rẹ ba jẹri.',
        'form.title': 'Faili Ohun elo (Elere idaraya)',
        'form.who': 'Ta ni ẹ?',
        'form.definition': 'Jọwọ ṣalaye ararẹ *',
        'form.myself': 'Ara mi',
        'form.parent': 'Obi mi',
        'form.guardian': 'Olutọju mi',
        'form.relative': 'Ibaṣepọ mi',
        'form.fullname': 'Orukọ kikun *',
        'form.birthdate': 'Ọjọ ibi *',
        'form.email': 'Imeeli *',
        'form.phone': 'Foonu *',
        'form.parentname': 'Orukọ obi / olutọju (ti o ba jẹ ọmọde)',
        'form.inscription_code': 'Koodu iforukọsilẹ (aṣayan)',
        'form.affiliation_section': 'Ifọwọsi',
        'form.is_affiliated': 'Ṣe o ni ifọwọsi?',
        'form.yes': 'Bẹẹni',
        'form.no': 'Rara',
        'form.affiliate_id': 'ID ti o ni ifọwọsi',
        'form.academic': 'Ipilẹ eto-ẹkọ & Ọjọgbọn',
        'form.diploma_title': 'Diploma lọwọlọwọ / ikẹkọ *',
        'form.diploma_file': 'Ijẹrisi / Diploma *',
        'form.idcard_file': 'Kaadi ID *',
        'form.upload_click': 'Tẹ lati gbejade (PDF, JPG, PNG)',
        'form.art_section': 'Iṣẹ ọna ọnà',
        'form.sport_section': 'Idaraya ti nṣe',
        'form.choose_sport': '-- Yan idaraya --',
        'form.certify': 'Mo jẹri pe awọn iwe ti a pese jẹ otitọ. Eyikeyi jibiti yoo ja si ifasilẹ patapata.',
        'form.submit': 'Fi Igbese Akọkọ mi silẹ',
        'footer_conformite': 'Ifaramọ APDP Benin',
        'footer_reglementation': 'Awọn ilana FIFA',
        'footer_double_projet': 'Ise agbese Idaraya-Ẹkọ-Meji',
        'copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.',
        'modal.title': 'Iforukọsilẹ ti firanṣẹ!',
        'modal.message': 'Faili rẹ wa ni isunmọ ijẹrisi.',
        'modal.id_label': 'ID alailẹgbẹ rẹ:',
        'modal.copy': 'Daakọ',
        'modal.note': 'Tọju ID yii lailewu. Iwọ yoo gba awọn iwe-ẹri iwọle rẹ lẹhin ijẹrisi nipasẹ ẹgbẹ wa.',
        'modal.link': 'Wọle si atẹle',
        'modal.close': 'Tiipa',
        'toast.file_selected': 'Fáìlì ti yan: {filename}',
        'toast.upload_error': 'Aṣiṣe ikojọpọ: {error}',
        'toast.fill_required': 'Jọwọ fọwọsi gbogbo awọn aaye ti o nilo.',
        'toast.files_required': 'Jọwọ gbe awọn faili meji ti o nilo.',
        'toast.submit_error': 'Aṣiṣe iforukọsilẹ: {error}',
        'toast.copy_error': 'Aṣiṣe didaakọ',
        'toast.copy_success': 'Ti daakọ!'
    },
    fon: {
        'loader.message': 'Tɛn ɖo...',
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
        'connexion': 'Byɔ xɔntin',
        'inscrire': 'Nyikɔ wlan',
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
    },
    mina: {
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
        'connexion': 'Gé ɖé émè',
        'inscrire': 'Ŋkɔ́ wlá',
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
    },
    lin: {
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
        'connexion': 'Kota',
        'inscrire': 'Komikomisa',
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
    },
    wol: {
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
        'connexion': 'Dugg',
        'inscrire': 'Seetal',
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
    },
    diou: {
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
        'connexion': 'Dɔ́n',
        'inscrire': 'Sɛ̀bɛ̀n',
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
    },
    ha: {
        'loader.message': 'Loading...',
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
        'connexion': 'Shiga',
        'inscrire': 'Yi rajista',
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
    },
    sw: {
        'loader.message': 'Inapakia...',
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
        'connexion': 'Ingia',
        'inscrire': 'Jiandikishe',
        'premierpas.header.title': 'Premier Pas',
        'premierpas.header.highlight': 'vers le Futur',
        'premierpas.header.subtitle': 'L\'adhésion officielle au programme HubISoccer. Nous certifions ton talent uniquement si ton parcours scolaire ou professionnel est prouvé.',
        'form.title': 'Dossier d\'Adhésion (Sportifs)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.email': 'Email *',
        'form.phone': 'Téléphone *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Métier',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation / Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.art_section': 'Discipline artistique',
        'form.sport_section': 'Sport pratiqué',
        'form.choose_sport': '-- Choisissez un sport --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon Premier Pas',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.note': 'Conservez précieusement cet identifiant. Vous recevrez vos identifiants de connexion après validation par notre équipe.',
        'modal.link': 'Accéder au suivi',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
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
        'premierpas.header.title': 'Primer Paso',
        'premierpas.header.highlight': 'hacia el Futuro',
        'premierpas.header.subtitle': 'Adhesión oficial al programa HubISoccer. Certificamos tu talento solo si tu trayectoria escolar o profesional está probada.',
        'form.title': 'Archivo de solicitud (Deportistas)',
        'form.who': '¿Quién eres?',
        'form.definition': 'Por favor, defínete *',
        'form.myself': 'Yo mismo',
        'form.parent': 'Mi padre/madre',
        'form.guardian': 'Mi tutor',
        'form.relative': 'Mi pariente',
        'form.fullname': 'Nombre completo *',
        'form.birthdate': 'Fecha de nacimiento *',
        'form.email': 'Correo electrónico *',
        'form.phone': 'Teléfono *',
        'form.parentname': 'Nombre del padre/tutor (si es menor)',
        'form.inscription_code': 'Código de registro (opcional)',
        'form.affiliation_section': 'Afiliación',
        'form.is_affiliated': '¿Está afiliado?',
        'form.yes': 'Sí',
        'form.no': 'No',
        'form.affiliate_id': 'ID de afiliado',
        'form.academic': 'Formación académica y profesional',
        'form.diploma_title': 'Diploma / formación en curso *',
        'form.diploma_file': 'Certificado / Diploma *',
        'form.idcard_file': 'Documento de identidad *',
        'form.upload_click': 'Haga clic para cargar (PDF, JPG, PNG)',
        'form.art_section': 'Disciplina artística',
        'form.sport_section': 'Deporte practicado',
        'form.choose_sport': '-- Elija un deporte --',
        'form.certify': 'Certifico la exactitud de los documentos proporcionados.',
        'form.submit': 'Enviar mi Primer Paso',
        'footer_conformite': 'Conformidad APDP Benín',
        'footer_reglementation': 'Reglamento FIFA',
        'footer_double_projet': 'Triple Proyecto Deporte-Estudios-Carrera',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.',
        'modal.title': '¡Inscripción enviada!',
        'modal.message': 'Su expediente está pendiente de verificación.',
        'modal.id_label': 'Su identificador único:',
        'modal.copy': 'Copiar',
        'modal.note': 'Guarde este identificador. Recibirá sus credenciales de acceso después de la validación por nuestro equipo.',
        'modal.link': 'Acceder al seguimiento',
        'modal.close': 'Cerrar',
        'toast.file_selected': 'Archivo seleccionado: {filename}',
        'toast.upload_error': 'Error de carga: {error}',
        'toast.fill_required': 'Por favor, rellene todos los campos obligatorios.',
        'toast.files_required': 'Por favor, cargue los dos archivos requeridos.',
        'toast.submit_error': 'Error de inscripción: {error}',
        'toast.copy_error': 'Error de copia',
        'toast.copy_success': '¡Copiado!'
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
        'premierpas.header.title': 'Primeiro Passo',
        'premierpas.header.highlight': 'para o Futuro',
        'premierpas.header.subtitle': 'Adesão oficial ao programa HubISoccer. Certificamos o seu talento apenas se o seu percurso escolar ou profissional for comprovado.',
        'form.title': 'Ficheiro de candidatura (Desportistas)',
        'form.who': 'Quem é você?',
        'form.definition': 'Por favor, defina-se *',
        'form.myself': 'Eu mesmo',
        'form.parent': 'Meu pai/mãe',
        'form.guardian': 'Meu tutor',
        'form.relative': 'Meu parente',
        'form.fullname': 'Nome completo *',
        'form.birthdate': 'Data de nascimento *',
        'form.email': 'E-mail *',
        'form.phone': 'Telefone *',
        'form.parentname': 'Nome do pai/tutor (se menor)',
        'form.inscription_code': 'Código de inscrição (opcional)',
        'form.affiliation_section': 'Afiliação',
        'form.is_affiliated': 'Você é afiliado?',
        'form.yes': 'Sim',
        'form.no': 'Não',
        'form.affiliate_id': 'ID de afiliado',
        'form.academic': 'Formação académica e profissional',
        'form.diploma_title': 'Diploma / formação em curso *',
        'form.diploma_file': 'Certificado / Diploma *',
        'form.idcard_file': 'Documento de identificação *',
        'form.upload_click': 'Clique para enviar (PDF, JPG, PNG)',
        'form.art_section': 'Disciplina artística',
        'form.sport_section': 'Desporto praticado',
        'form.choose_sport': '-- Escolha um desporto --',
        'form.certify': 'Certifico a exatidão dos documentos fornecidos.',
        'form.submit': 'Enviar o meu Primeiro Passo',
        'footer_conformite': 'Conformidade APDP Benim',
        'footer_reglementation': 'Regulamento FIFA',
        'footer_double_projet': 'Triplo Projeto Esporte-Estudos-Carreira',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.',
        'modal.title': 'Inscrição enviada!',
        'modal.message': 'O seu processo está pendente de verificação.',
        'modal.id_label': 'O seu identificador único:',
        'modal.copy': 'Copiar',
        'modal.note': 'Guarde este identificador. Receberá as suas credenciais de acesso após validação pela nossa equipa.',
        'modal.link': 'Aceder ao seguimento',
        'modal.close': 'Fechar',
        'toast.file_selected': 'Ficheiro selecionado: {filename}',
        'toast.upload_error': 'Erro de upload: {error}',
        'toast.fill_required': 'Por favor, preencha todos os campos obrigatórios.',
        'toast.files_required': 'Por favor, carregue os dois ficheiros necessários.',
        'toast.submit_error': 'Erro de inscrição: {error}',
        'toast.copy_error': 'Erro de cópia',
        'toast.copy_success': 'Copiado!'
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
        'premierpas.header.title': 'Erster Schritt',
        'premierpas.header.highlight': 'in die Zukunft',
        'premierpas.header.subtitle': 'Offizielle Mitgliedschaft im HubISoccer-Programm. Wir zertifizieren dein Talent nur, wenn dein schulischer oder beruflicher Werdegang nachgewiesen ist.',
        'form.title': 'Bewerbungsunterlagen (Sportler)',
        'form.who': 'Wer bist du?',
        'form.definition': 'Bitte definiere dich *',
        'form.myself': 'Ich selbst',
        'form.parent': 'Mein Elternteil',
        'form.guardian': 'Mein Vormund',
        'form.relative': 'Mein Verwandter',
        'form.fullname': 'Vollständiger Name *',
        'form.birthdate': 'Geburtsdatum *',
        'form.email': 'E-Mail *',
        'form.phone': 'Telefon *',
        'form.parentname': 'Name des Elternteils/Vormunds (falls minderjährig)',
        'form.inscription_code': 'Registrierungscode (optional)',
        'form.affiliation_section': 'Zugehörigkeit',
        'form.is_affiliated': 'Bist du angeschlossen?',
        'form.yes': 'Ja',
        'form.no': 'Nein',
        'form.affiliate_id': 'Partner-ID',
        'form.academic': 'Akademischer & beruflicher Werdegang',
        'form.diploma_title': 'Aktuelles Diplom / Ausbildung *',
        'form.diploma_file': 'Zeugnis / Diplom *',
        'form.idcard_file': 'Personalausweis *',
        'form.upload_click': 'Klicke zum Hochladen (PDF, JPG, PNG)',
        'form.art_section': 'Künstlerische Disziplin',
        'form.sport_section': 'Ausgeübter Sport',
        'form.choose_sport': '-- Wähle einen Sport --',
        'form.certify': 'Ich bestätige die Richtigkeit der eingereichten Unterlagen.',
        'form.submit': 'Meinen Ersten Schritt einreichen',
        'footer_conformite': 'APDP Benin Konformität',
        'footer_reglementation': 'FIFA-Regulierung',
        'footer_double_projet': 'Dreifachprojekt Sport-Studium-Beruf',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.',
        'modal.title': 'Anmeldung gesendet!',
        'modal.message': 'Deine Unterlagen werden geprüft.',
        'modal.id_label': 'Deine eindeutige Kennung:',
        'modal.copy': 'Kopieren',
        'modal.note': 'Bewahre diese Kennung auf. Du erhältst deine Zugangsdaten nach der Validierung durch unser Team.',
        'modal.link': 'Zur Nachverfolgung',
        'modal.close': 'Schließen',
        'toast.file_selected': 'Datei ausgewählt: {filename}',
        'toast.upload_error': 'Upload-Fehler: {error}',
        'toast.fill_required': 'Bitte fülle alle Pflichtfelder aus.',
        'toast.files_required': 'Bitte lade die zwei erforderlichen Dateien hoch.',
        'toast.submit_error': 'Anmeldefehler: {error}',
        'toast.copy_error': 'Kopierfehler',
        'toast.copy_success': 'Kopiert!'
    },
    it: {
        'loader.message': 'Caricamento...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSO',
        'affiliation': 'AFFILIAZIONE',
        'premier_pas': 'PRIMO PASSO',
        'acteurs': 'DIVENTA ATTORE',
        'artiste': 'DIVENTA ARTISTA',
        'tournoi_public': 'TORNEO PUBBLICO',
        'esp': 'SCOPRI DI PIÙ',
        'connexion': 'Accedi',
        'inscrire': 'Registrati',
        'premierpas.header.title': 'Primo Passo',
        'premierpas.header.highlight': 'verso il Futuro',
        'premierpas.header.subtitle': 'Adesione ufficiale al programma HubISoccer. Certifichiamo il tuo talento solo se il tuo percorso scolastico o professionale è comprovato.',
        'form.title': 'Domanda di adesione (Sportivi)',
        'form.who': 'Chi sei?',
        'form.definition': 'Per favore, definisciti *',
        'form.myself': 'Me stesso',
        'form.parent': 'Il mio genitore',
        'form.guardian': 'Il mio tutore',
        'form.relative': 'Il mio parente',
        'form.fullname': 'Nome completo *',
        'form.birthdate': 'Data di nascita *',
        'form.email': 'Email *',
        'form.phone': 'Telefono *',
        'form.parentname': 'Nome del genitore/tutore (se minorenne)',
        'form.inscription_code': 'Codice di registrazione (opzionale)',
        'form.affiliation_section': 'Affiliazione',
        'form.is_affiliated': 'Sei affiliato?',
        'form.yes': 'Sì',
        'form.no': 'No',
        'form.affiliate_id': 'ID affiliato',
        'form.academic': 'Percorso accademico e professionale',
        'form.diploma_title': 'Diploma / formazione in corso *',
        'form.diploma_file': 'Certificato / Diploma *',
        'form.idcard_file': 'Documento d\'identità *',
        'form.upload_click': 'Clicca per caricare (PDF, JPG, PNG)',
        'form.art_section': 'Disciplina artistica',
        'form.sport_section': 'Sport praticato',
        'form.choose_sport': '-- Scegli uno sport --',
        'form.certify': 'Certifico l\'esattezza dei documenti forniti.',
        'form.submit': 'Invia il mio Primo Passo',
        'footer_conformite': 'Conformità APDP Benin',
        'footer_reglementation': 'Regolamento FIFA',
        'footer_double_projet': 'Triplo Progetto Sport-Studi-Carriera',
        'copyright': '© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.',
        'modal.title': 'Iscrizione inviata!',
        'modal.message': 'Il tuo dossier è in attesa di verifica.',
        'modal.id_label': 'Il tuo identificativo univoco:',
        'modal.copy': 'Copia',
        'modal.note': 'Conserva questo identificativo. Riceverai le tue credenziali di accesso dopo la convalida da parte del nostro team.',
        'modal.link': 'Accedi al monitoraggio',
        'modal.close': 'Chiudi',
        'toast.file_selected': 'File selezionato: {filename}',
        'toast.upload_error': 'Errore di upload: {error}',
        'toast.fill_required': 'Si prega di compilare tutti i campi obbligatori.',
        'toast.files_required': 'Si prega di caricare i due file richiesti.',
        'toast.submit_error': 'Errore di registrazione: {error}',
        'toast.copy_error': 'Errore di copia',
        'toast.copy_success': 'Copiato!'
    },
    ar: {
        'loader.message': 'جار التحميل...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'الخطوة الأولى',
        'acteurs': 'كن فاعلا',
        'artiste': 'كن فنانا',
        'tournoi_public': 'دورة عامة',
        'esp': 'اعرف أكثر',
        'connexion': 'تسجيل الدخول',
        'inscrire': 'التسجيل',
        'premierpas.header.title': 'الخطوة الأولى',
        'premierpas.header.highlight': 'نحو المستقبل',
        'premierpas.header.subtitle': 'الانضمام الرسمي لبرنامج HubISoccer. نصدق على موهبتك فقط إذا تم إثبات مسارك الدراسي أو المهني.',
        'form.title': 'ملف الطلب (رياضيون)',
        'form.who': 'من أنت؟',
        'form.definition': 'يرجى تعريف نفسك *',
        'form.myself': 'أنا شخصيًا',
        'form.parent': 'والدي',
        'form.guardian': 'ولي أمري',
        'form.relative': 'قريبي',
        'form.fullname': 'الاسم الكامل *',
        'form.birthdate': 'تاريخ الميلاد *',
        'form.email': 'البريد الإلكتروني *',
        'form.phone': 'الهاتف *',
        'form.parentname': 'اسم الوالد / الولي (إذا كان قاصرًا)',
        'form.inscription_code': 'رمز التسجيل (اختياري)',
        'form.affiliation_section': 'الانتساب',
        'form.is_affiliated': 'هل أنت منتسب؟',
        'form.yes': 'نعم',
        'form.no': 'لا',
        'form.affiliate_id': 'معرف الانتساب',
        'form.academic': 'المسار الأكاديمي والمهني',
        'form.diploma_title': 'الدبلوم / التدريب الحالي *',
        'form.diploma_file': 'الشهادة / الدبلوم *',
        'form.idcard_file': 'بطاقة الهوية *',
        'form.upload_click': 'انقر للتحميل (PDF، JPG، PNG)',
        'form.art_section': 'التخصص الفني',
        'form.sport_section': 'الرياضة الممارسة',
        'form.choose_sport': '-- اختر رياضة --',
        'form.certify': 'أشهد على صحة الوثائق المقدمة.',
        'form.submit': 'تقديم خطوتي الأولى',
        'footer_conformite': 'الامتثال لـ APDP بنين',
        'footer_reglementation': 'لوائح الفيفا',
        'footer_double_projet': 'مشروع الرياضة والدراسة والمهنة الثلاثي',
        'copyright': '© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.',
        'modal.title': 'تم إرسال التسجيل!',
        'modal.message': 'ملفك قيد التحقق.',
        'modal.id_label': 'معرفك الفريد:',
        'modal.copy': 'نسخ',
        'modal.note': 'احتفظ بهذا المعرف. ستتلقى بيانات الاعتماد الخاصة بك بعد التحقق من قبل فريقنا.',
        'modal.link': 'الوصول إلى التتبع',
        'modal.close': 'إغلاق',
        'toast.file_selected': 'الملف المحدد: {filename}',
        'toast.upload_error': 'خطأ في التحميل: {error}',
        'toast.fill_required': 'يرجى ملء جميع الحقول الإلزامية.',
        'toast.files_required': 'يرجى تحميل الملفين المطلوبين.',
        'toast.submit_error': 'خطأ في التسجيل: {error}',
        'toast.copy_error': 'خطأ في النسخ',
        'toast.copy_success': 'تم النسخ!'
    },
    zh: {
        'loader.message': '加载中...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': '第一步',
        'acteurs': '成为行动者',
        'artiste': '成为艺术家',
        'tournoi_public': '公开锦标赛',
        'esp': '了解更多',
        'connexion': '连接',
        'inscrire': '登记',
        'premierpas.header.title': '第一步',
        'premierpas.header.highlight': '走向未来',
        'premierpas.header.subtitle': '正式加入HubISoccer计划。只有在您的学校或职业经历得到证明的情况下，我们才会认证您的才能。',
        'form.title': '申请文件 (运动员)',
        'form.who': '您是谁？',
        'form.definition': '请定义自己 *',
        'form.myself': '我自己',
        'form.parent': '我的父母',
        'form.guardian': '我的监护人',
        'form.relative': '我的亲戚',
        'form.fullname': '全名 *',
        'form.birthdate': '出生日期 *',
        'form.email': '电子邮件 *',
        'form.phone': '电话 *',
        'form.parentname': '父母/监护人姓名（若未成年）',
        'form.inscription_code': '注册代码（可选）',
        'form.affiliation_section': '归属',
        'form.is_affiliated': '您有归属吗？',
        'form.yes': '是',
        'form.no': '否',
        'form.affiliate_id': '归属ID',
        'form.academic': '学术与职业道路',
        'form.diploma_title': '当前文凭/培训 *',
        'form.diploma_file': '证书/文凭 *',
        'form.idcard_file': '身份证 *',
        'form.upload_click': '点击上传（PDF、JPG、PNG）',
        'form.art_section': '艺术学科',
        'form.sport_section': '从事的运动',
        'form.choose_sport': '-- 选择一项运动 --',
        'form.certify': '我证明所提供文件的准确性。',
        'form.submit': '提交我的第一步',
        'footer_conformite': 'APDP贝宁合规',
        'footer_reglementation': 'FIFA规则',
        'footer_double_projet': '体育-学习-职业三重项目',
        'copyright': '© 2026 HubISoccer - Ozawa。版权所有。',
        'modal.title': '注册已发送！',
        'modal.message': '您的文件正在审核中。',
        'modal.id_label': '您的唯一标识符：',
        'modal.copy': '复制',
        'modal.note': '保留此标识符。您将在我们团队验证后收到登录凭据。',
        'modal.link': '访问跟进',
        'modal.close': '关闭',
        'toast.file_selected': '选择的文件：{filename}',
        'toast.upload_error': '上传错误：{error}',
        'toast.fill_required': '请填写所有必填字段。',
        'toast.files_required': '请上传两个必需的文件。',
        'toast.submit_error': '注册错误：{error}',
        'toast.copy_error': '复制错误',
        'toast.copy_success': '已复制！'
    },
    ru: {
        'loader.message': 'Загрузка...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'ПЕРВЫЙ ШАГ',
        'acteurs': 'СТАНЬ АКТЕРОМ',
        'artiste': 'СТАНЬ АРТИСТОМ',
        'tournoi_public': 'ОТКРЫТЫЙ ТУРНИР',
        'esp': 'УЗНАТЬ БОЛЬШЕ',
        'connexion': 'Вход',
        'inscrire': 'Регистрация',
        'premierpas.header.title': 'Первый Шаг',
        'premierpas.header.highlight': 'в Будущее',
        'premierpas.header.subtitle': 'Официальное вступление в программу HubISoccer. Мы подтверждаем твой талант только при доказательстве учебного или профессионального пути.',
        'form.title': 'Заявочный файл (Спортсмены)',
        'form.who': 'Кто ты?',
        'form.definition': 'Пожалуйста, определись *',
        'form.myself': 'Я сам(а)',
        'form.parent': 'Мой родитель',
        'form.guardian': 'Мой опекун',
        'form.relative': 'Мой родственник',
        'form.fullname': 'Полное имя *',
        'form.birthdate': 'Дата рождения *',
        'form.email': 'Электронная почта *',
        'form.phone': 'Телефон *',
        'form.parentname': 'Имя родителя/опекуна (если несовершеннолетний)',
        'form.inscription_code': 'Регистрационный код (необязательно)',
        'form.affiliation_section': 'Принадлежность',
        'form.is_affiliated': 'Ты аффилирован?',
        'form.yes': 'Да',
        'form.no': 'Нет',
        'form.affiliate_id': 'ID аффилированного лица',
        'form.academic': 'Академический и профессиональный путь',
        'form.diploma_title': 'Текущий диплом / обучение *',
        'form.diploma_file': 'Свидетельство / Диплом *',
        'form.idcard_file': 'Удостоверение личности *',
        'form.upload_click': 'Нажми, чтобы загрузить (PDF, JPG, PNG)',
        'form.art_section': 'Творческая дисциплина',
        'form.sport_section': 'Занимаемыйся спорт',
        'form.choose_sport': '-- Выбери спорт --',
        'form.certify': 'Я подтверждаю достоверность предоставленных документов.',
        'form.submit': 'Отправить мой Первый Шаг',
        'footer_conformite': 'Соответствие APDP Бенин',
        'footer_reglementation': 'Регламент ФИФА',
        'footer_double_projet': 'Тройной проект Спорт-Учёба-Карьера',
        'copyright': '© 2026 HubISoccer - Ozawa. Все права защищены.',
        'modal.title': 'Регистрация отправлена!',
        'modal.message': 'Твоё досье находится на проверке.',
        'modal.id_label': 'Твой уникальный идентификатор:',
        'modal.copy': 'Копировать',
        'modal.note': 'Сохрани этот идентификатор. Ты получишь свои учётные данные после проверки нашей командой.',
        'modal.link': 'Перейти к отслеживанию',
        'modal.close': 'Закрыть',
        'toast.file_selected': 'Выбранный файл: {filename}',
        'toast.upload_error': 'Ошибка загрузки: {error}',
        'toast.fill_required': 'Пожалуйста, заполни все обязательные поля.',
        'toast.files_required': 'Пожалуйста, загрузи два необходимых файла.',
        'toast.submit_error': 'Ошибка регистрации: {error}',
        'toast.copy_error': 'Ошибка копирования',
        'toast.copy_success': 'Скопировано!'
    },
    ja: {
        'loader.message': '読み込み中...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': '最初の一歩',
        'acteurs': 'アクターになる',
        'artiste': 'アーティストになる',
        'tournoi_public': '公開トーナメント',
        'esp': 'もっと知る',
        'connexion': '接続',
        'inscrire': '登録',
        'premierpas.header.title': '最初の一歩',
        'premierpas.header.highlight': '未来へ',
        'premierpas.header.subtitle': 'HubISoccerプログラムへの正式な参加。あなたの学業または職業経歴が証明された場合にのみ、あなたの才能を認定します。',
        'form.title': '申請ファイル (アスリート)',
        'form.who': 'あなたは？',
        'form.definition': '自分を定義してください *',
        'form.myself': '私自身',
        'form.parent': '私の親',
        'form.guardian': '私の保護者',
        'form.relative': '私の親戚',
        'form.fullname': '氏名 *',
        'form.birthdate': '生年月日 *',
        'form.email': 'メールアドレス *',
        'form.phone': '電話番号 *',
        'form.parentname': '保護者名（未成年の場合）',
        'form.inscription_code': '登録コード（任意）',
        'form.affiliation_section': '所属',
        'form.is_affiliated': '所属していますか？',
        'form.yes': 'はい',
        'form.no': 'いいえ',
        'form.affiliate_id': '所属ID',
        'form.academic': '学歴・職歴',
        'form.diploma_title': '現在の学位/研修 *',
        'form.diploma_file': '証明書/学位 *',
        'form.idcard_file': '身分証明書 *',
        'form.upload_click': 'クリックしてアップロード（PDF、JPG、PNG）',
        'form.art_section': '芸術分野',
        'form.sport_section': '行っているスポーツ',
        'form.choose_sport': '-- スポーツを選択 --',
        'form.certify': '提出書類の正確性を証明します。',
        'form.submit': '私の最初の一歩を送信',
        'footer_conformite': 'APDPベニン準拠',
        'footer_reglementation': 'FIFA規則',
        'footer_double_projet': 'スポーツ・勉強・職業のトリプルプロジェクト',
        'copyright': '© 2026 HubISoccer - Ozawa. 無断複写・転載を禁じます。',
        'modal.title': '登録が送信されました！',
        'modal.message': 'あなたのファイルは確認待ちです。',
        'modal.id_label': '一意の識別子:',
        'modal.copy': 'コピー',
        'modal.note': 'この識別子を保管してください。当チームによる確認後、ログイン情報が送られます。',
        'modal.link': 'フォローアップにアクセス',
        'modal.close': '閉じる',
        'toast.file_selected': '選択されたファイル: {filename}',
        'toast.upload_error': 'アップロードエラー: {error}',
        'toast.fill_required': '必須項目をすべて入力してください。',
        'toast.files_required': '必要な2つのファイルをアップロードしてください。',
        'toast.submit_error': '登録エラー: {error}',
        'toast.copy_error': 'コピーエラー',
        'toast.copy_success': 'コピーしました！'
    },
    tr: {
        'loader.message': 'Yükleniyor...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'İLK ADIM',
        'acteurs': 'AKTÖR OL',
        'artiste': 'SANATÇI OL',
        'tournoi_public': 'AÇIK TURNUVA',
        'esp': 'DAHA FAZLA BİLGİ',
        'connexion': 'Giriş',
        'inscrire': 'Kaydol',
        'premierpas.header.title': 'İlk Adım',
        'premierpas.header.highlight': 'Geleceğe',
        'premierpas.header.subtitle': 'HubISoccer programına resmi katılım. Yeteneğini yalnızca okul veya mesleki geçmişin kanıtlandığında onaylıyoruz.',
        'form.title': 'Başvuru Dosyası (Sporcular)',
        'form.who': 'Kimsin?',
        'form.definition': 'Lütfen kendini tanımla *',
        'form.myself': 'Kendim',
        'form.parent': 'Ebeveynim',
        'form.guardian': 'Vasim',
        'form.relative': 'Akrabam',
        'form.fullname': 'Tam ad *',
        'form.birthdate': 'Doğum tarihi *',
        'form.email': 'E-posta *',
        'form.phone': 'Telefon *',
        'form.parentname': 'Ebeveyn/vasinin adı (reşit değilse)',
        'form.inscription_code': 'Kayıt kodu (isteğe bağlı)',
        'form.affiliation_section': 'Bağlılık',
        'form.is_affiliated': 'Bağlı mısın?',
        'form.yes': 'Evet',
        'form.no': 'Hayır',
        'form.affiliate_id': 'Bağlılık kimliği',
        'form.academic': 'Akademik ve Mesleki Geçmiş',
        'form.diploma_title': 'Mevcut diploma / eğitim *',
        'form.diploma_file': 'Sertifika / Diploma *',
        'form.idcard_file': 'Kimlik kartı *',
        'form.upload_click': 'Yüklemek için tıkla (PDF, JPG, PNG)',
        'form.art_section': 'Sanatsal disiplin',
        'form.sport_section': 'Yapılan spor',
        'form.choose_sport': '-- Bir spor seç --',
        'form.certify': 'Sağlanan belgelerin doğruluğunu onaylıyorum.',
        'form.submit': 'İlk Adımımı Gönder',
        'footer_conformite': 'APDP Benin Uyumluluğu',
        'footer_reglementation': 'FIFA Düzenlemeleri',
        'footer_double_projet': 'Spor-Eğitim-Meslek Üçlü Projesi',
        'copyright': '© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.',
        'modal.title': 'Kayıt gönderildi!',
        'modal.message': 'Dosyan doğrulama bekliyor.',
        'modal.id_label': 'Benzersiz kimliğin:',
        'modal.copy': 'Kopyala',
        'modal.note': 'Bu kimliği sakla. Ekibimiz tarafından doğrulandıktan sonra giriş bilgilerini alacaksın.',
        'modal.link': 'Takibe eriş',
        'modal.close': 'Kapat',
        'toast.file_selected': 'Seçilen dosya: {filename}',
        'toast.upload_error': 'Yükleme hatası: {error}',
        'toast.fill_required': 'Lütfen tüm zorunlu alanları doldur.',
        'toast.files_required': 'Lütfen iki gerekli dosyayı yükle.',
        'toast.submit_error': 'Kayıt hatası: {error}',
        'toast.copy_error': 'Kopyalama hatası',
        'toast.copy_success': 'Kopyalandı!'
    },
    ko: {
        'loader.message': '로딩 중...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': '첫걸음',
        'acteurs': '액터 되기',
        'artiste': '아티스트 되기',
        'tournoi_public': '공개 토너먼트',
        'esp': '더 알아보기',
        'connexion': '연결',
        'inscrire': '등록',
        'premierpas.header.title': '첫걸음',
        'premierpas.header.highlight': '미래로',
        'premierpas.header.subtitle': 'HubISoccer 프로그램 공식 가입. 학업 또는 직업 경력이 입증된 경우에만 재능을 인증합니다.',
        'form.title': '신청 파일 (운동선수)',
        'form.who': '누구세요?',
        'form.definition': '자신을 정의해 주세요 *',
        'form.myself': '본인',
        'form.parent': '부모님',
        'form.guardian': '보호자',
        'form.relative': '친척',
        'form.fullname': '전체 이름 *',
        'form.birthdate': '생년월일 *',
        'form.email': '이메일 *',
        'form.phone': '전화번호 *',
        'form.parentname': '부모/보호자 이름 (미성년자인 경우)',
        'form.inscription_code': '등록 코드 (선택 사항)',
        'form.affiliation_section': '소속',
        'form.is_affiliated': '소속되어 있습니까?',
        'form.yes': '예',
        'form.no': '아니요',
        'form.affiliate_id': '소속 ID',
        'form.academic': '학력 및 직업 경력',
        'form.diploma_title': '현재 학위/훈련 *',
        'form.diploma_file': '증명서/학위 *',
        'form.idcard_file': '신분증 *',
        'form.upload_click': '업로드하려면 클릭하세요 (PDF, JPG, PNG)',
        'form.art_section': '예술 분야',
        'form.sport_section': '하는 스포츠',
        'form.choose_sport': '-- 스포츠 선택 --',
        'form.certify': '제출된 서류의 정확성을 증명합니다.',
        'form.submit': '내 첫걸음 제출',
        'footer_conformite': 'APDP 베냉 준수',
        'footer_reglementation': 'FIFA 규정',
        'footer_double_projet': '스포츠-공부-직업 삼중 프로젝트',
        'copyright': '© 2026 HubISoccer - Ozawa. 모든 권리 보유.',
        'modal.title': '등록이 전송되었습니다!',
        'modal.message': '귀하의 파일이 확인 대기 중입니다.',
        'modal.id_label': '고유 식별자:',
        'modal.copy': '복사',
        'modal.note': '이 식별자를 보관하세요. 팀 검증 후 로그인 자격 증명을 받게 됩니다.',
        'modal.link': '추적에 액세스',
        'modal.close': '닫기',
        'toast.file_selected': '선택된 파일: {filename}',
        'toast.upload_error': '업로드 오류: {error}',
        'toast.fill_required': '모든 필수 필드를 입력하십시오.',
        'toast.files_required': '필요한 두 파일을 업로드하십시오.',
        'toast.submit_error': '등록 오류: {error}',
        'toast.copy_error': '복사 오류',
        'toast.copy_success': '복사되었습니다!'
    },
    hi: {
        'loader.message': 'लोड हो रहा है...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'पहला कदम',
        'acteurs': 'एक्टर बनें',
        'artiste': 'कलाकार बनें',
        'tournoi_public': 'खुला टूर्नामेंट',
        'esp': 'और जानें',
        'connexion': 'कनेक्शन',
        'inscrire': 'साइन अप करें',
        'premierpas.header.title': 'पहला कदम',
        'premierpas.header.highlight': 'भविष्य की ओर',
        'premierpas.header.subtitle': 'HubISoccer कार्यक्रम में आधिकारिक सदस्यता। हम आपकी प्रतिभा को केवल तभी प्रमाणित करते हैं जब आपका स्कूल या पेशेवर पृष्ठभूमि सिद्ध हो।',
        'form.title': 'आवेदन फ़ाइल (खिलाड़ी)',
        'form.who': 'आप कौन हैं?',
        'form.definition': 'कृपया अपने आप को परिभाषित करें *',
        'form.myself': 'स्वयं',
        'form.parent': 'मेरे माता-पिता',
        'form.guardian': 'मेरे अभिभावक',
        'form.relative': 'मेरे रिश्तेदार',
        'form.fullname': 'पूरा नाम *',
        'form.birthdate': 'जन्म तिथि *',
        'form.email': 'ईमेल *',
        'form.phone': 'फ़ोन *',
        'form.parentname': 'माता-पिता/अभिभावक का नाम (यदि नाबालिग हैं)',
        'form.inscription_code': 'पंजीकरण कोड (वैकल्पिक)',
        'form.affiliation_section': 'संबद्धता',
        'form.is_affiliated': 'क्या आप संबद्ध हैं?',
        'form.yes': 'हाँ',
        'form.no': 'नहीं',
        'form.affiliate_id': 'संबद्ध आईडी',
        'form.academic': 'शैक्षणिक और व्यावसायिक पथ',
        'form.diploma_title': 'वर्तमान डिप्लोमा / प्रशिक्षण *',
        'form.diploma_file': 'प्रमाणपत्र / डिप्लोमा *',
        'form.idcard_file': 'पहचान पत्र *',
        'form.upload_click': 'अपलोड करने के लिए क्लिक करें (PDF, JPG, PNG)',
        'form.art_section': 'कला अनुशासन',
        'form.sport_section': 'अभ्यास किया जाने वाला खेल',
        'form.choose_sport': '-- एक खेल चुनें --',
        'form.certify': 'प्रदान किए गए दस्तावेजों की सटीकता प्रमाणित करता हूं।',
        'form.submit': 'मेरा पहला कदम जमा करें',
        'footer_conformite': 'APDP बेनिन अनुपालन',
        'footer_reglementation': 'फीफा नियम',
        'footer_double_projet': 'खेल-अध्ययन-पेशा ट्रिपल प्रोजेक्ट',
        'copyright': '© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।',
        'modal.title': 'पंजीकरण भेजा गया!',
        'modal.message': 'आपकी फ़ाइल सत्यापन के लिए लंबित है।',
        'modal.id_label': 'आपका अद्वितीय पहचानकर्ता:',
        'modal.copy': 'कॉपी',
        'modal.note': 'इस पहचानकर्ता को सुरक्षित रखें। हमारी टीम द्वारा सत्यापन के बाद आपको लॉगिन क्रेडेंशियल प्राप्त होंगे।',
        'modal.link': 'फॉलो-अप तक पहुंचें',
        'modal.close': 'बंद करें',
        'toast.file_selected': 'चयनित फ़ाइल: {filename}',
        'toast.upload_error': 'अपलोड त्रुटि: {error}',
        'toast.fill_required': 'कृपया सभी आवश्यक फ़ील्ड भरें।',
        'toast.files_required': 'कृपया दो आवश्यक फ़ाइलें अपलोड करें।',
        'toast.submit_error': 'पंजीकरण त्रुटि: {error}',
        'toast.copy_error': 'कॉपी त्रुटि',
        'toast.copy_success': 'कॉपी किया गया!'
    },
    nl: {
        'loader.message': 'Laden...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCES',
        'affiliation': 'AFFILIATIE',
        'premier_pas': 'EERSTE STAP',
        'acteurs': 'WORD ACTEUR',
        'artiste': 'WORD ARTIST',
        'tournoi_public': 'OPENBAAR TOERNOOI',
        'esp': 'MEER WETEN',
        'connexion': 'Inloggen',
        'inscrire': 'Inschrijven',
        'premierpas.header.title': 'Eerste Stap',
        'premierpas.header.highlight': 'naar de Toekomst',
        'premierpas.header.subtitle': 'Officieel lidmaatschap van het HubISoccer-programma. Wij certificeren je talent alleen als je school- of beroepsachtergrond is bewezen.',
        'form.title': 'Aanvraagformulier (Sporters)',
        'form.who': 'Wie ben je?',
        'form.definition': 'Definieer jezelf *',
        'form.myself': 'Mijzelf',
        'form.parent': 'Mijn ouder',
        'form.guardian': 'Mijn voogd',
        'form.relative': 'Mijn familielid',
        'form.fullname': 'Volledige naam *',
        'form.birthdate': 'Geboortedatum *',
        'form.email': 'E-mail *',
        'form.phone': 'Telefoon *',
        'form.parentname': 'Naam ouder/voogd (indien minderjarig)',
        'form.inscription_code': 'Registratiecode (optioneel)',
        'form.affiliation_section': 'Verbondenheid',
        'form.is_affiliated': 'Ben je aangesloten?',
        'form.yes': 'Ja',
        'form.no': 'Nee',
        'form.affiliate_id': 'Aangesloten ID',
        'form.academic': 'Academische & Beroepsachtergrond',
        'form.diploma_title': 'Huidig diploma / opleiding *',
        'form.diploma_file': 'Certificaat / Diploma *',
        'form.idcard_file': 'Identiteitskaart *',
        'form.upload_click': 'Klik om te uploaden (PDF, JPG, PNG)',
        'form.art_section': 'Artistieke discipline',
        'form.sport_section': 'Beoefende sport',
        'form.choose_sport': '-- Kies een sport --',
        'form.certify': 'Ik verklaar de juistheid van de verstrekte documenten.',
        'form.submit': 'Mijn Eerste Stap indienen',
        'footer_conformite': 'APDP Benin Naleving',
        'footer_reglementation': 'FIFA Regelgeving',
        'footer_double_projet': 'Triple Project Sport-Studie-Beroep',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.',
        'modal.title': 'Inschrijving verzonden!',
        'modal.message': 'Je dossier wordt gecontroleerd.',
        'modal.id_label': 'Je unieke identificatie:',
        'modal.copy': 'Kopiëren',
        'modal.note': 'Bewaar deze identificatie. Je ontvangt je inloggegevens na validatie door ons team.',
        'modal.link': 'Toegang tot opvolging',
        'modal.close': 'Sluiten',
        'toast.file_selected': 'Geselecteerd bestand: {filename}',
        'toast.upload_error': 'Uploadfout: {error}',
        'toast.fill_required': 'Vul alle verplichte velden in.',
        'toast.files_required': 'Upload de twee vereiste bestanden.',
        'toast.submit_error': 'Inschrijvingsfout: {error}',
        'toast.copy_error': 'Kopieerfout',
        'toast.copy_success': 'Gekopieerd!'
    },
    pl: {
        'loader.message': 'Ładowanie...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCES',
        'affiliation': 'AFILIACJA',
        'premier_pas': 'PIERWSZY KROK',
        'acteurs': 'ZOSTAŃ AKTOREM',
        'artiste': 'ZOSTAŃ ARTYSTĄ',
        'tournoi_public': 'TURNIEJ PUBLICZNY',
        'esp': 'DOWIEDZ SIĘ WIĘCEJ',
        'connexion': 'Logowanie',
        'inscrire': 'Zarejestruj się',
        'premierpas.header.title': 'Pierwszy Krok',
        'premierpas.header.highlight': 'ku Przyszłości',
        'premierpas.header.subtitle': 'Oficjalne członkostwo w programie HubISoccer. Certyfikujemy Twój talent tylko wtedy, gdy udowodnisz swoje wykształcenie lub doświadczenie zawodowe.',
        'form.title': 'Wniosek (Sportowcy)',
        'form.who': 'Kim jesteś?',
        'form.definition': 'Proszę się określić *',
        'form.myself': 'Ja sam',
        'form.parent': 'Mój rodzic',
        'form.guardian': 'Mój opiekun',
        'form.relative': 'Mój krewny',
        'form.fullname': 'Pełne imię i nazwisko *',
        'form.birthdate': 'Data urodzenia *',
        'form.email': 'E-mail *',
        'form.phone': 'Telefon *',
        'form.parentname': 'Nazwisko rodzica/opiekuna (jeśli niepełnoletni)',
        'form.inscription_code': 'Kod rejestracyjny (opcjonalnie)',
        'form.affiliation_section': 'Przynależność',
        'form.is_affiliated': 'Czy jesteś powiązany?',
        'form.yes': 'Tak',
        'form.no': 'Nie',
        'form.affiliate_id': 'ID powiązanego',
        'form.academic': 'Wykształcenie i ścieżka zawodowa',
        'form.diploma_title': 'Aktualny dyplom / szkolenie *',
        'form.diploma_file': 'Certyfikat / Dyplom *',
        'form.idcard_file': 'Dowód osobisty *',
        'form.upload_click': 'Kliknij, aby przesłać (PDF, JPG, PNG)',
        'form.art_section': 'Dyscyplina artystyczna',
        'form.sport_section': 'Uprawiany sport',
        'form.choose_sport': '-- Wybierz sport --',
        'form.certify': 'Poświadczam dokładność dostarczonych dokumentów.',
        'form.submit': 'Wyślij mój Pierwszy Krok',
        'footer_conformite': 'Zgodność APDP Benin',
        'footer_reglementation': 'Regulacje FIFA',
        'footer_double_projet': 'Potrójny Projekt Sport-Nauka-Zawód',
        'copyright': '© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.',
        'modal.title': 'Zgłoszenie wysłane!',
        'modal.message': 'Twoja dokumentacja oczekuje na weryfikację.',
        'modal.id_label': 'Twój unikalny identyfikator:',
        'modal.copy': 'Kopiuj',
        'modal.note': 'Zachowaj ten identyfikator. Otrzymasz dane logowania po weryfikacji przez nasz zespół.',
        'modal.link': 'Dostęp do śledzenia',
        'modal.close': 'Zamknij',
        'toast.file_selected': 'Wybrany plik: {filename}',
        'toast.upload_error': 'Błąd przesyłania: {error}',
        'toast.fill_required': 'Proszę wypełnić wszystkie wymagane pola.',
        'toast.files_required': 'Proszę przesłać dwa wymagane pliki.',
        'toast.submit_error': 'Błąd rejestracji: {error}',
        'toast.copy_error': 'Błąd kopiowania',
        'toast.copy_success': 'Skopiowano!'
    },
    vi: {
        'loader.message': 'Đang tải...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'BƯỚC ĐẦU TIÊN',
        'acteurs': 'TRỞ THÀNH DIỄN VIÊN',
        'artiste': 'TRỞ THÀNH NGHỆ SĨ',
        'tournoi_public': 'GIẢI ĐẤU CÔNG KHAI',
        'esp': 'TÌM HIỂU THÊM',
        'connexion': 'Đăng nhập',
        'inscrire': 'Đăng ký',
        'premierpas.header.title': 'Bước Đầu Tiên',
        'premierpas.header.highlight': 'hướng tới Tương lai',
        'premierpas.header.subtitle': 'Thành viên chính thức của chương trình HubISoccer. Chúng tôi chỉ chứng nhận tài năng của bạn khi quá trình học tập hoặc nghề nghiệp của bạn được chứng minh.',
        'form.title': 'Hồ sơ đăng ký (Vận động viên)',
        'form.who': 'Bạn là ai?',
        'form.definition': 'Vui lòng xác định bản thân *',
        'form.myself': 'Bản thân tôi',
        'form.parent': 'Cha mẹ tôi',
        'form.guardian': 'Người giám hộ của tôi',
        'form.relative': 'Người thân của tôi',
        'form.fullname': 'Họ và tên *',
        'form.birthdate': 'Ngày sinh *',
        'form.email': 'Email *',
        'form.phone': 'Điện thoại *',
        'form.parentname': 'Tên cha mẹ/người giám hộ (nếu chưa thành niên)',
        'form.inscription_code': 'Mã đăng ký (tùy chọn)',
        'form.affiliation_section': 'Liên kết',
        'form.is_affiliated': 'Bạn có liên kết không?',
        'form.yes': 'Có',
        'form.no': 'Không',
        'form.affiliate_id': 'ID liên kết',
        'form.academic': 'Học vấn và Nghề nghiệp',
        'form.diploma_title': 'Bằng cấp / đào tạo hiện tại *',
        'form.diploma_file': 'Chứng chỉ / Bằng cấp *',
        'form.idcard_file': 'Thẻ căn cước *',
        'form.upload_click': 'Nhấp để tải lên (PDF, JPG, PNG)',
        'form.art_section': 'Lĩnh vực nghệ thuật',
        'form.sport_section': 'Môn thể thao đang chơi',
        'form.choose_sport': '-- Chọn một môn thể thao --',
        'form.certify': 'Tôi xác nhận tính chính xác của các tài liệu được cung cấp.',
        'form.submit': 'Gửi Bước Đầu Tiên của tôi',
        'footer_conformite': 'Tuân thủ APDP Benin',
        'footer_reglementation': 'Quy định FIFA',
        'footer_double_projet': 'Dự án ba mục Thể thao-Học tập-Nghề nghiệp',
        'copyright': '© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.',
        'modal.title': 'Đăng ký đã được gửi!',
        'modal.message': 'Hồ sơ của bạn đang chờ xác minh.',
        'modal.id_label': 'Mã định danh duy nhất của bạn:',
        'modal.copy': 'Sao chép',
        'modal.note': 'Giữ mã này. Bạn sẽ nhận được thông tin đăng nhập sau khi đội ngũ của chúng tôi xác nhận.',
        'modal.link': 'Truy cập theo dõi',
        'modal.close': 'Đóng',
        'toast.file_selected': 'Tệp đã chọn: {filename}',
        'toast.upload_error': 'Lỗi tải lên: {error}',
        'toast.fill_required': 'Vui lòng điền tất cả các trường bắt buộc.',
        'toast.files_required': 'Vui lòng tải lên hai tệp cần thiết.',
        'toast.submit_error': 'Lỗi đăng ký: {error}',
        'toast.copy_error': 'Lỗi sao chép',
        'toast.copy_success': 'Đã sao chép!'
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
    const sportSelect = document.getElementById('sportSelect');
    if (sportSelect) {
        const firstOption = sportSelect.querySelector('option[value=""]');
        if (firstOption) firstOption.textContent = t('form.choose_sport');
    }
    const submitSpan = document.querySelector('#submitBtn span');
    if (submitSpan) submitSpan.textContent = t('form.submit');
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
        const currentSport = document.getElementById('sportSelect').value;
        if (currentSport && sportFields[currentSport]) {
            buildSportFields(currentSport);
        }
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
const form = document.getElementById('premierPasForm');
const affOui = document.getElementById('affOui');
const affNon = document.getElementById('affNon');
const affiliateGroup = document.getElementById('affiliateGroup');
const affiliateIdInput = document.getElementById('affiliateId');
const birthDateInput = document.getElementById('birthDate');
const parentGroup = document.getElementById('parentGroup');
const parentNameInput = document.getElementById('parentName');
const sportSelect = document.getElementById('sportSelect');
const sportFieldsDiv = document.getElementById('sportSpecificFields');
const submitBtn = document.getElementById('submitBtn');
const diplomaBox = document.getElementById('upload-diplome');
const idCardBox = document.getElementById('upload-piece');
const globalLoader = document.getElementById('globalLoader');

let uploadedDiplomaUrl = null;
let uploadedIdCardUrl = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : GESTION AFFILIATION ==========
affOui.addEventListener('change', () => {
    affiliateGroup.style.display = affOui.checked ? 'block' : 'none';
});
affNon.addEventListener('change', () => {
    affiliateGroup.style.display = 'none';
    affiliateIdInput.value = '';
});
// ========== FIN : GESTION AFFILIATION ==========

// ========== DÉBUT : GESTION ÂGE ==========
function updateParentGroup() {
    const birthDate = birthDateInput.value;
    if (!birthDate) { parentGroup.style.display = 'none'; return; }
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    parentGroup.style.display = age < 18 ? 'block' : 'none';
    if (age >= 18) parentNameInput.value = '';
}
birthDateInput.addEventListener('change', updateParentGroup);
// ========== FIN : GESTION ÂGE ==========

// ========== DÉBUT : CHAMPS SPÉCIFIQUES PAR SPORT ==========
const sportFields = {
    football: {
        roleCode: 'FT',
        fields: [
            { name: 'poste', labelKey: 'sport.football.poste', type: 'select', options: ['Gardien de But','Défenseur Central','Latéral','Milieu Défensif','Milieu Offensif','Attaquant / Ailier','Autre (préciser)'], required: true },
            { name: 'piedDominant', labelKey: 'sport.football.piedDominant', type: 'select', options: ['Droitier','Gaucher','Ambidextre'], required: true },
            { name: 'taille', labelKey: 'sport.football.taille', type: 'number', required: true },
            { name: 'poids', labelKey: 'sport.football.poids', type: 'number', required: true },
            { name: 'statistiques', labelKey: 'sport.football.statistiques', type: 'textarea', required: false },
            { name: 'club', labelKey: 'sport.football.club', type: 'text', required: true },
            { name: 'anneesPratique', labelKey: 'sport.football.anneesPratique', type: 'number', required: false },
            { name: 'niveau', labelKey: 'sport.football.niveau', type: 'text', required: true }
        ]
    },
    basketball: {
        roleCode: 'BK',
        fields: [
            { name: 'poste', labelKey: 'sport.basketball.poste', type: 'select', options: ['Meneur','Arrière','Ailier','Ailier fort','Pivot','Autre (préciser)'], required: true },
            { name: 'mainDominante', labelKey: 'sport.basketball.mainDominante', type: 'select', options: ['Droitier','Gaucher','Ambidextre'], required: true },
            { name: 'taille', labelKey: 'sport.basketball.taille', type: 'number', required: true },
            { name: 'envergure', labelKey: 'sport.basketball.envergure', type: 'number', required: true },
            { name: 'detente', labelKey: 'sport.basketball.detente', type: 'number', required: true },
            { name: 'poids', labelKey: 'sport.basketball.poids', type: 'number', required: true },
            { name: 'statistiques', labelKey: 'sport.basketball.statistiques', type: 'textarea', required: false },
            { name: 'club', labelKey: 'sport.basketball.club', type: 'text', required: true },
            { name: 'anneesPratique', labelKey: 'sport.basketball.anneesPratique', type: 'number', required: false },
            { name: 'niveau', labelKey: 'sport.basketball.niveau', type: 'text', required: true }
        ]
    },
    tennis: {
        roleCode: 'TN',
        fields: [
            { name: 'typeJeu', labelKey: 'sport.tennis.typeJeu', type: 'select', options: ['Attaquant','Défenseur','Polyvalent'], required: true },
            { name: 'coupDroit', labelKey: 'sport.tennis.coupDroit', type: 'select', options: ['Mono main','Deux mains'], required: true },
            { name: 'revers', labelKey: 'sport.tennis.revers', type: 'select', options: ['Mono main','Deux mains'], required: true },
            { name: 'poids', labelKey: 'sport.tennis.poids', type: 'number', required: true },
            { name: 'classement', labelKey: 'sport.tennis.classement', type: 'text', required: true },
            { name: 'surfacePref', labelKey: 'sport.tennis.surfacePref', type: 'select', options: ['Terre battue','Gazon','Dur','Moquette'], required: true },
            { name: 'meilleurResultat', labelKey: 'sport.tennis.meilleurResultat', type: 'text', required: false },
            { name: 'vitesseService', labelKey: 'sport.tennis.vitesseService', type: 'number', required: false },
            { name: 'club', labelKey: 'sport.tennis.club', type: 'text', required: true },
            { name: 'niveau', labelKey: 'sport.tennis.niveau', type: 'text', required: true }
        ]
    },
    athletisme: {
        roleCode: 'AT',
        fields: [
            { name: 'discipline', labelKey: 'sport.athletisme.discipline', type: 'text', required: true },
            { name: 'meilleurePerf', labelKey: 'sport.athletisme.meilleurePerf', type: 'text', required: true },
            { name: 'record100', labelKey: 'sport.athletisme.record100', type: 'text', required: false },
            { name: 'record10k', labelKey: 'sport.athletisme.record10k', type: 'text', required: false },
            { name: 'entrainementsSemaine', labelKey: 'sport.athletisme.entrainementsSemaine', type: 'number', required: true },
            { name: 'club', labelKey: 'sport.athletisme.club', type: 'text', required: true },
            { name: 'piedDominant', labelKey: 'sport.athletisme.piedDominant', type: 'select', options: ['Droitier','Gaucher','Ambidextre'], required: true },
            { name: 'poids', labelKey: 'sport.athletisme.poids', type: 'number', required: true },
            { name: 'anneesPratique', labelKey: 'sport.athletisme.anneesPratique', type: 'number', required: false },
            { name: 'niveau', labelKey: 'sport.athletisme.niveau', type: 'text', required: true },
            { name: 'blessures', labelKey: 'sport.athletisme.blessures', type: 'textarea', required: false }
        ]
    },
    handball: {
        roleCode: 'HB',
        fields: [
            { name: 'poste', labelKey: 'sport.handball.poste', type: 'select', options: ['Gardien','Arrière gauche','Arrière droit','Demi-centre','Ailier gauche','Ailier droit','Pivot','Autre (préciser)'], required: true },
            { name: 'taille', labelKey: 'sport.handball.taille', type: 'number', required: true },
            { name: 'poids', labelKey: 'sport.handball.poids', type: 'number', required: true },
            { name: 'mainDominante', labelKey: 'sport.handball.mainDominante', type: 'select', options: ['Droitier','Gaucher','Ambidextre'], required: true },
            { name: 'vitesseTir', labelKey: 'sport.handball.vitesseTir', type: 'number', required: false },
            { name: 'club', labelKey: 'sport.handball.club', type: 'text', required: true },
            { name: 'anneesPratique', labelKey: 'sport.handball.anneesPratique', type: 'number', required: true },
            { name: 'statistiques', labelKey: 'sport.handball.statistiques', type: 'textarea', required: false },
            { name: 'niveau', labelKey: 'sport.handball.niveau', type: 'text', required: true }
        ]
    },
    volleyball: {
        roleCode: 'VB',
        fields: [
            { name: 'poste', labelKey: 'sport.volleyball.poste', type: 'select', options: ['Passeur','Réceptionneur-attaquant','Central','Pointu','Libéro','Autre (préciser)'], required: true },
            { name: 'taille', labelKey: 'sport.volleyball.taille', type: 'number', required: true },
            { name: 'detenteAttaque', labelKey: 'sport.volleyball.detenteAttaque', type: 'number', required: true },
            { name: 'detenteContre', labelKey: 'sport.volleyball.detenteContre', type: 'number', required: true },
            { name: 'mainDominante', labelKey: 'sport.volleyball.mainDominante', type: 'select', options: ['Droitier','Gaucher','Ambidextre'], required: true },
            { name: 'poids', labelKey: 'sport.volleyball.poids', type: 'number', required: true },
            { name: 'club', labelKey: 'sport.volleyball.club', type: 'text', required: true },
            { name: 'anneesPratique', labelKey: 'sport.volleyball.anneesPratique', type: 'number', required: false },
            { name: 'niveau', labelKey: 'sport.volleyball.niveau', type: 'text', required: true }
        ]
    },
    rugby: {
        roleCode: 'RG',
        fields: [
            { name: 'poste', labelKey: 'sport.rugby.poste', type: 'select', options: ['Pilier','Talonneur','2e ligne','3e ligne aile','3e ligne centre','Demi de mêlée','Demi d’ouverture','Centre','Ailier','Arrière','Autre (préciser)'], required: true },
            { name: 'taille', labelKey: 'sport.rugby.taille', type: 'number', required: true },
            { name: 'poids', labelKey: 'sport.rugby.poids', type: 'number', required: true },
            { name: 'vitesse40', labelKey: 'sport.rugby.vitesse40', type: 'number', required: true },
            { name: 'plaquage', labelKey: 'sport.rugby.plaquage', type: 'text', required: false },
            { name: 'club', labelKey: 'sport.rugby.club', type: 'text', required: true },
            { name: 'anneesPratique', labelKey: 'sport.rugby.anneesPratique', type: 'number', required: false },
            { name: 'matchsSaison', labelKey: 'sport.rugby.matchsSaison', type: 'number', required: false },
            { name: 'niveau', labelKey: 'sport.rugby.niveau', type: 'text', required: true }
        ]
    },
    natation: {
        roleCode: 'NA',
        fields: [
            { name: 'nage', labelKey: 'sport.natation.nage', type: 'select', options: ['Crawl','Dos','Brasse','Papillon','4 nages','Autre (préciser)'], required: true },
            { name: 'taille', labelKey: 'sport.natation.taille', type: 'number', required: true },
            { name: 'poids', labelKey: 'sport.natation.poids', type: 'number', required: true },
            { name: 'meilleur50', labelKey: 'sport.natation.meilleur50', type: 'text', required: true },
            { name: 'meilleur100', labelKey: 'sport.natation.meilleur100', type: 'text', required: true },
            { name: 'meilleur200', labelKey: 'sport.natation.meilleur200', type: 'text', required: true },
            { name: 'chrono50', labelKey: 'sport.natation.chrono50', type: 'text', required: false },
            { name: 'club', labelKey: 'sport.natation.club', type: 'text', required: true },
            { name: 'anneesPratique', labelKey: 'sport.natation.anneesPratique', type: 'number', required: false },
            { name: 'entrainementsSemaine', labelKey: 'sport.natation.entrainementsSemaine', type: 'text', required: false },
            { name: 'niveau', labelKey: 'sport.natation.niveau', type: 'text', required: true }
        ]
    },
    arts_martiaux: {
        roleCode: 'AM',
        fields: [
            { name: 'discipline', labelKey: 'sport.arts_martiaux.discipline', type: 'text', required: true },
            { name: 'taille', labelKey: 'sport.arts_martiaux.taille', type: 'number', required: true },
            { name: 'poids', labelKey: 'sport.arts_martiaux.poids', type: 'number', required: true },
            { name: 'grade', labelKey: 'sport.arts_martiaux.grade', type: 'text', required: false },
            { name: 'poidsCompetition', labelKey: 'sport.arts_martiaux.poidsCompetition', type: 'number', required: false },
            { name: 'palmares', labelKey: 'sport.arts_martiaux.palmares', type: 'textarea', required: false },
            { name: 'anneesPratique', labelKey: 'sport.arts_martiaux.anneesPratique', type: 'number', required: true },
            { name: 'club', labelKey: 'sport.arts_martiaux.club', type: 'text', required: true },
            { name: 'specialite', labelKey: 'sport.arts_martiaux.specialite', type: 'text', required: false },
            { name: 'preparationPhysique', labelKey: 'sport.arts_martiaux.preparationPhysique', type: 'text', required: false },
            { name: 'niveau', labelKey: 'sport.arts_martiaux.niveau', type: 'text', required: true }
        ]
    },
    cyclisme: {
        roleCode: 'CY',
        fields: [
            { name: 'discipline', labelKey: 'sport.cyclisme.discipline', type: 'select', options: ['Route','VTT cross-country','VTT descente','Piste','BMX','Cyclo-cross','Autre (préciser)'], required: true },
            { name: 'taille', labelKey: 'sport.cyclisme.taille', type: 'number', required: true },
            { name: 'poids', labelKey: 'sport.cyclisme.poids', type: 'number', required: true },
            { name: 'ftp', labelKey: 'sport.cyclisme.ftp', type: 'number', required: false },
            { name: 'fcm', labelKey: 'sport.cyclisme.fcm', type: 'number', required: false },
            { name: 'meilleurResultat', labelKey: 'sport.cyclisme.meilleurResultat', type: 'text', required: false },
            { name: 'kmSemaine', labelKey: 'sport.cyclisme.kmSemaine', type: 'number', required: false },
            { name: 'club', labelKey: 'sport.cyclisme.club', type: 'text', required: true },
            { name: 'anneesPratique', labelKey: 'sport.cyclisme.anneesPratique', type: 'number', required: false },
            { name: 'niveau', labelKey: 'sport.cyclisme.niveau', type: 'text', required: true }
        ]
    }
};

function buildSportFields(sportKey) {
    const sport = sportFields[sportKey];
    if (!sport) return;
    let html = '';
    sport.fields.forEach(field => {
        html += `<div class="form-group">`;
        html += `<label>${field.labelKey} ${field.required ? '<span class="required">*</span>' : ''}</label>`;
        if (field.type === 'select') {
            html += `<select id="sport_${field.name}" ${field.required ? 'required' : ''}>`;
            html += `<option value="">-- Choisir --</option>`;
            field.options.forEach(opt => { html += `<option value="${opt}">${opt}</option>`; });
            html += `</select>`;
        } else if (field.type === 'textarea') {
            html += `<textarea id="sport_${field.name}" rows="3" ${field.required ? 'required' : ''}></textarea>`;
        } else {
            html += `<input type="${field.type}" id="sport_${field.name}" ${field.required ? 'required' : ''}>`;
        }
        html += `</div>`;
    });
    sportFieldsDiv.innerHTML = html;
    sportFieldsDiv.style.display = 'block';
}

sportSelect.addEventListener('change', () => {
    const selected = sportSelect.value;
    if (selected && sportFields[selected]) {
        buildSportFields(selected);
    } else {
        sportFieldsDiv.innerHTML = '';
        sportFieldsDiv.style.display = 'none';
    }
});
// ========== FIN : CHAMPS SPÉCIFIQUES PAR SPORT ==========

// ========== DÉBUT : UPLOAD (CORRIGÉ) ==========
function setupFileUpload(boxId, inputId) {
    const box = document.getElementById(boxId);
    const input = document.getElementById(inputId);
    if (!box || !input) return;
    input.addEventListener('change', () => {
        if (input.files.length) {
            const fileName = input.files[0].name;
            const span = box.querySelector('span:not(.progress-text)');
            if (span) span.textContent = fileName;
            box.style.borderColor = 'var(--primary)';
            showToast(t('toast.file_selected', { filename: fileName }), 'success');
        }
    });
    box.addEventListener('click', (e) => {
        if (e.target !== input) input.click();
    });
}

async function uploadFileDirect(file, box, fieldName) {
    const fullName = document.getElementById('fullName').value.trim();
    const safeName = fullName ? fullName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) : 'candidat';
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `${safeName}_${dateStr}_${fieldName}.${fileExt}`;
    const bucket = 'premierpas_documents';

    const statusDiv = box.querySelector('.upload-status');
    const successDiv = box.querySelector('.upload-success');
    if (statusDiv) statusDiv.style.display = 'flex';
    if (successDiv) successDiv.style.display = 'none';
    box.classList.add('uploading');

    try {
        const { error } = await supabasePublic.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);
        if (statusDiv) statusDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'flex';
        box.classList.remove('uploading');
        box.classList.add('success');
        return urlData.publicUrl;
    } catch (err) {
        box.classList.remove('uploading');
        if (statusDiv) statusDiv.style.display = 'none';
        showToast(t('toast.upload_error', { error: err.message }), 'error');
        throw err;
    }
}

setupFileUpload('upload-diplome', 'diplomaFile');
setupFileUpload('upload-piece', 'idCardFile');
// ========== FIN : UPLOAD ==========

// ========== DÉBUT : GÉNÉRATION IDENTIFIANT ==========
function generatePPId(sportCode) {
    const randomPart = String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
                       String(Math.floor(Math.random() * 1000)).padStart(3, '0') +
                       String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
                       String.fromCharCode(97 + Math.floor(Math.random() * 26));
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const vaPart = `VA-${month}${day}${hour}`;
    const secondsPart = String(now.getSeconds()).padStart(3, '0');
    const counter = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return `${randomPart}-${vaPart}-HubIS-${sportCode}-${secondsPart}-${counter}`;
}
// ========== FIN : GÉNÉRATION IDENTIFIANT ==========

// ========== DÉBUT : TOAST, LOADER, ESCAPEHTML ==========
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 3000);
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }
// ========== FIN : TOAST, LOADER, ESCAPEHTML ==========

// ========== DÉBUT : SOUMISSION FORMULAIRE ==========
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const definition = document.querySelector('input[name="definition"]:checked')?.value;
    const fullName = document.getElementById('fullName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const parentName = document.getElementById('parentName').value.trim();
    const inscriptionCode = document.getElementById('inscriptionCode').value.trim();
    const isAffiliated = affOui.checked;
    const affiliateId = affiliateIdInput.value.trim();
    const diplomaTitle = document.getElementById('diplomaTitle').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const sport = sportSelect.value;
    const certified = document.getElementById('certifie').checked;

    if (!definition || !fullName || !birthDate || !diplomaTitle || !phone || !sport || !certified) {
        showToast(t('toast.fill_required'), 'error');
        return;
    }

    const diplomaFile = document.getElementById('diplomaFile').files[0];
    const idCardFile = document.getElementById('idCardFile').files[0];
    if (!diplomaFile || !idCardFile) {
        showToast(t('toast.files_required'), 'error');
        return;
    }

    const sportConfig = sportFields[sport];
    if (!sportConfig) {
        showToast('Erreur configuration sport', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléversement...';
    showLoader();

    try {
        const [diplomaUrl, idCardUrl] = await Promise.all([
            uploadFileDirect(diplomaFile, diplomaBox, 'diplome'),
            uploadFileDirect(idCardFile, idCardBox, 'idcard')
        ]);

        const sportData = {};
        sportConfig.fields.forEach(field => {
            const el = document.getElementById(`sport_${field.name}`);
            if (el) sportData[field.name] = el.value;
        });

        const roleMapping = {
            football: 'footballeur', basketball: 'basketteur', tennis: 'tennisman',
            athletisme: 'athlète', handball: 'handballeur', volleyball: 'volleyeur',
            rugby: 'rugbyman', natation: 'nageur', arts_martiaux: 'combattant', cyclisme: 'cycliste'
        };
        const role = roleMapping[sport] || 'sportif';
        const ppId = generatePPId(sportConfig.roleCode);

        const { error } = await supabasePublic
            .from('public_premierpas')
            .insert([{
                pp_id: ppId,
                definition, full_name: fullName, birth_date: birthDate,
                parent_name: parentName || null, inscription_code: inscriptionCode || null,
                is_affiliated: isAffiliated, affiliate_id: affiliateId || null,
                diploma_title: diplomaTitle, diploma_url: diplomaUrl, id_card_url: idCardUrl,
                phone, sport, role, sport_data: sportData,
                status: 'en_attente', created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        document.getElementById('trackingId').textContent = ppId;
        document.getElementById('successModal').classList.add('active');
        form.reset();
        sportFieldsDiv.innerHTML = '';
        sportFieldsDiv.style.display = 'none';
        affiliateGroup.style.display = 'none';
        parentGroup.style.display = 'none';
        document.getElementById('diplomaFile').value = '';
        document.getElementById('idCardFile').value = '';
        diplomaBox.querySelector('span:not(.progress-text)').textContent = t('form.upload_click');
        idCardBox.querySelector('span:not(.progress-text)').textContent = t('form.upload_click');
        diplomaBox.classList.remove('success', 'uploading');
        idCardBox.classList.remove('success', 'uploading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + t('form.submit') + '</span>';
    } catch (err) {
        console.error(err);
        showToast(t('toast.submit_error', { error: err.message }), 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + t('form.submit') + '</span>';
    } finally {
        hideLoader();
    }
});
// ========== FIN : SOUMISSION FORMULAIRE ==========

// ========== DÉBUT : COPIE ID ==========
document.getElementById('copyTrackingBtn').addEventListener('click', () => {
    const link = document.getElementById('trackingId').textContent;
    if (link) {
        navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('copyTrackingBtn');
            btn.innerHTML = '<i class="fas fa-check"></i> ' + t('toast.copy_success');
            setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> ' + t('modal.copy'); }, 2000);
        }).catch(() => showToast(t('toast.copy_error'), 'error'));
    }
});
window.closeSuccessModal = () => document.getElementById('successModal').classList.remove('active');
// ========== FIN : COPIE ID ==========

// ========== DÉBUT : MENU MOBILE ET LANGUE ==========
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

const langSelect = document.getElementById('langSelect');
if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
}

const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get('ref');
if (ref) {
    sessionStorage.setItem('affiliateRef', ref);
    affOui.checked = true;
    affiliateIdInput.value = ref;
    affiliateGroup.style.display = 'block';
}

applyTranslations();
// ========== FIN ==========