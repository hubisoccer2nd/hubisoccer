/* DEBUT : test-ecrit/test-ecrit.js */
// ========== TEST-ECRIT.JS ==========
// Configuration Supabase
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS (24 LANGUES) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.home': 'Accueil',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'exam.title': 'Examen de qualification',
        'exam.subtitle': 'Pour accéder à l\'épreuve, veuillez renseigner vos informations personnelles et votre identifiant.',
        'exam.fullname': 'Nom complet *',
        'exam.birthdate': 'Date de naissance *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Votre ID de suivi (PP ID) *',
        'exam.id_note': 'Cet ID se trouve sur la page de suivi ou dans l\'email de confirmation.',
        'exam.continue': 'Continuer vers l\'épreuve',
        'exam.info': 'L\'épreuve dure environ 15 minutes. Vous devez obtenir au moins 7/10 au QCM pour que votre copie soit corrigée.',
        'exam.epreuve_title': 'Épreuve de qualification',
        'exam.submit': 'Soumettre mon épreuve',
        'exam.wait_title': 'Épreuve soumise !',
        'exam.wait_message': 'Votre copie a bien été enregistrée. Un correcteur l\'analysera sous 1h à 24h. Vous recevrez votre note et un PDF corrigé dans votre espace de suivi.',
        'exam.wait_thanks': 'Merci de votre confiance.',
        'exam.go_suivi': 'Aller à mon suivi',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez vos informations.',
        'toast.id_mismatch': 'Les informations ne correspondent pas à notre base.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour l\'examen. Seuls les sportifs avec le statut "Test écrit" peuvent composer.',
        'toast.no_active_epreuve': 'Aucune épreuve active pour ce sport. Contactez l\'administration.',
        'toast.fill_all_fields': 'Veuillez remplir tous les champs.',
        'toast.answer_all_qcm': 'Veuillez répondre à la question {num}.',
        'toast.answer_redac': 'Veuillez répondre aux questions rédactionnelles (11 et 12).',
        'toast.submit_error': 'Erreur lors de la soumission.',
        'toast.lang_changed': 'Langue changée en {lang}'
    },
    en: {
        'loader.message': 'Loading...',
        'nav.home': 'Home',
        'nav.scouting': 'Scouting',
        'nav.process': 'Process',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Become an actor',
        'nav.tournaments': 'Tournaments',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'exam.title': 'Qualification exam',
        'exam.subtitle': 'To access the exam, please enter your personal information and your ID.',
        'exam.fullname': 'Full name *',
        'exam.birthdate': 'Date of birth *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Your tracking ID (PP ID) *',
        'exam.id_note': 'This ID is on the tracking page or in the confirmation email.',
        'exam.continue': 'Continue to exam',
        'exam.info': 'The exam lasts about 15 minutes. You need at least 7/10 on the MCQ for your paper to be corrected.',
        'exam.epreuve_title': 'Qualification exam',
        'exam.submit': 'Submit my exam',
        'exam.wait_title': 'Exam submitted!',
        'exam.wait_message': 'Your paper has been recorded. A grader will analyze it within 1h to 24h. You will receive your grade and a corrected PDF in your tracking space.',
        'exam.wait_thanks': 'Thank you for your trust.',
        'exam.go_suivi': 'Go to my tracking',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.id_not_found': 'ID not found. Please check your information.',
        'toast.id_mismatch': 'The information does not match our records.',
        'toast.status_not_ready': 'Your file is not ready for the exam. Only athletes with the "Written test" status can take it.',
        'toast.no_active_epreuve': 'No active exam for this sport. Contact the administration.',
        'toast.fill_all_fields': 'Please fill in all fields.',
        'toast.answer_all_qcm': 'Please answer question {num}.',
        'toast.answer_redac': 'Please answer the essay questions (11 and 12).',
        'toast.submit_error': 'Error during submission.',
        'toast.lang_changed': 'Language changed to {lang}'
    },
    yo: {
        'loader.message': 'Nlọ...',
        'nav.home': 'Ile',
        'nav.scouting': 'Ṣiṣayẹwo',
        'nav.process': 'Ilana',
        'nav.affiliation': 'Ifọwọsi',
        'nav.actors': 'Di oṣere',
        'nav.tournaments': 'Awọn idije',
        'nav.community': 'Agbegbe',
        'nav.market': 'Ọjà',
        'nav.login': 'Wo ile',
        'nav.signup': 'Forukọsilẹ',
        'exam.title': 'Idanwo afijẹ',
        'exam.subtitle': 'Lati wọle si idanwo naa, jọwọ fi alaye ti ara ẹni ati ID rẹ si.',
        'exam.fullname': 'Orukọ kikun *',
        'exam.birthdate': 'Ọjọ ibi *',
        'exam.sport': 'Idaraya *',
        'exam.id_label': 'ID atẹle rẹ (PP ID) *',
        'exam.id_note': 'ID yii wa lori oju-iwe atẹle tabi ninu imeeli ijẹrisi.',
        'exam.continue': 'Tesiwaju si idanwo',
        'exam.info': 'Idanwo naa gba bii iṣẹju 15. O nilo o kere ju 7/10 lori MCQ fun iwe rẹ lati ṣe atunṣe.',
        'exam.epreuve_title': 'Idanwo afijẹ',
        'exam.submit': 'Fi idanwo mi silẹ',
        'exam.wait_title': 'Idanwo ti fi silẹ!',
        'exam.wait_message': 'Iwe rẹ ti gba silẹ. Oluṣatunṣe kan yoo ṣe ayẹwo rẹ laarin wakati 1 si 24. Iwọ yoo gba ami rẹ ati PDF ti a ṣe atunṣe ni aaye atẹle rẹ.',
        'exam.wait_thanks': 'O ṣeun fun igbẹkẹle rẹ.',
        'exam.go_suivi': 'Lọ si atẹle mi',
        'footer.badge1': 'Ifaramọ APDP Benin',
        'footer.badge2': 'Awọn ilana FIFA',
        'footer.badge3': 'Ise agbese Idaraya-Eko-Meji',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.',
        'toast.id_not_found': 'A ko ri ID. Jọwọ ṣayẹwo alaye rẹ.',
        'toast.id_mismatch': 'Alaye naa ko baamu awọn igbasilẹ wa.',
        'toast.status_not_ready': 'Faili rẹ ko ṣetan fun idanwo. Awọn elere idaraya nikan pẹlu ipo "Idanwo kikọ" le ṣe idanwo naa.',
        'toast.no_active_epreuve': 'Ko si idanwo ti n ṣiṣẹ fun idaraya yii. Kan si iṣakoso.',
        'toast.fill_all_fields': 'Jọwọ fọwọsi gbogbo awọn aaye.',
        'toast.answer_all_qcm': 'Jọwọ dahun ibeere {num}.',
        'toast.answer_redac': 'Jọwọ dahun awọn ibeere arosọ (11 ati 12).',
        'toast.submit_error': 'Aṣiṣe lakoko ifisilẹ.',
        'toast.lang_changed': 'Ede ti yipada si {lang}'
    },
    fon: {
        'loader.message': 'Tɛn ɖo...',
        'nav.home': 'Xwé',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Byɔ xɔntin',
        'nav.signup': 'Nyikɔ wlan',
        'exam.title': 'Examen de qualification',
        'exam.subtitle': 'Pour accéder à l\'épreuve, veuillez renseigner vos informations personnelles et votre identifiant.',
        'exam.fullname': 'Nom complet *',
        'exam.birthdate': 'Date de naissance *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Votre ID de suivi (PP ID) *',
        'exam.id_note': 'Cet ID se trouve sur la page de suivi ou dans l\'email de confirmation.',
        'exam.continue': 'Continuer vers l\'épreuve',
        'exam.info': 'L\'épreuve dure environ 15 minutes. Vous devez obtenir au moins 7/10 au QCM pour que votre copie soit corrigée.',
        'exam.epreuve_title': 'Épreuve de qualification',
        'exam.submit': 'Soumettre mon épreuve',
        'exam.wait_title': 'Épreuve soumise !',
        'exam.wait_message': 'Votre copie a bien été enregistrée. Un correcteur l\'analysera sous 1h à 24h. Vous recevrez votre note et un PDF corrigé dans votre espace de suivi.',
        'exam.wait_thanks': 'Merci de votre confiance.',
        'exam.go_suivi': 'Aller à mon suivi',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez vos informations.',
        'toast.id_mismatch': 'Les informations ne correspondent pas à notre base.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour l\'examen. Seuls les sportifs avec le statut "Test écrit" peuvent composer.',
        'toast.no_active_epreuve': 'Aucune épreuve active pour ce sport. Contactez l\'administration.',
        'toast.fill_all_fields': 'Veuillez remplir tous les champs.',
        'toast.answer_all_qcm': 'Veuillez répondre à la question {num}.',
        'toast.answer_redac': 'Veuillez répondre aux questions rédactionnelles (11 et 12).',
        'toast.submit_error': 'Erreur lors de la soumission.',
        'toast.lang_changed': 'Langue changée en {lang}'
    },
    mina: {
        'loader.message': 'Chargement...',
        'nav.home': 'Xwé',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Gé ɖé émè',
        'nav.signup': 'Ŋkɔ́ wlá',
        'exam.title': 'Examen de qualification',
        'exam.subtitle': 'Pour accéder à l\'épreuve, veuillez renseigner vos informations personnelles et votre identifiant.',
        'exam.fullname': 'Nom complet *',
        'exam.birthdate': 'Date de naissance *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Votre ID de suivi (PP ID) *',
        'exam.id_note': 'Cet ID se trouve sur la page de suivi ou dans l\'email de confirmation.',
        'exam.continue': 'Continuer vers l\'épreuve',
        'exam.info': 'L\'épreuve dure environ 15 minutes. Vous devez obtenir au moins 7/10 au QCM pour que votre copie soit corrigée.',
        'exam.epreuve_title': 'Épreuve de qualification',
        'exam.submit': 'Soumettre mon épreuve',
        'exam.wait_title': 'Épreuve soumise !',
        'exam.wait_message': 'Votre copie a bien été enregistrée. Un correcteur l\'analysera sous 1h à 24h. Vous recevrez votre note et un PDF corrigé dans votre espace de suivi.',
        'exam.wait_thanks': 'Merci de votre confiance.',
        'exam.go_suivi': 'Aller à mon suivi',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez vos informations.',
        'toast.id_mismatch': 'Les informations ne correspondent pas à notre base.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour l\'examen. Seuls les sportifs avec le statut "Test écrit" peuvent composer.',
        'toast.no_active_epreuve': 'Aucune épreuve active pour ce sport. Contactez l\'administration.',
        'toast.fill_all_fields': 'Veuillez remplir tous les champs.',
        'toast.answer_all_qcm': 'Veuillez répondre à la question {num}.',
        'toast.answer_redac': 'Veuillez répondre aux questions rédactionnelles (11 et 12).',
        'toast.submit_error': 'Erreur lors de la soumission.',
        'toast.lang_changed': 'Langue changée en {lang}'
    },
    lin: {
        'loader.message': 'Chargement...',
        'nav.home': 'Ndako',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Kota',
        'nav.signup': 'Komikomisa',
        'exam.title': 'Examen de qualification',
        'exam.subtitle': 'Pour accéder à l\'épreuve, veuillez renseigner vos informations personnelles et votre identifiant.',
        'exam.fullname': 'Nom complet *',
        'exam.birthdate': 'Date de naissance *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Votre ID de suivi (PP ID) *',
        'exam.id_note': 'Cet ID se trouve sur la page de suivi ou dans l\'email de confirmation.',
        'exam.continue': 'Continuer vers l\'épreuve',
        'exam.info': 'L\'épreuve dure environ 15 minutes. Vous devez obtenir au moins 7/10 au QCM pour que votre copie soit corrigée.',
        'exam.epreuve_title': 'Épreuve de qualification',
        'exam.submit': 'Soumettre mon épreuve',
        'exam.wait_title': 'Épreuve soumise !',
        'exam.wait_message': 'Votre copie a bien été enregistrée. Un correcteur l\'analysera sous 1h à 24h. Vous recevrez votre note et un PDF corrigé dans votre espace de suivi.',
        'exam.wait_thanks': 'Merci de votre confiance.',
        'exam.go_suivi': 'Aller à mon suivi',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez vos informations.',
        'toast.id_mismatch': 'Les informations ne correspondent pas à notre base.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour l\'examen. Seuls les sportifs avec le statut "Test écrit" peuvent composer.',
        'toast.no_active_epreuve': 'Aucune épreuve active pour ce sport. Contactez l\'administration.',
        'toast.fill_all_fields': 'Veuillez remplir tous les champs.',
        'toast.answer_all_qcm': 'Veuillez répondre à la question {num}.',
        'toast.answer_redac': 'Veuillez répondre aux questions rédactionnelles (11 et 12).',
        'toast.submit_error': 'Erreur lors de la soumission.',
        'toast.lang_changed': 'Langue changée en {lang}'
    },
    wol: {
        'loader.message': 'Chargement...',
        'nav.home': 'Kër',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Dugg',
        'nav.signup': 'Seetal',
        'exam.title': 'Examen de qualification',
        'exam.subtitle': 'Pour accéder à l\'épreuve, veuillez renseigner vos informations personnelles et votre identifiant.',
        'exam.fullname': 'Nom complet *',
        'exam.birthdate': 'Date de naissance *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Votre ID de suivi (PP ID) *',
        'exam.id_note': 'Cet ID se trouve sur la page de suivi ou dans l\'email de confirmation.',
        'exam.continue': 'Continuer vers l\'épreuve',
        'exam.info': 'L\'épreuve dure environ 15 minutes. Vous devez obtenir au moins 7/10 au QCM pour que votre copie soit corrigée.',
        'exam.epreuve_title': 'Épreuve de qualification',
        'exam.submit': 'Soumettre mon épreuve',
        'exam.wait_title': 'Épreuve soumise !',
        'exam.wait_message': 'Votre copie a bien été enregistrée. Un correcteur l\'analysera sous 1h à 24h. Vous recevrez votre note et un PDF corrigé dans votre espace de suivi.',
        'exam.wait_thanks': 'Merci de votre confiance.',
        'exam.go_suivi': 'Aller à mon suivi',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez vos informations.',
        'toast.id_mismatch': 'Les informations ne correspondent pas à notre base.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour l\'examen. Seuls les sportifs avec le statut "Test écrit" peuvent composer.',
        'toast.no_active_epreuve': 'Aucune épreuve active pour ce sport. Contactez l\'administration.',
        'toast.fill_all_fields': 'Veuillez remplir tous les champs.',
        'toast.answer_all_qcm': 'Veuillez répondre à la question {num}.',
        'toast.answer_redac': 'Veuillez répondre aux questions rédactionnelles (11 et 12).',
        'toast.submit_error': 'Erreur lors de la soumission.',
        'toast.lang_changed': 'Langue changée en {lang}'
    },
    diou: {
        'loader.message': 'Chargement...',
        'nav.home': 'Sso',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Dɔ́n',
        'nav.signup': 'Sɛ̀bɛ̀n',
        'exam.title': 'Examen de qualification',
        'exam.subtitle': 'Pour accéder à l\'épreuve, veuillez renseigner vos informations personnelles et votre identifiant.',
        'exam.fullname': 'Nom complet *',
        'exam.birthdate': 'Date de naissance *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Votre ID de suivi (PP ID) *',
        'exam.id_note': 'Cet ID se trouve sur la page de suivi ou dans l\'email de confirmation.',
        'exam.continue': 'Continuer vers l\'épreuve',
        'exam.info': 'L\'épreuve dure environ 15 minutes. Vous devez obtenir au moins 7/10 au QCM pour que votre copie soit corrigée.',
        'exam.epreuve_title': 'Épreuve de qualification',
        'exam.submit': 'Soumettre mon épreuve',
        'exam.wait_title': 'Épreuve soumise !',
        'exam.wait_message': 'Votre copie a bien été enregistrée. Un correcteur l\'analysera sous 1h à 24h. Vous recevrez votre note et un PDF corrigé dans votre espace de suivi.',
        'exam.wait_thanks': 'Merci de votre confiance.',
        'exam.go_suivi': 'Aller à mon suivi',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez vos informations.',
        'toast.id_mismatch': 'Les informations ne correspondent pas à notre base.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour l\'examen. Seuls les sportifs avec le statut "Test écrit" peuvent composer.',
        'toast.no_active_epreuve': 'Aucune épreuve active pour ce sport. Contactez l\'administration.',
        'toast.fill_all_fields': 'Veuillez remplir tous les champs.',
        'toast.answer_all_qcm': 'Veuillez répondre à la question {num}.',
        'toast.answer_redac': 'Veuillez répondre aux questions rédactionnelles (11 et 12).',
        'toast.submit_error': 'Erreur lors de la soumission.',
        'toast.lang_changed': 'Langue changée en {lang}'
    },
    ha: {
        'loader.message': 'Ana lodi...',
        'nav.home': 'Gida',
        'nav.scouting': 'Scouting',
        'nav.process': 'Tsari',
        'nav.affiliation': 'Alaƙa',
        'nav.actors': 'Zama ɗan wasa',
        'nav.tournaments': 'Gasa',
        'nav.community': 'Al\'umma',
        'nav.market': 'Kasuwa',
        'nav.login': 'Shiga',
        'nav.signup': 'Yi rajista',
        'exam.title': 'Jarrabawar cancanta',
        'exam.subtitle': 'Don shiga jarrabawar, da fatan za a shigar da bayanan sirri da ID ɗin ku.',
        'exam.fullname': 'Cikakken suna *',
        'exam.birthdate': 'Ranar haihuwa *',
        'exam.sport': 'Wasanni *',
        'exam.id_label': 'ID ɗin bibiyar ku (PP ID) *',
        'exam.id_note': 'Wannan ID yana kan shafin bibiya ko a cikin imel na tabbatarwa.',
        'exam.continue': 'Ci gaba zuwa jarrabawa',
        'exam.info': 'Jarrabawar tana ɗaukar kusan mintuna 15. Kuna buƙatar samun aƙalla 7/10 akan MCQ don a gyara takardar ku.',
        'exam.epreuve_title': 'Jarrabawar cancanta',
        'exam.submit': 'Gabatar da jarrabawa ta',
        'exam.wait_title': 'An gabatar da jarrabawa!',
        'exam.wait_message': 'An yi rikodin takardar ku. Mai gyara zai bincika ta cikin awa 1 zuwa 24. Za ku sami darajarku da PDF ɗin da aka gyara a sararin bibiyar ku.',
        'exam.wait_thanks': 'Na gode da amincewarku.',
        'exam.go_suivi': 'Je zuwa bibiya ta',
        'footer.badge1': 'Amincewa APDP Benin',
        'footer.badge2': 'Dokokin FIFA',
        'footer.badge3': 'Tsarin Wasanni-Ilimi-Aiki Uku',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Duk haƙƙoƙin mallaka.',
        'toast.id_not_found': 'Ba a sami ID ba. Da fatan za a bincika bayanin ku.',
        'toast.id_mismatch': 'Bayani bai dace da bayanan mu ba.',
        'toast.status_not_ready': 'Fayil ɗin ku bai shirya don jarrabawa ba. Yan wasa masu matsayin "Jarrabawa a rubuce" kawai za su iya ɗauka.',
        'toast.no_active_epreuve': 'Babu jarrabawa mai aiki don wannan wasa. Tuntuɓi hukuma.',
        'toast.fill_all_fields': 'Da fatan za a cika dukkan filayen.',
        'toast.answer_all_qcm': 'Da fatan za a amsa tambaya {num}.',
        'toast.answer_redac': 'Da fatan za a amsa tambayoyin rubutattun (11 da 12).',
        'toast.submit_error': 'Kuskure yayin gabatarwa.',
        'toast.lang_changed': 'An canza harshe zuwa {lang}'
    },
    sw: {
        'loader.message': 'Inapakia...',
        'nav.home': 'Nyumbani',
        'nav.scouting': 'Scouting',
        'nav.process': 'Mchakato',
        'nav.affiliation': 'Uhusiano',
        'nav.actors': 'Kuwa mwigizaji',
        'nav.tournaments': 'Mashindano',
        'nav.community': 'Jamii',
        'nav.market': 'Soko',
        'nav.login': 'Ingia',
        'nav.signup': 'Jiandikishe',
        'exam.title': 'Mtihani wa kufuzu',
        'exam.subtitle': 'Ili kufikia mtihani, tafadhali ingiza maelezo yako ya kibinafsi na kitambulisho chako.',
        'exam.fullname': 'Jina kamili *',
        'exam.birthdate': 'Tarehe ya kuzaliwa *',
        'exam.sport': 'Mchezo *',
        'exam.id_label': 'Kitambulisho chako cha ufuatiliaji (PP ID) *',
        'exam.id_note': 'Kitambulisho hiki kiko kwenye ukurasa wa ufuatiliaji au katika barua pepe ya uthibitisho.',
        'exam.continue': 'Endelea kwa mtihani',
        'exam.info': 'Mtihani huchukua kama dakika 15. Unahitaji angalau 7/10 kwenye MCQ ili karatasi yako isahihishwe.',
        'exam.epreuve_title': 'Mtihani wa kufuzu',
        'exam.submit': 'Peleka mtihani wangu',
        'exam.wait_title': 'Mtihani umepokelewa!',
        'exam.wait_message': 'Karatasi yako imerekodiwa. Msahihishaji ataichambua ndani ya saa 1 hadi 24. Utapokea alama yako na PDF iliyosahihishwa katika nafasi yako ya ufuatiliaji.',
        'exam.wait_thanks': 'Asante kwa imani yako.',
        'exam.go_suivi': 'Nenda kwa ufuatiliaji wangu',
        'footer.badge1': 'Uzingatiaji wa APDP Benin',
        'footer.badge2': 'Kanuni za FIFA',
        'footer.badge3': 'Mradi wa Michezo-Masomo-Kazi Mara Tatu',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Haki zote zimehifadhiwa.',
        'toast.id_not_found': 'Kitambulisho hakikupatikana. Tafadhali angalia maelezo yako.',
        'toast.id_mismatch': 'Maelezo hayalingani na kumbukumbu zetu.',
        'toast.status_not_ready': 'Faili yako haiko tayari kwa mtihani. Wanariadha walio na hali ya "Mtihani wa maandishi" pekee ndio wanaweza kuufanya.',
        'toast.no_active_epreuve': 'Hakuna mtihani unaotumika kwa mchezo huu. Wasiliana na usimamizi.',
        'toast.fill_all_fields': 'Tafadhali jaza sehemu zote.',
        'toast.answer_all_qcm': 'Tafadhali jibu swali {num}.',
        'toast.answer_redac': 'Tafadhali jibu maswali ya insha (11 na 12).',
        'toast.submit_error': 'Hitilafu wakati wa kuwasilisha.',
        'toast.lang_changed': 'Lugha imebadilishwa kuwa {lang}'
    },
    es: {
        'loader.message': 'Cargando...',
        'nav.home': 'Inicio',
        'nav.scouting': 'Scouting',
        'nav.process': 'Proceso',
        'nav.affiliation': 'Afiliación',
        'nav.actors': 'Conviértete en actor',
        'nav.tournaments': 'Torneos',
        'nav.community': 'Comunidad',
        'nav.market': 'Mercado',
        'nav.login': 'Iniciar sesión',
        'nav.signup': 'Registrarse',
        'exam.title': 'Examen de calificación',
        'exam.subtitle': 'Para acceder al examen, ingrese su información personal y su ID.',
        'exam.fullname': 'Nombre completo *',
        'exam.birthdate': 'Fecha de nacimiento *',
        'exam.sport': 'Deporte *',
        'exam.id_label': 'Su ID de seguimiento (PP ID) *',
        'exam.id_note': 'Este ID se encuentra en la página de seguimiento o en el correo de confirmación.',
        'exam.continue': 'Continuar al examen',
        'exam.info': 'El examen dura aproximadamente 15 minutos. Necesita al menos 7/10 en el MCQ para que su copia sea corregida.',
        'exam.epreuve_title': 'Examen de calificación',
        'exam.submit': 'Enviar mi examen',
        'exam.wait_title': '¡Examen enviado!',
        'exam.wait_message': 'Su copia ha sido registrada. Un corrector la analizará en un plazo de 1h a 24h. Recibirá su nota y un PDF corregido en su espacio de seguimiento.',
        'exam.wait_thanks': 'Gracias por su confianza.',
        'exam.go_suivi': 'Ir a mi seguimiento',
        'footer.badge1': 'Conformidad APDP Benín',
        'footer.badge2': 'Reglamento FIFA',
        'footer.badge3': 'Triple Proyecto Deporte-Estudios-Carrera',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.',
        'toast.id_not_found': 'ID no encontrado. Verifique su información.',
        'toast.id_mismatch': 'La información no coincide con nuestra base de datos.',
        'toast.status_not_ready': 'Su expediente no está listo para el examen. Solo los deportistas con el estado "Examen escrito" pueden presentarse.',
        'toast.no_active_epreuve': 'No hay examen activo para este deporte. Contacte con la administración.',
        'toast.fill_all_fields': 'Rellene todos los campos.',
        'toast.answer_all_qcm': 'Responda a la pregunta {num}.',
        'toast.answer_redac': 'Responda a las preguntas de redacción (11 y 12).',
        'toast.submit_error': 'Error durante el envío.',
        'toast.lang_changed': 'Idioma cambiado a {lang}'
    },
    pt: {
        'loader.message': 'Carregando...',
        'nav.home': 'Início',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processo',
        'nav.affiliation': 'Afiliação',
        'nav.actors': 'Torne-se um ator',
        'nav.tournaments': 'Torneios',
        'nav.community': 'Comunidade',
        'nav.market': 'Mercado',
        'nav.login': 'Entrar',
        'nav.signup': 'Inscrever-se',
        'exam.title': 'Exame de qualificação',
        'exam.subtitle': 'Para acessar o exame, insira suas informações pessoais e seu ID.',
        'exam.fullname': 'Nome completo *',
        'exam.birthdate': 'Data de nascimento *',
        'exam.sport': 'Esporte *',
        'exam.id_label': 'Seu ID de acompanhamento (PP ID) *',
        'exam.id_note': 'Este ID está na página de acompanhamento ou no e-mail de confirmação.',
        'exam.continue': 'Continuar para o exame',
        'exam.info': 'O exame dura cerca de 15 minutos. Você precisa de pelo menos 7/10 no MCQ para que sua prova seja corrigida.',
        'exam.epreuve_title': 'Exame de qualificação',
        'exam.submit': 'Enviar meu exame',
        'exam.wait_title': 'Exame enviado!',
        'exam.wait_message': 'Sua prova foi registrada. Um corretor a analisará em até 1h a 24h. Você receberá sua nota e um PDF corrigido em seu espaço de acompanhamento.',
        'exam.wait_thanks': 'Obrigado pela sua confiança.',
        'exam.go_suivi': 'Ir para meu acompanhamento',
        'footer.badge1': 'Conformidade APDP Benim',
        'footer.badge2': 'Regulamento FIFA',
        'footer.badge3': 'Triplo Projeto Esporte-Estudos-Carreira',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.',
        'toast.id_not_found': 'ID não encontrado. Verifique suas informações.',
        'toast.id_mismatch': 'As informações não conferem com nossos registros.',
        'toast.status_not_ready': 'Seu arquivo não está pronto para o exame. Apenas atletas com o status "Teste escrito" podem realizá-lo.',
        'toast.no_active_epreuve': 'Nenhum exame ativo para este esporte. Contacte a administração.',
        'toast.fill_all_fields': 'Preencha todos os campos.',
        'toast.answer_all_qcm': 'Responda à pergunta {num}.',
        'toast.answer_redac': 'Responda às perguntas dissertativas (11 e 12).',
        'toast.submit_error': 'Erro durante o envio.',
        'toast.lang_changed': 'Idioma alterado para {lang}'
    },
    de: {
        'loader.message': 'Laden...',
        'nav.home': 'Startseite',
        'nav.scouting': 'Scouting',
        'nav.process': 'Prozess',
        'nav.affiliation': 'Zugehörigkeit',
        'nav.actors': 'Schauspieler werden',
        'nav.tournaments': 'Turniere',
        'nav.community': 'Gemeinschaft',
        'nav.market': 'Markt',
        'nav.login': 'Anmelden',
        'nav.signup': 'Registrieren',
        'exam.title': 'Qualifikationsprüfung',
        'exam.subtitle': 'Um auf die Prüfung zuzugreifen, geben Sie bitte Ihre persönlichen Daten und Ihre ID ein.',
        'exam.fullname': 'Vollständiger Name *',
        'exam.birthdate': 'Geburtsdatum *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Ihre Tracking-ID (PP ID) *',
        'exam.id_note': 'Diese ID finden Sie auf der Tracking-Seite oder in der Bestätigungsmail.',
        'exam.continue': 'Weiter zur Prüfung',
        'exam.info': 'Die Prüfung dauert etwa 15 Minuten. Sie benötigen mindestens 7/10 im MCQ, damit Ihre Arbeit korrigiert wird.',
        'exam.epreuve_title': 'Qualifikationsprüfung',
        'exam.submit': 'Meine Prüfung einreichen',
        'exam.wait_title': 'Prüfung eingereicht!',
        'exam.wait_message': 'Ihre Arbeit wurde registriert. Ein Korrektor wird sie innerhalb von 1h bis 24h analysieren. Sie erhalten Ihre Note und ein korrigiertes PDF in Ihrem Tracking-Bereich.',
        'exam.wait_thanks': 'Danke für Ihr Vertrauen.',
        'exam.go_suivi': 'Zu meiner Nachverfolgung',
        'footer.badge1': 'APDP Benin Konformität',
        'footer.badge2': 'FIFA-Regulierung',
        'footer.badge3': 'Dreifachprojekt Sport-Studium-Beruf',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.',
        'toast.id_not_found': 'ID nicht gefunden. Bitte überprüfen Sie Ihre Daten.',
        'toast.id_mismatch': 'Die Informationen stimmen nicht mit unseren Aufzeichnungen überein.',
        'toast.status_not_ready': 'Ihre Akte ist nicht bereit für die Prüfung. Nur Sportler mit dem Status "Schriftliche Prüfung" können antreten.',
        'toast.no_active_epreuve': 'Keine aktive Prüfung für diesen Sport. Kontaktieren Sie die Verwaltung.',
        'toast.fill_all_fields': 'Bitte füllen Sie alle Felder aus.',
        'toast.answer_all_qcm': 'Bitte beantworten Sie Frage {num}.',
        'toast.answer_redac': 'Bitte beantworten Sie die Aufsatzfragen (11 und 12).',
        'toast.submit_error': 'Fehler beim Einreichen.',
        'toast.lang_changed': 'Sprache geändert auf {lang}'
    },
    it: {
        'loader.message': 'Caricamento...',
        'nav.home': 'Home',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processo',
        'nav.affiliation': 'Affiliazione',
        'nav.actors': 'Diventa attore',
        'nav.tournaments': 'Tornei',
        'nav.community': 'Comunità',
        'nav.market': 'Mercato',
        'nav.login': 'Accedi',
        'nav.signup': 'Registrati',
        'exam.title': 'Esame di qualificazione',
        'exam.subtitle': 'Per accedere all\'esame, inserisci i tuoi dati personali e il tuo ID.',
        'exam.fullname': 'Nome completo *',
        'exam.birthdate': 'Data di nascita *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Il tuo ID di tracciamento (PP ID) *',
        'exam.id_note': 'Questo ID si trova sulla pagina di tracciamento o nell\'email di conferma.',
        'exam.continue': 'Continua verso l\'esame',
        'exam.info': 'L\'esame dura circa 15 minuti. È necessario ottenere almeno 7/10 al MCQ affinché la tua prova venga corretta.',
        'exam.epreuve_title': 'Esame di qualificazione',
        'exam.submit': 'Invia il mio esame',
        'exam.wait_title': 'Esame inviato!',
        'exam.wait_message': 'La tua prova è stata registrata. Un correttore la analizzerà entro 1h-24h. Riceverai il tuo voto e un PDF corretto nel tuo spazio di tracciamento.',
        'exam.wait_thanks': 'Grazie per la tua fiducia.',
        'exam.go_suivi': 'Vai al mio tracciamento',
        'footer.badge1': 'Conformità APDP Benin',
        'footer.badge2': 'Regolamento FIFA',
        'footer.badge3': 'Triplo Progetto Sport-Studi-Carriera',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.',
        'toast.id_not_found': 'ID non trovato. Verifica i tuoi dati.',
        'toast.id_mismatch': 'Le informazioni non corrispondono ai nostri archivi.',
        'toast.status_not_ready': 'Il tuo dossier non è pronto per l\'esame. Solo gli sportivi con lo stato "Test scritto" possono sostenere l\'esame.',
        'toast.no_active_epreuve': 'Nessun esame attivo per questo sport. Contatta l\'amministrazione.',
        'toast.fill_all_fields': 'Compila tutti i campi.',
        'toast.answer_all_qcm': 'Rispondi alla domanda {num}.',
        'toast.answer_redac': 'Rispondi alle domande a risposta aperta (11 e 12).',
        'toast.submit_error': 'Errore durante l\'invio.',
        'toast.lang_changed': 'Lingua cambiata in {lang}'
    },
    ar: {
        'loader.message': 'جار التحميل...',
        'nav.home': 'الرئيسية',
        'nav.scouting': 'الاستكشاف',
        'nav.process': 'العملية',
        'nav.affiliation': 'الانتماء',
        'nav.actors': 'كن فاعلاً',
        'nav.tournaments': 'بطولات',
        'nav.community': 'المجتمع',
        'nav.market': 'السوق',
        'nav.login': 'تسجيل الدخول',
        'nav.signup': 'التسجيل',
        'exam.title': 'اختبار التأهيل',
        'exam.subtitle': 'للوصول إلى الاختبار، يرجى إدخال معلوماتك الشخصية ومعرفك.',
        'exam.fullname': 'الاسم الكامل *',
        'exam.birthdate': 'تاريخ الميلاد *',
        'exam.sport': 'الرياضة *',
        'exam.id_label': 'معرف التتبع الخاص بك (PP ID) *',
        'exam.id_note': 'يوجد هذا المعرف في صفحة التتبع أو في رسالة التأكيد الإلكترونية.',
        'exam.continue': 'الاستمرار إلى الاختبار',
        'exam.info': 'يستغرق الاختبار حوالي 15 دقيقة. تحتاج إلى 7/10 على الأقل في الأسئلة متعددة الاختيارات حتى يتم تصحيح نسختك.',
        'exam.epreuve_title': 'اختبار التأهيل',
        'exam.submit': 'تقديم اختباري',
        'exam.wait_title': 'تم تقديم الاختبار!',
        'exam.wait_message': 'تم تسجيل نسختك. سيقوم مصحح بتحليلها في غضون ساعة إلى 24 ساعة. ستتلقى درجتك ونسخة PDF مصححة في مساحة التتبع الخاصة بك.',
        'exam.wait_thanks': 'شكرًا لثقتك.',
        'exam.go_suivi': 'الذهاب إلى تتبعي',
        'footer.badge1': 'الامتثال لـ APDP بنين',
        'footer.badge2': 'لوائح الفيفا',
        'footer.badge3': 'مشروع الرياضة والدراسة والمهنة الثلاثي',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.',
        'toast.id_not_found': 'لم يتم العثور على المعرف. تحقق من معلوماتك.',
        'toast.id_mismatch': 'المعلومات لا تتطابق مع سجلاتنا.',
        'toast.status_not_ready': 'ملفك غير جاهز للاختبار. يمكن فقط للرياضيين ذوي الحالة "اختبار كتابي" التقدم للاختبار.',
        'toast.no_active_epreuve': 'لا يوجد اختبار نشط لهذه الرياضة. اتصل بالإدارة.',
        'toast.fill_all_fields': 'يرجى ملء جميع الحقول.',
        'toast.answer_all_qcm': 'يرجى الإجابة على السؤال {num}.',
        'toast.answer_redac': 'يرجى الإجابة على الأسئلة الإنشائية (11 و 12).',
        'toast.submit_error': 'خطأ أثناء التقديم.',
        'toast.lang_changed': 'تم تغيير اللغة إلى {lang}'
    },
    zh: {
        'loader.message': '加载中...',
        'nav.home': '首页',
        'nav.scouting': '球探',
        'nav.process': '流程',
        'nav.affiliation': '隶属',
        'nav.actors': '成为演员',
        'nav.tournaments': '锦标赛',
        'nav.community': '社区',
        'nav.market': '市场',
        'nav.login': '登录',
        'nav.signup': '注册',
        'exam.title': '资格考试',
        'exam.subtitle': '要参加考试，请输入您的个人信息和您的 ID。',
        'exam.fullname': '全名 *',
        'exam.birthdate': '出生日期 *',
        'exam.sport': '运动 *',
        'exam.id_label': '您的追踪 ID (PP ID) *',
        'exam.id_note': '此 ID 在追踪页面或确认电子邮件中。',
        'exam.continue': '继续参加考试',
        'exam.info': '考试大约持续 15 分钟。您需要在 MCQ 中至少获得 7/10 分，您的试卷才会被批改。',
        'exam.epreuve_title': '资格考试',
        'exam.submit': '提交我的考试',
        'exam.wait_title': '考试已提交！',
        'exam.wait_message': '您的试卷已记录。阅卷员将在 1 至 24 小时内进行分析。您将在您的追踪空间中收到成绩和已批改的 PDF。',
        'exam.wait_thanks': '感谢您的信任。',
        'exam.go_suivi': '前往我的追踪',
        'footer.badge1': 'APDP 贝宁合规',
        'footer.badge2': 'FIFA 规则',
        'footer.badge3': '体育-学业-职业三重项目',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa。 版权所有。',
        'toast.id_not_found': '未找到 ID。请检查您的信息。',
        'toast.id_mismatch': '信息与我们的记录不符。',
        'toast.status_not_ready': '您的档案尚未准备好参加考试。只有状态为“笔试”的运动员才能参加。',
        'toast.no_active_epreuve': '该运动没有活跃的考试。联系管理员。',
        'toast.fill_all_fields': '请填写所有字段。',
        'toast.answer_all_qcm': '请回答问题 {num}。',
        'toast.answer_redac': '请回答论述题（11 和 12）。',
        'toast.submit_error': '提交时出错。',
        'toast.lang_changed': '语言已更改为 {lang}'
    },
    ru: {
        'loader.message': 'Загрузка...',
        'nav.home': 'Главная',
        'nav.scouting': 'Скаутинг',
        'nav.process': 'Процесс',
        'nav.affiliation': 'Партнерство',
        'nav.actors': 'Стать актером',
        'nav.tournaments': 'Турниры',
        'nav.community': 'Сообщество',
        'nav.market': 'Рынок',
        'nav.login': 'Войти',
        'nav.signup': 'Регистрация',
        'exam.title': 'Квалификационный экзамен',
        'exam.subtitle': 'Чтобы получить доступ к экзамену, пожалуйста, введите свои личные данные и идентификатор.',
        'exam.fullname': 'Полное имя *',
        'exam.birthdate': 'Дата рождения *',
        'exam.sport': 'Вид спорта *',
        'exam.id_label': 'Ваш идентификатор отслеживания (PP ID) *',
        'exam.id_note': 'Этот идентификатор находится на странице отслеживания или в письме с подтверждением.',
        'exam.continue': 'Перейти к экзамену',
        'exam.info': 'Экзамен длится около 15 минут. Вам нужно набрать не менее 7/10 в MCQ, чтобы ваша работа была проверена.',
        'exam.epreuve_title': 'Квалификационный экзамен',
        'exam.submit': 'Отправить мой экзамен',
        'exam.wait_title': 'Экзамен отправлен!',
        'exam.wait_message': 'Ваша работа зарегистрирована. Проверяющий проанализирует ее в течение от 1 до 24 часов. Вы получите оценку и исправленный PDF в своем пространстве отслеживания.',
        'exam.wait_thanks': 'Спасибо за доверие.',
        'exam.go_suivi': 'Перейти к моему отслеживанию',
        'footer.badge1': 'Соответствие APDP Бенин',
        'footer.badge2': 'Регламент ФИФА',
        'footer.badge3': 'Тройной проект Спорт-Учёба-Карьера',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Все права защищены.',
        'toast.id_not_found': 'Идентификатор не найден. Проверьте свои данные.',
        'toast.id_mismatch': 'Информация не соответствует нашим записям.',
        'toast.status_not_ready': 'Ваше досье не готово к экзамену. Только спортсмены со статусом "Письменный тест" могут сдавать экзамен.',
        'toast.no_active_epreuve': 'Нет активного экзамена по этому виду спорта. Свяжитесь с администрацией.',
        'toast.fill_all_fields': 'Заполните все поля.',
        'toast.answer_all_qcm': 'Ответьте на вопрос {num}.',
        'toast.answer_redac': 'Ответьте на эссе-вопросы (11 и 12).',
        'toast.submit_error': 'Ошибка при отправке.',
        'toast.lang_changed': 'Язык изменен на {lang}'
    },
    ja: {
        'loader.message': '読み込み中...',
        'nav.home': 'ホーム',
        'nav.scouting': 'スカウティング',
        'nav.process': 'プロセス',
        'nav.affiliation': 'アフィリエイト',
        'nav.actors': 'アクターになる',
        'nav.tournaments': 'トーナメント',
        'nav.community': 'コミュニティ',
        'nav.market': 'マーケット',
        'nav.login': 'ログイン',
        'nav.signup': 'サインアップ',
        'exam.title': '資格試験',
        'exam.subtitle': '試験にアクセスするには、個人情報とIDを入力してください。',
        'exam.fullname': '氏名 *',
        'exam.birthdate': '生年月日 *',
        'exam.sport': 'スポーツ *',
        'exam.id_label': '追跡ID (PP ID) *',
        'exam.id_note': 'このIDは追跡ページまたは確認メールにあります。',
        'exam.continue': '試験に進む',
        'exam.info': '試験時間は約15分です。MCQで7/10以上を取ると、解答用紙が採点されます。',
        'exam.epreuve_title': '資格試験',
        'exam.submit': '試験を提出する',
        'exam.wait_title': '試験提出完了！',
        'exam.wait_message': '解答用紙が記録されました。採点者が1時間～24時間以内に分析します。追跡スペースでスコアと修正済みPDFを受け取ります。',
        'exam.wait_thanks': 'ご信頼ありがとうございます。',
        'exam.go_suivi': '追跡を見る',
        'footer.badge1': 'APDP ベナン準拠',
        'footer.badge2': 'FIFA 規則',
        'footer.badge3': 'スポーツ・勉強・職業のトリプルプロジェクト',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. 全著作権所有。',
        'toast.id_not_found': 'IDが見つかりません。情報を確認してください。',
        'toast.id_mismatch': '情報が記録と一致しません。',
        'toast.status_not_ready': 'ファイルは試験の準備ができていません。「筆記試験」ステータスの選手のみ受験できます。',
        'toast.no_active_epreuve': 'このスポーツのアクティブな試験がありません。管理者に連絡してください。',
        'toast.fill_all_fields': 'すべてのフィールドを入力してください。',
        'toast.answer_all_qcm': '質問 {num} に答えてください。',
        'toast.answer_redac': '論述問題（11と12）に答えてください。',
        'toast.submit_error': '送信エラー。',
        'toast.lang_changed': '言語が {lang} に変更されました'
    },
    tr: {
        'loader.message': 'Yükleniyor...',
        'nav.home': 'Ana Sayfa',
        'nav.scouting': 'Scouting',
        'nav.process': 'Süreç',
        'nav.affiliation': 'Bağlılık',
        'nav.actors': 'Oyuncu ol',
        'nav.tournaments': 'Turnuvalar',
        'nav.community': 'Topluluk',
        'nav.market': 'Pazar',
        'nav.login': 'Giriş',
        'nav.signup': 'Kaydol',
        'exam.title': 'Yeterlilik sınavı',
        'exam.subtitle': 'Sınava erişmek için lütfen kişisel bilgilerinizi ve kimliğinizi girin.',
        'exam.fullname': 'Tam adı *',
        'exam.birthdate': 'Doğum tarihi *',
        'exam.sport': 'Spor *',
        'exam.id_label': 'Takip kimliğiniz (PP ID) *',
        'exam.id_note': 'Bu kimlik takip sayfasında veya onay e-postasında bulunur.',
        'exam.continue': 'Sınava devam et',
        'exam.info': 'Sınav yaklaşık 15 dakika sürer. Kopyanızın düzeltilmesi için MCQ\'dan en az 7/10 almanız gerekir.',
        'exam.epreuve_title': 'Yeterlilik sınavı',
        'exam.submit': 'Sınavımı gönder',
        'exam.wait_title': 'Sınav gönderildi!',
        'exam.wait_message': 'Kopyanız kaydedildi. Bir düzeltmen 1 saat ila 24 saat içinde analiz edecek. Notunuzu ve düzeltilmiş PDF\'i takip alanınızda alacaksınız.',
        'exam.wait_thanks': 'Güveniniz için teşekkürler.',
        'exam.go_suivi': 'Takibime git',
        'footer.badge1': 'APDP Benin Uyumluluğu',
        'footer.badge2': 'FIFA Düzenlemeleri',
        'footer.badge3': 'Üçlü Proje Spor-Eğitim-Kariyer',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.',
        'toast.id_not_found': 'Kimlik bulunamadı. Lütfen bilgilerinizi kontrol edin.',
        'toast.id_mismatch': 'Bilgiler kayıtlarımızla eşleşmiyor.',
        'toast.status_not_ready': 'Dosyanız sınava hazır değil. Sadece "Yazılı test" durumundaki sporcular sınava girebilir.',
        'toast.no_active_epreuve': 'Bu spor için aktif sınav yok. Yönetimle iletişime geçin.',
        'toast.fill_all_fields': 'Lütfen tüm alanları doldurun.',
        'toast.answer_all_qcm': 'Lütfen {num}. soruyu cevaplayın.',
        'toast.answer_redac': 'Lütfen kompozisyon sorularını (11 ve 12) cevaplayın.',
        'toast.submit_error': 'Gönderim sırasında hata.',
        'toast.lang_changed': 'Dil {lang} olarak değiştirildi'
    },
    ko: {
        'loader.message': '로딩 중...',
        'nav.home': '홈',
        'nav.scouting': '스카우팅',
        'nav.process': '프로세스',
        'nav.affiliation': '제휴',
        'nav.actors': '배우 되기',
        'nav.tournaments': '토너먼트',
        'nav.community': '커뮤니티',
        'nav.market': '마켓',
        'nav.login': '로그인',
        'nav.signup': '가입',
        'exam.title': '자격 시험',
        'exam.subtitle': '시험에 접근하려면 개인 정보와 ID를 입력하세요.',
        'exam.fullname': '전체 이름 *',
        'exam.birthdate': '생년월일 *',
        'exam.sport': '스포츠 *',
        'exam.id_label': '추적 ID (PP ID) *',
        'exam.id_note': '이 ID는 추적 페이지 또는 확인 이메일에 있습니다.',
        'exam.continue': '시험 계속하기',
        'exam.info': '시험은 약 15분 동안 지속됩니다. MCQ에서 최소 7/10점을 받아야 답안지가 채점됩니다.',
        'exam.epreuve_title': '자격 시험',
        'exam.submit': '내 시험 제출',
        'exam.wait_title': '시험 제출 완료!',
        'exam.wait_message': '답안지가 기록되었습니다. 채점자가 1시간~24시간 이내에 분석할 것입니다. 추적 공간에서 점수와 수정된 PDF를 받게 됩니다.',
        'exam.wait_thanks': '믿어주셔서 감사합니다.',
        'exam.go_suivi': '내 추적 보기',
        'footer.badge1': 'APDP 베냉 준수',
        'footer.badge2': 'FIFA 규정',
        'footer.badge3': '스포츠-공부-직업 삼중 프로젝트',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. 모든 권리 보유.',
        'toast.id_not_found': 'ID를 찾을 수 없습니다. 정보를 확인하세요.',
        'toast.id_mismatch': '정보가 기록과 일치하지 않습니다.',
        'toast.status_not_ready': '파일이 시험 준비가 되지 않았습니다. "필기 시험" 상태의 선수만 응시할 수 있습니다.',
        'toast.no_active_epreuve': '이 스포츠에 활성 시험이 없습니다. 관리자에게 문의하세요.',
        'toast.fill_all_fields': '모든 필드를 입력하세요.',
        'toast.answer_all_qcm': '질문 {num}에 답하세요.',
        'toast.answer_redac': '논술 질문(11번과 12번)에 답하세요.',
        'toast.submit_error': '제출 오류.',
        'toast.lang_changed': '언어가 {lang}(으)로 변경되었습니다'
    },
    hi: {
        'loader.message': 'लोड हो रहा है...',
        'nav.home': 'होम',
        'nav.scouting': 'स्काउटिंग',
        'nav.process': 'प्रक्रिया',
        'nav.affiliation': 'संबद्धता',
        'nav.actors': 'अभिनेता बनें',
        'nav.tournaments': 'टूर्नामेंट',
        'nav.community': 'समुदाय',
        'nav.market': 'बाजार',
        'nav.login': 'लॉग इन',
        'nav.signup': 'साइन अप',
        'exam.title': 'योग्यता परीक्षा',
        'exam.subtitle': 'परीक्षा तक पहुँचने के लिए कृपया अपनी व्यक्तिगत जानकारी और अपना आईडी दर्ज करें।',
        'exam.fullname': 'पूरा नाम *',
        'exam.birthdate': 'जन्म तिथि *',
        'exam.sport': 'खेल *',
        'exam.id_label': 'आपकी ट्रैकिंग आईडी (PP ID) *',
        'exam.id_note': 'यह आईडी ट्रैकिंग पेज या पुष्टिकरण ईमेल में है।',
        'exam.continue': 'परीक्षा जारी रखें',
        'exam.info': 'परीक्षा लगभग 15 मिनट की होती है। आपको MCQ में कम से कम 7/10 अंक लाने होंगे ताकि आपकी कॉपी जाँची जा सके।',
        'exam.epreuve_title': 'योग्यता परीक्षा',
        'exam.submit': 'मेरी परीक्षा जमा करें',
        'exam.wait_title': 'परीक्षा जमा हो गई!',
        'exam.wait_message': 'आपकी कॉपी रिकॉर्ड कर ली गई है। एक परीक्षक 1 घंटे से 24 घंटे के भीतर इसका विश्लेषण करेगा। आपको अपना अंक और सही पीडीएफ आपके ट्रैकिंग स्पेस में मिलेगा।',
        'exam.wait_thanks': 'आपके भरोसे के लिए धन्यवाद।',
        'exam.go_suivi': 'मेरी ट्रैकिंग पर जाएं',
        'footer.badge1': 'APDP बेनिन अनुपालन',
        'footer.badge2': 'फीफा नियम',
        'footer.badge3': 'खेल-अध्ययन-पेशा तिहरा परियोजना',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।',
        'toast.id_not_found': 'आईडी नहीं मिली। कृपया अपनी जानकारी जांचें।',
        'toast.id_mismatch': 'जानकारी हमारे रिकॉर्ड से मेल नहीं खाती।',
        'toast.status_not_ready': 'आपकी फ़ाइल परीक्षा के लिए तैयार नहीं है। केवल "लिखित परीक्षा" स्थिति वाले खिलाड़ी ही परीक्षा दे सकते हैं।',
        'toast.no_active_epreuve': 'इस खेल के लिए कोई सक्रिय परीक्षा नहीं है। प्रशासन से संपर्क करें।',
        'toast.fill_all_fields': 'कृपया सभी फ़ील्ड भरें।',
        'toast.answer_all_qcm': 'कृपया प्रश्न {num} का उत्तर दें।',
        'toast.answer_redac': 'कृपया निबंध प्रश्नों (11 और 12) का उत्तर दें।',
        'toast.submit_error': 'जमा करने में त्रुटि।',
        'toast.lang_changed': 'भाषा बदलकर {lang} कर दी गई'
    },
    nl: {
        'loader.message': 'Laden...',
        'nav.home': 'Home',
        'nav.scouting': 'Scouting',
        'nav.process': 'Proces',
        'nav.affiliation': 'Affiliatie',
        'nav.actors': 'Word een acteur',
        'nav.tournaments': 'Toernooien',
        'nav.community': 'Gemeenschap',
        'nav.market': 'Markt',
        'nav.login': 'Inloggen',
        'nav.signup': 'Inschrijven',
        'exam.title': 'Kwalificatie-examen',
        'exam.subtitle': 'Voer uw persoonlijke gegevens en uw ID in om toegang te krijgen tot het examen.',
        'exam.fullname': 'Volledige naam *',
        'exam.birthdate': 'Geboortedatum *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Uw tracking-ID (PP ID) *',
        'exam.id_note': 'Deze ID staat op de trackingpagina of in de bevestigingsmail.',
        'exam.continue': 'Doorgaan naar examen',
        'exam.info': 'Het examen duurt ongeveer 15 minuten. U heeft minimaal 7/10 op de MCQ nodig om uw kopie te laten corrigeren.',
        'exam.epreuve_title': 'Kwalificatie-examen',
        'exam.submit': 'Mijn examen indienen',
        'exam.wait_title': 'Examen ingediend!',
        'exam.wait_message': 'Uw kopie is geregistreerd. Een corrector zal deze binnen 1 tot 24 uur analyseren. U ontvangt uw cijfer en een gecorrigeerde PDF in uw trackingruimte.',
        'exam.wait_thanks': 'Dank voor uw vertrouwen.',
        'exam.go_suivi': 'Ga naar mijn tracking',
        'footer.badge1': 'APDP Benin Naleving',
        'footer.badge2': 'FIFA Regelgeving',
        'footer.badge3': 'Triple Project Sport-Studie-Beroep',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.',
        'toast.id_not_found': 'ID niet gevonden. Controleer uw gegevens.',
        'toast.id_mismatch': 'De gegevens komen niet overeen met onze administratie.',
        'toast.status_not_ready': 'Uw dossier is niet klaar voor het examen. Alleen sporters met de status "Schriftelijk examen" kunnen deelnemen.',
        'toast.no_active_epreuve': 'Geen actief examen voor deze sport. Neem contact op met de administratie.',
        'toast.fill_all_fields': 'Vul alle velden in.',
        'toast.answer_all_qcm': 'Beantwoord vraag {num}.',
        'toast.answer_redac': 'Beantwoord de essayvragen (11 en 12).',
        'toast.submit_error': 'Fout bij indienen.',
        'toast.lang_changed': 'Taal gewijzigd naar {lang}'
    },
    pl: {
        'loader.message': 'Ładowanie...',
        'nav.home': 'Strona główna',
        'nav.scouting': 'Scouting',
        'nav.process': 'Proces',
        'nav.affiliation': 'Afiliacja',
        'nav.actors': 'Zostań aktorem',
        'nav.tournaments': 'Turnieje',
        'nav.community': 'Społeczność',
        'nav.market': 'Rynek',
        'nav.login': 'Zaloguj',
        'nav.signup': 'Zarejestruj',
        'exam.title': 'Egzamin kwalifikacyjny',
        'exam.subtitle': 'Aby uzyskać dostęp do egzaminu, podaj swoje dane osobowe i identyfikator.',
        'exam.fullname': 'Pełne imię i nazwisko *',
        'exam.birthdate': 'Data urodzenia *',
        'exam.sport': 'Sport *',
        'exam.id_label': 'Twój identyfikator śledzenia (PP ID) *',
        'exam.id_note': 'Ten identyfikator znajduje się na stronie śledzenia lub w wiadomości e-mail z potwierdzeniem.',
        'exam.continue': 'Przejdź do egzaminu',
        'exam.info': 'Egzamin trwa około 15 minut. Aby Twoja praca została poprawiona, musisz uzyskać co najmniej 7/10 w MCQ.',
        'exam.epreuve_title': 'Egzamin kwalifikacyjny',
        'exam.submit': 'Wyślij mój egzamin',
        'exam.wait_title': 'Egzamin wysłany!',
        'exam.wait_message': 'Twoja praca została zarejestrowana. Korektor przeanalizuje ją w ciągu 1-24 godzin. Otrzymasz ocenę i poprawiony plik PDF w swojej przestrzeni śledzenia.',
        'exam.wait_thanks': 'Dziękujemy za zaufanie.',
        'exam.go_suivi': 'Przejdź do mojego śledzenia',
        'footer.badge1': 'Zgodność APDP Benin',
        'footer.badge2': 'Regulacje FIFA',
        'footer.badge3': 'Potrójny Projekt Sport-Nauka-Zawód',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.',
        'toast.id_not_found': 'Nie znaleziono identyfikatora. Sprawdź swoje dane.',
        'toast.id_mismatch': 'Informacje nie są zgodne z naszymi zapisami.',
        'toast.status_not_ready': 'Twoja dokumentacja nie jest gotowa do egzaminu. Tylko sportowcy ze statusem "Test pisemny" mogą przystąpić do egzaminu.',
        'toast.no_active_epreuve': 'Brak aktywnego egzaminu dla tego sportu. Skontaktuj się z administracją.',
        'toast.fill_all_fields': 'Wypełnij wszystkie pola.',
        'toast.answer_all_qcm': 'Odpowiedz na pytanie {num}.',
        'toast.answer_redac': 'Odpowiedz na pytania opisowe (11 i 12).',
        'toast.submit_error': 'Błąd podczas wysyłania.',
        'toast.lang_changed': 'Język zmieniony na {lang}'
    },
    vi: {
        'loader.message': 'Đang tải...',
        'nav.home': 'Trang chủ',
        'nav.scouting': 'Tuyển trạch',
        'nav.process': 'Quy trình',
        'nav.affiliation': 'Liên kết',
        'nav.actors': 'Trở thành diễn viên',
        'nav.tournaments': 'Giải đấu',
        'nav.community': 'Cộng đồng',
        'nav.market': 'Chợ',
        'nav.login': 'Đăng nhập',
        'nav.signup': 'Đăng ký',
        'exam.title': 'Bài kiểm tra trình độ',
        'exam.subtitle': 'Để truy cập bài kiểm tra, vui lòng nhập thông tin cá nhân và ID của bạn.',
        'exam.fullname': 'Họ và tên *',
        'exam.birthdate': 'Ngày sinh *',
        'exam.sport': 'Môn thể thao *',
        'exam.id_label': 'ID theo dõi của bạn (PP ID) *',
        'exam.id_note': 'ID này có trên trang theo dõi hoặc trong email xác nhận.',
        'exam.continue': 'Tiếp tục vào bài thi',
        'exam.info': 'Bài thi kéo dài khoảng 15 phút. Bạn cần đạt ít nhất 7/10 điểm MCQ để bài làm được chấm.',
        'exam.epreuve_title': 'Bài kiểm tra trình độ',
        'exam.submit': 'Nộp bài thi của tôi',
        'exam.wait_title': 'Đã gửi bài thi!',
        'exam.wait_message': 'Bài làm của bạn đã được ghi nhận. Giám khảo sẽ phân tích trong vòng 1 giờ đến 24 giờ. Bạn sẽ nhận được điểm và bản PDF đã chấm trong không gian theo dõi.',
        'exam.wait_thanks': 'Cảm ơn sự tin tưởng của bạn.',
        'exam.go_suivi': 'Đi đến theo dõi của tôi',
        'footer.badge1': 'Tuân thủ APDP Benin',
        'footer.badge2': 'Quy định FIFA',
        'footer.badge3': 'Dự án ba mục Thể thao-Học tập-Nghề nghiệp',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.',
        'toast.id_not_found': 'Không tìm thấy ID. Vui lòng kiểm tra thông tin của bạn.',
        'toast.id_mismatch': 'Thông tin không khớp với hồ sơ của chúng tôi.',
        'toast.status_not_ready': 'Hồ sơ của bạn chưa sẵn sàng cho bài kiểm tra. Chỉ những vận động viên có trạng thái "Bài kiểm tra viết" mới được tham gia.',
        'toast.no_active_epreuve': 'Không có bài kiểm tra nào đang hoạt động cho môn thể thao này. Liên hệ quản trị viên.',
        'toast.fill_all_fields': 'Vui lòng điền đầy đủ các trường.',
        'toast.answer_all_qcm': 'Vui lòng trả lời câu hỏi {num}.',
        'toast.answer_redac': 'Vui lòng trả lời các câu hỏi tự luận (11 và 12).',
        'toast.submit_error': 'Lỗi khi gửi.',
        'toast.lang_changed': 'Ngôn ngữ đã được đổi thành {lang}'
    }
};

