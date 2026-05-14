/* DEBUT : test-pratique/test-pratique.js */
// ========== TEST-PRATIQUE.JS ==========
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
        'test.title': 'Test Pratique',
        'test.subtitle': 'Soumettez une vidéo de votre performance sportive pour évaluation.',
        'test.id_label': 'Votre ID de suivi (PP ID) *',
        'test.video_label': 'Vidéo de performance *',
        'test.upload_click': 'Cliquez pour télécharger (MP4, MOV, AVI, max 50 Mo)',
        'test.submit': 'Soumettre ma vidéo',
        'test.success_title': 'Vidéo soumise avec succès !',
        'test.success_message': 'Votre vidéo est en cours d\'analyse par notre équipe. Vous recevrez une notification dans votre espace de suivi.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_id': 'Veuillez saisir votre ID de suivi.',
        'toast.select_video': 'Veuillez sélectionner une vidéo.',
        'toast.id_not_found': 'ID introuvable. Vérifiez vos informations.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour le test pratique. Seuls les sportifs avec le statut "Test pratique" peuvent soumettre une vidéo.',
        'toast.upload_success': 'Vidéo soumise avec succès !',
        'toast.upload_error': 'Erreur lors de l\'envoi de la vidéo.'
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
        'test.title': 'Practical Test',
        'test.subtitle': 'Submit a video of your sports performance for evaluation.',
        'test.id_label': 'Your tracking ID (PP ID) *',
        'test.video_label': 'Performance video *',
        'test.upload_click': 'Click to upload (MP4, MOV, AVI, max 50 MB)',
        'test.submit': 'Submit my video',
        'test.success_title': 'Video submitted successfully!',
        'test.success_message': 'Your video is being analyzed by our team. You will receive a notification in your tracking space.',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Sport-Studies-Career Project',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.fill_id': 'Please enter your tracking ID.',
        'toast.select_video': 'Please select a video.',
        'toast.id_not_found': 'ID not found. Check your information.',
        'toast.status_not_ready': 'Your file is not ready for the practical test. Only athletes with the "Practical test" status can submit a video.',
        'toast.upload_success': 'Video submitted successfully!',
        'toast.upload_error': 'Error uploading video.'
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
        'test.title': 'Idanwo Iṣe',
        'test.subtitle': 'Fi fidio ti iṣẹ elere rẹ silẹ fun igbelewọn.',
        'test.id_label': 'ID atẹle rẹ (PP ID) *',
        'test.video_label': 'Fidio iṣẹ *',
        'test.upload_click': 'Tẹ lati gbejade (MP4, MOV, AVI, o pọju 50 MB)',
        'test.submit': 'Fi fidio mi silẹ',
        'test.success_title': 'Fidio ti fi silẹ ni aṣeyọri!',
        'test.success_message': 'Fidio rẹ jẹ itupalẹ nipasẹ ẹgbẹ wa. Iwọ yoo gba iwifunni ni aaye atẹle rẹ.',
        'footer.badge1': 'Ifaramọ APDP Benin',
        'footer.badge2': 'Awọn ilana FIFA',
        'footer.badge3': 'Ise agbese Idaraya-Ẹkọ-Meji',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM: RB/ABC/24 A 111814 | IFU: 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.',
        'toast.fill_id': 'Jọwọ tẹ ID atẹle rẹ.',
        'toast.select_video': 'Jọwọ yan fidio kan.',
        'toast.id_not_found': 'A ko ri ID. Ṣayẹwo alaye rẹ.',
        'toast.status_not_ready': 'Faili rẹ ko ṣetan fun idanwo iṣe. Awọn elere pẹlu ipo "Idanwo iṣe" nikan le fi fidio silẹ.',
        'toast.upload_success': 'Fidio ti fi silẹ ni aṣeyọri!',
        'toast.upload_error': 'Aṣiṣe fifi fidio ranṣẹ.'
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
        'test.title': 'Test Pratique',
        'test.subtitle': 'Soumettez une vidéo de votre performance sportive pour évaluation.',
        'test.id_label': 'Votre ID de suivi (PP ID) *',
        'test.video_label': 'Vidéo de performance *',
        'test.upload_click': 'Cliquez pour télécharger (MP4, MOV, AVI, max 50 Mo)',
        'test.submit': 'Soumettre ma vidéo',
        'test.success_title': 'Vidéo soumise avec succès !',
        'test.success_message': 'Votre vidéo est en cours d\'analyse par notre équipe. Vous recevrez une notification dans votre espace de suivi.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_id': 'Veuillez saisir votre ID de suivi.',
        'toast.select_video': 'Veuillez sélectionner une vidéo.',
        'toast.id_not_found': 'ID introuvable. Vérifiez vos informations.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour le test pratique. Seuls les sportifs avec le statut "Test pratique" peuvent soumettre une vidéo.',
        'toast.upload_success': 'Vidéo soumise avec succès !',
        'toast.upload_error': 'Erreur lors de l\'envoi de la vidéo.'
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
        'test.title': 'Test Pratique',
        'test.subtitle': 'Soumettez une vidéo de votre performance sportive pour évaluation.',
        'test.id_label': 'Votre ID de suivi (PP ID) *',
        'test.video_label': 'Vidéo de performance *',
        'test.upload_click': 'Cliquez pour télécharger (MP4, MOV, AVI, max 50 Mo)',
        'test.submit': 'Soumettre ma vidéo',
        'test.success_title': 'Vidéo soumise avec succès !',
        'test.success_message': 'Votre vidéo est en cours d\'analyse par notre équipe. Vous recevrez une notification dans votre espace de suivi.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_id': 'Veuillez saisir votre ID de suivi.',
        'toast.select_video': 'Veuillez sélectionner une vidéo.',
        'toast.id_not_found': 'ID introuvable. Vérifiez vos informations.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour le test pratique. Seuls les sportifs avec le statut "Test pratique" peuvent soumettre une vidéo.',
        'toast.upload_success': 'Vidéo soumise avec succès !',
        'toast.upload_error': 'Erreur lors de l\'envoi de la vidéo.'
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
        'test.title': 'Test Pratique',
        'test.subtitle': 'Soumettez une vidéo de votre performance sportive pour évaluation.',
        'test.id_label': 'Votre ID de suivi (PP ID) *',
        'test.video_label': 'Vidéo de performance *',
        'test.upload_click': 'Cliquez pour télécharger (MP4, MOV, AVI, max 50 Mo)',
        'test.submit': 'Soumettre ma vidéo',
        'test.success_title': 'Vidéo soumise avec succès !',
        'test.success_message': 'Votre vidéo est en cours d\'analyse par notre équipe. Vous recevrez une notification dans votre espace de suivi.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_id': 'Veuillez saisir votre ID de suivi.',
        'toast.select_video': 'Veuillez sélectionner une vidéo.',
        'toast.id_not_found': 'ID introuvable. Vérifiez vos informations.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour le test pratique. Seuls les sportifs avec le statut "Test pratique" peuvent soumettre une vidéo.',
        'toast.upload_success': 'Vidéo soumise avec succès !',
        'toast.upload_error': 'Erreur lors de l\'envoi de la vidéo.'
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
        'test.title': 'Test Pratique',
        'test.subtitle': 'Soumettez une vidéo de votre performance sportive pour évaluation.',
        'test.id_label': 'Votre ID de suivi (PP ID) *',
        'test.video_label': 'Vidéo de performance *',
        'test.upload_click': 'Cliquez pour télécharger (MP4, MOV, AVI, max 50 Mo)',
        'test.submit': 'Soumettre ma vidéo',
        'test.success_title': 'Vidéo soumise avec succès !',
        'test.success_message': 'Votre vidéo est en cours d\'analyse par notre équipe. Vous recevrez une notification dans votre espace de suivi.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_id': 'Veuillez saisir votre ID de suivi.',
        'toast.select_video': 'Veuillez sélectionner une vidéo.',
        'toast.id_not_found': 'ID introuvable. Vérifiez vos informations.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour le test pratique. Seuls les sportifs avec le statut "Test pratique" peuvent soumettre une vidéo.',
        'toast.upload_success': 'Vidéo soumise avec succès !',
        'toast.upload_error': 'Erreur lors de l\'envoi de la vidéo.'
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
        'test.title': 'Test Pratique',
        'test.subtitle': 'Soumettez une vidéo de votre performance sportive pour évaluation.',
        'test.id_label': 'Votre ID de suivi (PP ID) *',
        'test.video_label': 'Vidéo de performance *',
        'test.upload_click': 'Cliquez pour télécharger (MP4, MOV, AVI, max 50 Mo)',
        'test.submit': 'Soumettre ma vidéo',
        'test.success_title': 'Vidéo soumise avec succès !',
        'test.success_message': 'Votre vidéo est en cours d\'analyse par notre équipe. Vous recevrez une notification dans votre espace de suivi.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_id': 'Veuillez saisir votre ID de suivi.',
        'toast.select_video': 'Veuillez sélectionner une vidéo.',
        'toast.id_not_found': 'ID introuvable. Vérifiez vos informations.',
        'toast.status_not_ready': 'Votre dossier n\'est pas prêt pour le test pratique. Seuls les sportifs avec le statut "Test pratique" peuvent soumettre une vidéo.',
        'toast.upload_success': 'Vidéo soumise avec succès !',
        'toast.upload_error': 'Erreur lors de l\'envoi de la vidéo.'
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
        'test.title': 'Jarrabawar Aiki',
        'test.subtitle': 'Aika bidiyon aikin wasan ku don tantancewa.',
        'test.id_label': 'ID ɗin bibiyar ku (PP ID) *',
        'test.video_label': 'Bidiyon aiki *',
        'test.upload_click': 'Danna don ɗorawa (MP4, MOV, AVI, max 50 MB)',
        'test.submit': 'Aika bidiyo na',
        'test.success_title': 'An aika bidiyo cikin nasara!',
        'test.success_message': 'Bidiyon ku yana kan tantancewa daga ƙungiyarmu. Za ku sami sanarwa a sararin bibiyar ku.',
        'footer.badge1': 'Amincewa APDP Benin',
        'footer.badge2': 'Dokokin FIFA',
        'footer.badge3': 'Tsarin Wasanni-Ilimi-Aiki Uku',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Duk haƙƙoƙin mallaka.',
        'toast.fill_id': 'Shigar da ID ɗin bibiyar ku.',
        'toast.select_video': 'Zaɓi bidiyo.',
        'toast.id_not_found': 'Ba a sami ID ba. Bincika bayanin ku.',
        'toast.status_not_ready': 'Fayil ɗin ku bai shirya don jarrabawar aiki ba. Yan wasa masu matsayin "Jarrabawar aiki" ne kawai zasu iya aika bidiyo.',
        'toast.upload_success': 'An aika bidiyo cikin nasara!',
        'toast.upload_error': 'Kuskuren aika bidiyo.'
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
        'test.title': 'Jaribio la Vitendo',
        'test.subtitle': 'Tuma video ya utendaji wako wa michezo kwa tathmini.',
        'test.id_label': 'Kitambulisho chako cha ufuatiliaji (PP ID) *',
        'test.video_label': 'Video ya utendaji *',
        'test.upload_click': 'Bonyeza kupakia (MP4, MOV, AVI, upeo wa MB 50)',
        'test.submit': 'Tuma video yangu',
        'test.success_title': 'Video imetumwa kwa mafanikio!',
        'test.success_message': 'Video yako inachambuliwa na timu yetu. Utapokea arifa katika nafasi yako ya ufuatiliaji.',
        'footer.badge1': 'Uzingatiaji APDP Benin',
        'footer.badge2': 'Kanuni za FIFA',
        'footer.badge3': 'Mradi wa Michezo-Masomo-Kazi Mara Tatu',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Haki zote zimehifadhiwa.',
        'toast.fill_id': 'Tafadhali ingiza kitambulisho chako cha ufuatiliaji.',
        'toast.select_video': 'Tafadhali chagua video.',
        'toast.id_not_found': 'Kitambulisho hakipatikani. Angalia maelezo yako.',
        'toast.status_not_ready': 'Faili yako haiko tayari kwa jaribio la vitendo. Wanariadha wenye hadhi ya "Jaribio la vitendo" pekee ndio wanaweza kutuma video.',
        'toast.upload_success': 'Video imetumwa kwa mafanikio!',
        'toast.upload_error': 'Hitilafu katika kutuma video.'
    },
    es: {
        'loader.message': 'Cargando...',
        'nav.home': 'Inicio',
        'nav.scouting': 'Scouting',
        'nav.process': 'Proceso',
        'nav.affiliation': 'Afiliación',
        'nav.actors': 'Hazte actor',
        'nav.tournaments': 'Torneos',
        'nav.community': 'Comunidad',
        'nav.market': 'Mercado',
        'nav.login': 'Iniciar sesión',
        'nav.signup': 'Registrarse',
        'test.title': 'Prueba Práctica',
        'test.subtitle': 'Envíe un video de su rendimiento deportivo para evaluación.',
        'test.id_label': 'Su ID de seguimiento (PP ID) *',
        'test.video_label': 'Video de rendimiento *',
        'test.upload_click': 'Haga clic para cargar (MP4, MOV, AVI, máx. 50 MB)',
        'test.submit': 'Enviar mi video',
        'test.success_title': '¡Video enviado con éxito!',
        'test.success_message': 'Su video está siendo analizado por nuestro equipo. Recibirá una notificación en su espacio de seguimiento.',
        'footer.badge1': 'Conformidad APDP Benín',
        'footer.badge2': 'Reglamento FIFA',
        'footer.badge3': 'Triple Proyecto Deporte-Estudios-Carrera',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.',
        'toast.fill_id': 'Por favor ingrese su ID de seguimiento.',
        'toast.select_video': 'Por favor seleccione un video.',
        'toast.id_not_found': 'ID no encontrado. Verifique su información.',
        'toast.status_not_ready': 'Su expediente no está listo para la prueba práctica. Solo los atletas con el estado "Prueba práctica" pueden enviar un video.',
        'toast.upload_success': '¡Video enviado con éxito!',
        'toast.upload_error': 'Error al enviar el video.'
    },
    pt: {
        'loader.message': 'Carregando...',
        'nav.home': 'Início',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processo',
        'nav.affiliation': 'Afiliação',
        'nav.actors': 'Torne-se ator',
        'nav.tournaments': 'Torneios',
        'nav.community': 'Comunidade',
        'nav.market': 'Mercado',
        'nav.login': 'Entrar',
        'nav.signup': 'Inscrever-se',
        'test.title': 'Teste Prático',
        'test.subtitle': 'Envie um vídeo do seu desempenho esportivo para avaliação.',
        'test.id_label': 'Seu ID de acompanhamento (PP ID) *',
        'test.video_label': 'Vídeo de desempenho *',
        'test.upload_click': 'Clique para enviar (MP4, MOV, AVI, máx. 50 MB)',
        'test.submit': 'Enviar meu vídeo',
        'test.success_title': 'Vídeo enviado com sucesso!',
        'test.success_message': 'Seu vídeo está sendo analisado pela nossa equipe. Receberá uma notificação no seu espaço de acompanhamento.',
        'footer.badge1': 'Conformidade APDP Benim',
        'footer.badge2': 'Regulamento FIFA',
        'footer.badge3': 'Triplo Projeto Esporte-Estudos-Carreira',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.',
        'toast.fill_id': 'Por favor, insira o seu ID de acompanhamento.',
        'toast.select_video': 'Por favor, selecione um vídeo.',
        'toast.id_not_found': 'ID não encontrado. Verifique as suas informações.',
        'toast.status_not_ready': 'O seu processo não está pronto para o teste prático. Apenas atletas com o estado "Teste prático" podem enviar um vídeo.',
        'toast.upload_success': 'Vídeo enviado com sucesso!',
        'toast.upload_error': 'Erro ao enviar o vídeo.'
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
        'test.title': 'Praktische Prüfung',
        'test.subtitle': 'Laden Sie ein Video Ihrer sportlichen Leistung zur Bewertung hoch.',
        'test.id_label': 'Ihre Tracking-ID (PP ID) *',
        'test.video_label': 'Leistungsvideo *',
        'test.upload_click': 'Klicken Sie zum Hochladen (MP4, MOV, AVI, max. 50 MB)',
        'test.submit': 'Mein Video einreichen',
        'test.success_title': 'Video erfolgreich eingereicht!',
        'test.success_message': 'Ihr Video wird von unserem Team analysiert. Sie erhalten eine Benachrichtigung in Ihrem Tracking-Bereich.',
        'footer.badge1': 'APDP Benin Konformität',
        'footer.badge2': 'FIFA-Regulierung',
        'footer.badge3': 'Dreifachprojekt Sport-Studium-Beruf',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.',
        'toast.fill_id': 'Bitte geben Sie Ihre Tracking-ID ein.',
        'toast.select_video': 'Bitte wählen Sie ein Video aus.',
        'toast.id_not_found': 'ID nicht gefunden. Überprüfen Sie Ihre Daten.',
        'toast.status_not_ready': 'Ihre Akte ist nicht bereit für die praktische Prüfung. Nur Sportler mit dem Status "Praktische Prüfung" können ein Video einreichen.',
        'toast.upload_success': 'Video erfolgreich eingereicht!',
        'toast.upload_error': 'Fehler beim Hochladen des Videos.'
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
        'test.title': 'Test Pratico',
        'test.subtitle': 'Carica un video della tua performance sportiva per la valutazione.',
        'test.id_label': 'Il tuo ID di tracciamento (PP ID) *',
        'test.video_label': 'Video della performance *',
        'test.upload_click': 'Clicca per caricare (MP4, MOV, AVI, max 50 MB)',
        'test.submit': 'Invia il mio video',
        'test.success_title': 'Video inviato con successo!',
        'test.success_message': 'Il tuo video è in fase di analisi da parte del nostro team. Riceverai una notifica nel tuo spazio di tracciamento.',
        'footer.badge1': 'Conformità APDP Benin',
        'footer.badge2': 'Regolamento FIFA',
        'footer.badge3': 'Triplo Progetto Sport-Studi-Carriera',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.',
        'toast.fill_id': 'Inserisci il tuo ID di tracciamento.',
        'toast.select_video': 'Seleziona un video.',
        'toast.id_not_found': 'ID non trovato. Verifica le tue informazioni.',
        'toast.status_not_ready': 'Il tuo dossier non è pronto per il test pratico. Solo gli atleti con lo stato "Test pratico" possono inviare un video.',
        'toast.upload_success': 'Video inviato con successo!',
        'toast.upload_error': 'Errore durante l\'invio del video.'
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
        'test.title': 'اختبار عملي',
        'test.subtitle': 'أرسل فيديو لأدائك الرياضي للتقييم.',
        'test.id_label': 'معرف التتبع الخاص بك (PP ID) *',
        'test.video_label': 'فيديو الأداء *',
        'test.upload_click': 'انقر للتحميل (MP4، MOV، AVI، الحد الأقصى 50 ميغابايت)',
        'test.submit': 'إرسال الفيديو الخاص بي',
        'test.success_title': 'تم إرسال الفيديو بنجاح!',
        'test.success_message': 'يتم تحليل الفيديو الخاص بك من قبل فريقنا. ستتلقى إشعارًا في مساحة التتبع الخاصة بك.',
        'footer.badge1': 'الامتثال لـ APDP بنين',
        'footer.badge2': 'لوائح الفيفا',
        'footer.badge3': 'مشروع الرياضة والدراسة والمهنة الثلاثي',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.',
        'toast.fill_id': 'يرجى إدخال معرف التتبع الخاص بك.',
        'toast.select_video': 'يرجى اختيار فيديو.',
        'toast.id_not_found': 'المعرف غير موجود. تحقق من معلوماتك.',
        'toast.status_not_ready': 'ملفك غير جاهز للاختبار العملي. يمكن فقط للرياضيين ذوي الحالة "اختبار عملي" إرسال فيديو.',
        'toast.upload_success': 'تم إرسال الفيديو بنجاح!',
        'toast.upload_error': 'خطأ أثناء إرسال الفيديو.'
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
        'test.title': '实践测试',
        'test.subtitle': '提交您的运动表现视频以供评估。',
        'test.id_label': '您的追踪 ID (PP ID) *',
        'test.video_label': '表现视频 *',
        'test.upload_click': '点击上传（MP4、MOV、AVI，最大 50 MB）',
        'test.submit': '提交我的视频',
        'test.success_title': '视频提交成功！',
        'test.success_message': '您的视频正在由我们的团队进行分析。您将在追踪空间中收到通知。',
        'footer.badge1': 'APDP 贝宁合规',
        'footer.badge2': 'FIFA 规则',
        'footer.badge3': '体育-学业-职业三重项目',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa。 版权所有。',
        'toast.fill_id': '请输入您的追踪 ID。',
        'toast.select_video': '请选择一个视频。',
        'toast.id_not_found': '未找到 ID。请检查您的信息。',
        'toast.status_not_ready': '您的档案尚未准备好进行实践测试。只有状态为“实践测试”的运动员才能提交视频。',
        'toast.upload_success': '视频提交成功！',
        'toast.upload_error': '上传视频时出错。'
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
        'test.title': 'Практический тест',
        'test.subtitle': 'Загрузите видео вашего спортивного выступления для оценки.',
        'test.id_label': 'Ваш идентификатор отслеживания (PP ID) *',
        'test.video_label': 'Видео выступления *',
        'test.upload_click': 'Нажмите, чтобы загрузить (MP4, MOV, AVI, макс. 50 МБ)',
        'test.submit': 'Отправить мое видео',
        'test.success_title': 'Видео успешно отправлено!',
        'test.success_message': 'Ваше видео анализируется нашей командой. Вы получите уведомление в своем пространстве отслеживания.',
        'footer.badge1': 'Соответствие APDP Бенин',
        'footer.badge2': 'Регламент ФИФА',
        'footer.badge3': 'Тройной проект Спорт-Учёба-Карьера',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Все права защищены.',
        'toast.fill_id': 'Пожалуйста, введите ваш идентификатор отслеживания.',
        'toast.select_video': 'Пожалуйста, выберите видео.',
        'toast.id_not_found': 'Идентификатор не найден. Проверьте свои данные.',
        'toast.status_not_ready': 'Ваше досье не готово к практическому тесту. Только спортсмены со статусом "Практический тест" могут загружать видео.',
        'toast.upload_success': 'Видео успешно отправлено!',
        'toast.upload_error': 'Ошибка при загрузке видео.'
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
        'test.title': '実技テスト',
        'test.subtitle': '評価のためにスポーツパフォーマンスのビデオを提出してください。',
        'test.id_label': '追跡ID (PP ID) *',
        'test.video_label': 'パフォーマンスビデオ *',
        'test.upload_click': 'クリックしてアップロード (MP4, MOV, AVI, 最大50MB)',
        'test.submit': 'ビデオを提出する',
        'test.success_title': 'ビデオが正常に送信されました！',
        'test.success_message': 'あなたのビデオはチームによって分析されています。追跡スペースで通知が届きます。',
        'footer.badge1': 'APDP ベナン準拠',
        'footer.badge2': 'FIFA 規則',
        'footer.badge3': 'スポーツ・勉強・職業のトリプルプロジェクト',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. 全著作権所有。',
        'toast.fill_id': '追跡IDを入力してください。',
        'toast.select_video': 'ビデオを選択してください。',
        'toast.id_not_found': 'IDが見つかりません。情報を確認してください。',
        'toast.status_not_ready': 'ファイルは実技テストの準備ができていません。「実技テスト」ステータスの選手のみビデオを提出できます。',
        'toast.upload_success': 'ビデオが正常に送信されました！',
        'toast.upload_error': 'ビデオのアップロード中にエラーが発生しました。'
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
        'test.title': 'Uygulamalı Test',
        'test.subtitle': 'Değerlendirme için spor performansınızın videosunu gönderin.',
        'test.id_label': 'Takip kimliğiniz (PP ID) *',
        'test.video_label': 'Performans videosu *',
        'test.upload_click': 'Yüklemek için tıklayın (MP4, MOV, AVI, maks. 50 MB)',
        'test.submit': 'Videomu gönder',
        'test.success_title': 'Video başarıyla gönderildi!',
        'test.success_message': 'Videonuz ekibimiz tarafından inceleniyor. Takip alanınızda bir bildirim alacaksınız.',
        'footer.badge1': 'APDP Benin Uyumluluğu',
        'footer.badge2': 'FIFA Düzenlemeleri',
        'footer.badge3': 'Üçlü Proje Spor-Eğitim-Kariyer',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.',
        'toast.fill_id': 'Lütfen takip kimliğinizi girin.',
        'toast.select_video': 'Lütfen bir video seçin.',
        'toast.id_not_found': 'Kimlik bulunamadı. Bilgilerinizi kontrol edin.',
        'toast.status_not_ready': 'Dosyanız uygulamalı test için hazır değil. Sadece "Uygulamalı test" durumundaki sporcular video gönderebilir.',
        'toast.upload_success': 'Video başarıyla gönderildi!',
        'toast.upload_error': 'Video gönderilirken hata oluştu.'
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
        'test.title': '실기 테스트',
        'test.subtitle': '평가를 위해 스포츠 경기 영상을 제출하세요.',
        'test.id_label': '추적 ID (PP ID) *',
        'test.video_label': '경기 영상 *',
        'test.upload_click': '클릭하여 업로드 (MP4, MOV, AVI, 최대 50MB)',
        'test.submit': '내 영상 제출',
        'test.success_title': '영상이 성공적으로 제출되었습니다!',
        'test.success_message': '영상이 우리 팀에 의해 분석 중입니다. 추적 공간에서 알림을 받게 됩니다.',
        'footer.badge1': 'APDP 베냉 준수',
        'footer.badge2': 'FIFA 규정',
        'footer.badge3': '스포츠-공부-직업 삼중 프로젝트',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. 모든 권리 보유.',
        'toast.fill_id': '추적 ID를 입력하세요.',
        'toast.select_video': '영상을 선택하세요.',
        'toast.id_not_found': 'ID를 찾을 수 없습니다. 정보를 확인하세요.',
        'toast.status_not_ready': '파일이 실기 테스트 준비가 되지 않았습니다. "실기 테스트" 상태의 선수만 영상을 제출할 수 있습니다.',
        'toast.upload_success': '영상이 성공적으로 제출되었습니다!',
        'toast.upload_error': '영상 업로드 중 오류가 발생했습니다.'
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
        'test.title': 'प्रायोगिक परीक्षण',
        'test.subtitle': 'मूल्यांकन के लिए अपने खेल प्रदर्शन का वीडियो सबमिट करें।',
        'test.id_label': 'आपकी ट्रैकिंग आईडी (PP ID) *',
        'test.video_label': 'प्रदर्शन वीडियो *',
        'test.upload_click': 'अपलोड करने के लिए क्लिक करें (MP4, MOV, AVI, अधिकतम 50 MB)',
        'test.submit': 'मेरा वीडियो सबमिट करें',
        'test.success_title': 'वीडियो सफलतापूर्वक सबमिट हो गया!',
        'test.success_message': 'हमारी टीम द्वारा आपके वीडियो का विश्लेषण किया जा रहा है। आपको अपने ट्रैकिंग स्पेस में एक सूचना प्राप्त होगी।',
        'footer.badge1': 'APDP बेनिन अनुपालन',
        'footer.badge2': 'फीफा नियम',
        'footer.badge3': 'खेल-अध्ययन-पेशा तिहरा परियोजना',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।',
        'toast.fill_id': 'कृपया अपनी ट्रैकिंग आईडी दर्ज करें।',
        'toast.select_video': 'कृपया एक वीडियो चुनें।',
        'toast.id_not_found': 'आईडी नहीं मिली। अपनी जानकारी जांचें।',
        'toast.status_not_ready': 'आपकी फ़ाइल प्रायोगिक परीक्षण के लिए तैयार नहीं है। केवल "प्रायोगिक परीक्षण" स्थिति वाले खिलाड़ी ही वीडियो सबमिट कर सकते हैं।',
        'toast.upload_success': 'वीडियो सफलतापूर्वक सबमिट हो गया!',
        'toast.upload_error': 'वीडियो अपलोड करने में त्रुटि।'
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
        'test.title': 'Praktijktest',
        'test.subtitle': 'Upload een video van uw sportprestatie ter beoordeling.',
        'test.id_label': 'Uw tracking-ID (PP ID) *',
        'test.video_label': 'Prestatievideo *',
        'test.upload_click': 'Klik om te uploaden (MP4, MOV, AVI, max. 50 MB)',
        'test.submit': 'Mijn video indienen',
        'test.success_title': 'Video succesvol ingediend!',
        'test.success_message': 'Uw video wordt geanalyseerd door ons team. U ontvangt een melding in uw trackingruimte.',
        'footer.badge1': 'APDP Benin Naleving',
        'footer.badge2': 'FIFA Regelgeving',
        'footer.badge3': 'Triple Project Sport-Studie-Beroep',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.',
        'toast.fill_id': 'Voer uw tracking-ID in.',
        'toast.select_video': 'Selecteer een video.',
        'toast.id_not_found': 'ID niet gevonden. Controleer uw gegevens.',
        'toast.status_not_ready': 'Uw dossier is niet klaar voor de praktijktest. Alleen sporters met de status "Praktijktest" kunnen een video indienen.',
        'toast.upload_success': 'Video succesvol ingediend!',
        'toast.upload_error': 'Fout bij het uploaden van de video.'
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
        'test.title': 'Test praktyczny',
        'test.subtitle': 'Prześlij film ze swojego występu sportowego do oceny.',
        'test.id_label': 'Twój identyfikator śledzenia (PP ID) *',
        'test.video_label': 'Film z występu *',
        'test.upload_click': 'Kliknij, aby przesłać (MP4, MOV, AVI, maks. 50 MB)',
        'test.submit': 'Prześlij mój film',
        'test.success_title': 'Film został pomyślnie przesłany!',
        'test.success_message': 'Twój film jest analizowany przez nasz zespół. Otrzymasz powiadomienie w swojej przestrzeni śledzenia.',
        'footer.badge1': 'Zgodność APDP Benin',
        'footer.badge2': 'Regulacje FIFA',
        'footer.badge3': 'Potrójny Projekt Sport-Nauka-Zawód',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.',
        'toast.fill_id': 'Wprowadź swój identyfikator śledzenia.',
        'toast.select_video': 'Wybierz film.',
        'toast.id_not_found': 'Nie znaleziono identyfikatora. Sprawdź swoje dane.',
        'toast.status_not_ready': 'Twoja dokumentacja nie jest gotowa do testu praktycznego. Tylko sportowcy ze statusem "Test praktyczny" mogą przesyłać filmy.',
        'toast.upload_success': 'Film został pomyślnie przesłany!',
        'toast.upload_error': 'Błąd podczas przesyłania filmu.'
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
        'test.title': 'Kiểm tra thực hành',
        'test.subtitle': 'Gửi video biểu diễn thể thao của bạn để đánh giá.',
        'test.id_label': 'ID theo dõi của bạn (PP ID) *',
        'test.video_label': 'Video biểu diễn *',
        'test.upload_click': 'Nhấp để tải lên (MP4, MOV, AVI, tối đa 50 MB)',
        'test.submit': 'Gửi video của tôi',
        'test.success_title': 'Đã gửi video thành công!',
        'test.success_message': 'Video của bạn đang được đội ngũ của chúng tôi phân tích. Bạn sẽ nhận được thông báo trong không gian theo dõi.',
        'footer.badge1': 'Tuân thủ APDP Benin',
        'footer.badge2': 'Quy định FIFA',
        'footer.badge3': 'Dự án ba mục Thể thao-Học tập-Nghề nghiệp',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.',
        'toast.fill_id': 'Vui lòng nhập ID theo dõi của bạn.',
        'toast.select_video': 'Vui lòng chọn một video.',
        'toast.id_not_found': 'Không tìm thấy ID. Kiểm tra thông tin của bạn.',
        'toast.status_not_ready': 'Hồ sơ của bạn chưa sẵn sàng cho bài kiểm tra thực hành. Chỉ những vận động viên có trạng thái "Kiểm tra thực hành" mới có thể gửi video.',
        'toast.upload_success': 'Đã gửi video thành công!',
        'toast.upload_error': 'Lỗi khi tải video lên.'
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
    }
}