// ========== FONCTIONS DE TRADUCTION ==========
let currentLang = localStorage.getItem('hubiLang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
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
    // Mise à jour des options de selects
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
        // Recharger l'épreuve active si on est à l'étape 2
        if (currentEpreuve) {
            renderQuestions(currentEpreuve);
            epreuveSportLabel.textContent = `Sport : ${currentSport} – ${currentEpreuve.titre}`;
        }
    }
}

// Éléments DOM
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const identityForm = document.getElementById('identityForm');
const quizForm = document.getElementById('quizForm');
const questionsContainer = document.getElementById('questionsContainer');
const epreuveSportLabel = document.getElementById('epreuveSportLabel');
const sportSelect = document.getElementById('sportSelect');
const fullNameInput = document.getElementById('fullName');
const birthDateInput = document.getElementById('birthDate');
const ppIdInput = document.getElementById('ppId');

let currentEpreuve = null;
let currentSport = '';
let currentPpId = '';

// Utilitaires
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
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// Vérification de l'identité
async function verifyIdentity(fullName, birthDate, sport, ppId) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_premierpas')
            .select('pp_id, full_name, birth_date, sport, status')
            .eq('pp_id', ppId)
            .single();
        if (error || !data) {
            showToast(t('toast.id_not_found'), 'error');
            return false;
        }
        if (data.full_name !== fullName || data.birth_date !== birthDate || data.sport !== sport) {
            showToast(t('toast.id_mismatch'), 'error');
            return false;
        }
        if (data.status !== 'test_ecrit' && data.status !== 'valide_public') {
            showToast(t('toast.status_not_ready'), 'warning');
            return false;
        }
        return true;
    } catch (err) {
        console.error(err);
        showToast(t('toast.id_not_found'), 'error');
        return false;
    } finally {
        hideLoader();
    }
}

// Chargement de l'épreuve active
async function loadActiveEpreuve(sport) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_epreuves')
            .select('*')
            .eq('sport', sport)
            .eq('active', true)
            .single();
        if (error || !data) {
            showToast(t('toast.no_active_epreuve'), 'error');
            return null;
        }
        return data;
    } catch (err) {
        console.error(err);
        showToast(t('toast.no_active_epreuve'), 'error');
        return null;
    } finally {
        hideLoader();
    }
}

// Affichage des questions
function renderQuestions(epreuve) {
    const questions = epreuve.questions;
    let html = '';
    if (questions.qcm && Array.isArray(questions.qcm)) {
        questions.qcm.forEach((q, idx) => {
            html += `<div class="question"><p>${idx+1}. ${escapeHtml(q.question)}</p>`;
            q.options.forEach((opt, optIdx) => {
                html += `<label><input type="radio" name="q${idx+1}" value="${optIdx}"> ${escapeHtml(opt)}</label><br>`;
            });
            html += `</div>`;
        });
    }
    if (questions.redaction1) {
        html += `<div class="question-redaction">
                    <p>11. ${escapeHtml(questions.redaction1.question)}</p>
                    <p class="instruction">${escapeHtml(questions.redaction1.instruction || '(Rédigez une réponse cohérente de 25 à 150 mots maximum)')}</p>
                    <textarea id="q11" rows="6" placeholder="Votre réponse..." maxlength="1500"></textarea>
                    <small class="word-count" id="q11-count">0 mots</small>
                </div>`;
    }
    if (questions.redaction2) {
        html += `<div class="question-redaction">
                    <p>12. ${escapeHtml(questions.redaction2.question)}</p>
                    <p class="instruction">${escapeHtml(questions.redaction2.instruction || '(Rédigez une réponse de 1500 mots maximum)')}</p>
                    <textarea id="q12" rows="10" placeholder="Votre réponse..." maxlength="15000"></textarea>
                    <small class="word-count" id="q12-count">0 mots</small>
                </div>`;
    }
    questionsContainer.innerHTML = html;
    if (document.getElementById('q11')) {
        document.getElementById('q11').addEventListener('input', function() {
            const words = this.value.trim().split(/\s+/).filter(w => w.length > 0).length;
            document.getElementById('q11-count').textContent = words + ' mots';
        });
    }
    if (document.getElementById('q12')) {
        document.getElementById('q12').addEventListener('input', function() {
            const words = this.value.trim().split(/\s+/).filter(w => w.length > 0).length;
            document.getElementById('q12-count').textContent = words + ' mots';
        });
    }
}