// ========== UTILITAIRES ==========
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

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

// ========== VÉRIFICATION & UPLOAD ==========
async function verifyPratiqueId(ppId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_premierpas')
            .select('pp_id, status')
            .eq('pp_id', ppId)
            .single();
        if (error || !data) {
            showToast(t('toast.id_not_found'), 'error');
            return false;
        }
        if (data.status !== 'test_pratique' && data.status !== 'valide_public') {
            showToast(t('toast.status_not_ready'), 'warning');
            return false;
        }
        return true;
    } catch (err) {
        console.error(err);
        showToast(t('toast.id_not_found'), 'error');
        return false;
    }
}

async function uploadVideo(file, ppId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${ppId}_${Date.now()}.${fileExt}`;
    const bucket = 'test_pratique_videos';

    const { error } = await supabasePublic.storage.from(bucket).upload(fileName, file);
    if (error) throw error;

    const { data: urlData } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
}

// ========== GESTION DU FORMULAIRE ==========
document.getElementById('testPratiqueForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ppId = document.getElementById('ppId').value.trim();
    const videoFile = document.getElementById('videoFile').files[0];

    if (!ppId) {
        showToast(t('toast.fill_id'), 'warning');
        return;
    }
    if (!videoFile) {
        showToast(t('toast.select_video'), 'warning');
        return;
    }

    showLoader();
    try {
        // Vérifier l'ID et le statut
        const valid = await verifyPratiqueId(ppId);
        if (!valid) return;

        // Uploader la vidéo
        const videoUrl = await uploadVideo(videoFile, ppId);

        // Enregistrer l'analyse dans la base
        const { error } = await supabasePublic
            .from('public_analyses_videos')
            .insert([{
                pp_id: ppId,
                video_url: videoUrl,
                statut: 'en_attente',
                date_soumission: new Date().toISOString()
            }]);

        if (error) throw error;

        // Afficher le succès
        document.getElementById('testPratiqueForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        showToast(t('toast.upload_success'), 'success');
    } catch (err) {
        console.error(err);
        showToast(t('toast.upload_error'), 'error');
    } finally {
        hideLoader();
    }
});

// ========== MENU MOBILE & LANGUE ==========
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

function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
});
/* FIN : test-pratique/test-pratique.js */