// Soumission de l'examen
async function submitExam() {
    const qcmAnswers = [];
    for (let i = 1; i <= 10; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) {
            qcmAnswers.push(parseInt(selected.value));
        } else {
            showToast(t('toast.answer_all_qcm', { num: i }), 'warning');
            return;
        }
    }
    const reponseQ11 = document.getElementById('q11') ? document.getElementById('q11').value.trim() : '';
    const reponseQ12 = document.getElementById('q12') ? document.getElementById('q12').value.trim() : '';
    if (!reponseQ11 || !reponseQ12) {
        showToast(t('toast.answer_redac'), 'warning');
        return;
    }
    let noteQcm = 0;
    const questions = currentEpreuve.questions.qcm;
    for (let i = 0; i < questions.length; i++) {
        if (qcmAnswers[i] === questions[i].correct) noteQcm++;
    }
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_examens')
            .insert([{
                pp_id: currentPpId,
                epreuve_id: currentEpreuve.id,
                sport: currentSport,
                reponses_qcm: qcmAnswers,
                reponse_q11: reponseQ11,
                reponse_q12: reponseQ12,
                note_qcm: noteQcm,
                statut: 'en_attente',
                date_soumission: new Date().toISOString()
            }]);
        if (error) throw error;
        step1.style.display = 'none';
        step2.style.display = 'none';
        step3.style.display = 'block';
        quizForm.reset();
        // Sauvegarder la soumission dans sessionStorage pour éviter de renvoyer
        sessionStorage.setItem('exam_submitted', currentPpId);
    } catch (err) {
        console.error(err);
        showToast(t('toast.submit_error'), 'error');
    } finally {
        hideLoader();
    }
}

// Étape 1 : formulaire d'identité
identityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = fullNameInput.value.trim();
    const birthDate = birthDateInput.value;
    const sport = sportSelect.value;
    const ppId = ppIdInput.value.trim();
    if (!fullName || !birthDate || !sport || !ppId) {
        showToast(t('toast.fill_all_fields'), 'warning');
        return;
    }
    // Vérifier si l'utilisateur a déjà soumis un examen pour ce PP ID
    const alreadySubmitted = sessionStorage.getItem('exam_submitted') === ppId;
    if (alreadySubmitted) {
        showToast('Vous avez déjà soumis cet examen. Attendez la correction.', 'warning');
        return;
    }
    const isValid = await verifyIdentity(fullName, birthDate, sport, ppId);
    if (!isValid) return;
    const epreuve = await loadActiveEpreuve(sport);
    if (!epreuve) return;
    currentEpreuve = epreuve;
    currentSport = sport;
    currentPpId = ppId;
    renderQuestions(epreuve);
    epreuveSportLabel.textContent = `Sport : ${sport} – ${epreuve.titre}`;
    step1.style.display = 'none';
    step2.style.display = 'block';
});

// Étape 2 : soumission du quiz
quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitExam();
});

// Menu mobile
function initMenuMobile() {
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
}

// Sélecteur de langue
function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
}

// Récupération de l'ID dans l'URL (optionnel)
function checkUrlForId() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        ppIdInput.value = id;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    checkUrlForId();
    step1.style.display = 'block';
    step2.style.display = 'none';
    step3.style.display = 'none';
});
/* FIN : test-ecrit/test-ecrit.js */
