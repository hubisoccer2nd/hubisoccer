// ========== ACTEURS.JS - VERSION FINALE COMPLÈTE ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : TRADUCTIONS (24 LANGUES) ==========
const translations = {
    // Français
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Anglais
    en: {
        'loader.message': 'Loading...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'Hub Community',
        'scouting': 'Scouting',
        'processus': 'Process',
        'affiliation': 'Affiliation',
        'premier_pas': 'First step',
        'acteurs': 'Become an actor',
        'artiste': 'Become an artist',
        'tournoi_public': 'Public Tournament',
        'esp': 'Learn more',
        'connexion': 'Login',
        'inscrire': 'Sign up',
        'acteur.header.title': 'Become',
        'acteur.header.highlight': 'Actor',
        'acteur.header.subtitle': 'Support talents and contribute to football development.',
        'acteur.filter.type': 'All needs',
        'acteur.filter.sport': 'All sports',
        'acteur.filter.region': 'All regions',
        'acteur.filter.search': 'Search...',
        'acteur.filter.apply': 'Filter',
        'acteur.sportifs.title': 'Athletes to support',
        'acteur.dons.title': 'Donation appeals',
        'acteur.devenir.title': 'Become an actor',
        'acteur.temoignages.title': 'They sponsored',
        'acteur.modal.title': 'Become an actor',
        'acteur.modal.fullname': 'Full name *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Phone *',
        'acteur.modal.justificatif': 'Proof (CV, diploma, license…) *',
        'acteur.modal.upload_click': 'Click to upload (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Submit my application',
        'acteur.contact.title': 'Contact',
        'acteur.contact.name': 'Your name',
        'acteur.contact.email': 'Your email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Send',
        'acteur.success.title': 'Registration sent!',
        'acteur.success.message': 'Your request has been recorded.',
        'acteur.success.id_label': 'Your unique identifier:',
        'acteur.success.copy': 'Copy',
        'acteur.success.note': 'Keep this identifier to track your request.',
        'acteur.success.link': 'Access tracking',
        'acteur.success.close': 'Close',
        'footer_conformite': 'APDP Benin Compliance',
        'footer_reglementation': 'FIFA Regulations',
        'footer_double_projet': 'Triple Sport-Studies-Career Project',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.error_load_sportifs': 'Error loading athletes',
        'toast.error_load_dons': 'Error loading donation appeals',
        'toast.error_load_temoignages': 'Error loading testimonials',
        'toast.fill_fields': 'Please fill in all required fields.',
        'toast.invalid_email': 'Invalid email',
        'toast.message_sent': 'Message sent successfully!',
        'toast.error_send': 'Error sending message',
        'toast.upload_error': 'Upload error: {error}',
        'toast.inscription_error': 'Registration error: {error}',
        'toast.copy_error': 'Copy error',
        'toast.copy_success': 'Copied!',
        'toast.file_selected': 'File selected: {filename}',
        'empty.sportifs': 'No athlete found.',
        'empty.dons': 'No donation appeal found.',
        'empty.temoignages': 'No testimonial yet.'
    },
    // Yoruba
    yo: {
        'loader.message': 'Nlọ...',
        'hub_market': 'HUBISOCCER ỌJA',
        'hub_community': 'Agbegbe Hub',
        'scouting': 'Wiwa',
        'processus': 'Ilana',
        'affiliation': 'Ifọwọsi',
        'premier_pas': 'Igbese Akọkọ',
        'acteurs': 'Di Oṣere',
        'artiste': 'Di Oṣere',
        'tournoi_public': 'Idije Gbogbo eniyan',
        'esp': 'Kọ Ẹkọ Siwaju',
        'connexion': 'Wo ile',
        'inscrire': 'Forukọsilẹ',
        'acteur.header.title': 'Di',
        'acteur.header.highlight': 'Oṣere',
        'acteur.header.subtitle': 'Ṣe atilẹyin awọn talenti ki o si ṣe alabapin si idagbasoke bọọlu.',
        'acteur.filter.type': 'Gbogbo awọn aini',
        'acteur.filter.sport': 'Gbogbo awọn ere idaraya',
        'acteur.filter.region': 'Gbogbo awọn agbegbe',
        'acteur.filter.search': 'Wa...',
        'acteur.filter.apply': 'Sọ',
        'acteur.sportifs.title': 'Awọn elere idaraya lati ṣe atilẹyin',
        'acteur.dons.title': 'Awọn ẹbẹ fun ẹbun',
        'acteur.devenir.title': 'Di oṣere',
        'acteur.temoignages.title': 'Wọn ti ṣe onigbọwọ',
        'acteur.modal.title': 'Di oṣere',
        'acteur.modal.fullname': 'Orukọ kikun *',
        'acteur.modal.email': 'Imeeli *',
        'acteur.modal.phone': 'Foonu *',
        'acteur.modal.justificatif': 'Ẹri (CV, iwe-ẹri, iwe-aṣẹ…) *',
        'acteur.modal.upload_click': 'Tẹ lati gbejade (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Fi ẹdun mi silẹ',
        'acteur.contact.title': 'Kan si',
        'acteur.contact.name': 'Orukọ rẹ',
        'acteur.contact.email': 'Imeeli rẹ',
        'acteur.contact.message': 'Ifiranṣẹ',
        'acteur.contact.send': 'Fi ranṣẹ',
        'acteur.success.title': 'Iforukọsilẹ ti firanṣẹ!',
        'acteur.success.message': 'Ibeere rẹ ti gba wọle.',
        'acteur.success.id_label': 'Idanimọ alailẹgbẹ rẹ:',
        'acteur.success.copy': 'Daakọ',
        'acteur.success.note': 'Tọju idanimọ yii lati tọpa ibeere rẹ.',
        'acteur.success.link': 'Wọle si ipasẹ',
        'acteur.success.close': 'Tiipa',
        'footer_conformite': 'Ifaramọ APDP Benin',
        'footer_reglementation': 'Awọn ilana FIFA',
        'footer_double_projet': 'Ise agbese Idaraya-Ẹkọ-Meji',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM: RB/ABC/24 A 111814 | IFU: 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.',
        'toast.error_load_sportifs': 'Aṣiṣe ikojọpọ awọn elere idaraya',
        'toast.error_load_dons': 'Aṣiṣe ikojọpọ awọn ẹbẹ ẹbun',
        'toast.error_load_temoignages': 'Aṣiṣe ikojọpọ awọn ẹri',
        'toast.fill_fields': 'Jọwọ fọwọsi gbogbo awọn aaye ti o nilo.',
        'toast.invalid_email': 'Imeeli ko tọ',
        'toast.message_sent': 'Ifiranṣẹ ti firanṣẹ ni aṣeyọri!',
        'toast.error_send': 'Aṣiṣe fifiranṣẹ',
        'toast.upload_error': 'Aṣiṣe ikojọpọ: {error}',
        'toast.inscription_error': 'Aṣiṣe iforukọsilẹ: {error}',
        'toast.copy_error': 'Aṣiṣe didaakọ',
        'toast.copy_success': 'Ti daakọ!',
        'toast.file_selected': 'Fáìlì ti yan: {filename}',
        'empty.sportifs': 'Ko si elere idaraya ti a ri.',
        'empty.dons': 'Ko si ẹbẹ ẹbun ti a ri.',
        'empty.temoignages': 'Ko si ẹri fun igba bayi.'
    },
    // Fon
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Mina
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Lingala
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Wolof
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Dioula
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Hausa
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Kiswahili
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'empty.sportifs': 'Aucun sportif trouvé.',
        'empty.dons': 'Aucun appel aux dons trouvé.',
        'empty.temoignages': 'Aucun témoignage pour le moment.'
    },
    // Espagnol
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
        'acteur.header.title': 'Conviértete en',
        'acteur.header.highlight': 'Actor',
        'acteur.header.subtitle': 'Apoya el talento y contribuye al desarrollo del fútbol.',
        'acteur.filter.type': 'Todas las necesidades',
        'acteur.filter.sport': 'Todos los deportes',
        'acteur.filter.region': 'Todas las regiones',
        'acteur.filter.search': 'Buscar...',
        'acteur.filter.apply': 'Filtrar',
        'acteur.sportifs.title': 'Deportistas a apoyar',
        'acteur.dons.title': 'Llamadas a donaciones',
        'acteur.devenir.title': 'Convertirse en actor',
        'acteur.temoignages.title': 'Ellos patrocinaron',
        'acteur.modal.title': 'Convertirse en actor',
        'acteur.modal.fullname': 'Nombre completo *',
        'acteur.modal.email': 'Correo electrónico *',
        'acteur.modal.phone': 'Teléfono *',
        'acteur.modal.justificatif': 'Justificante (CV, diploma, licencia…) *',
        'acteur.modal.upload_click': 'Haga clic para cargar (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Enviar mi candidatura',
        'acteur.contact.title': 'Contactar',
        'acteur.contact.name': 'Su nombre',
        'acteur.contact.email': 'Su correo electrónico',
        'acteur.contact.message': 'Mensaje',
        'acteur.contact.send': 'Enviar',
        'acteur.success.title': '¡Inscripción enviada!',
        'acteur.success.message': 'Su solicitud ha sido registrada.',
        'acteur.success.id_label': 'Su identificador único:',
        'acteur.success.copy': 'Copiar',
        'acteur.success.note': 'Conserve este identificador para seguir su solicitud.',
        'acteur.success.link': 'Acceder al seguimiento',
        'acteur.success.close': 'Cerrar',
        'footer_conformite': 'Conformidad APDP Benín',
        'footer_reglementation': 'Reglamento FIFA',
        'footer_double_projet': 'Triple Proyecto Deporte-Estudios-Carrera',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.',
        'toast.error_load_sportifs': 'Error al cargar deportistas',
        'toast.error_load_dons': 'Error al cargar donaciones',
        'toast.error_load_temoignages': 'Error al cargar testimonios',
        'toast.fill_fields': 'Por favor, rellene todos los campos obligatorios.',
        'toast.invalid_email': 'Correo electrónico inválido',
        'toast.message_sent': '¡Mensaje enviado con éxito!',
        'toast.error_send': 'Error al enviar',
        'toast.upload_error': 'Error de carga: {error}',
        'toast.inscription_error': 'Error de inscripción: {error}',
        'toast.copy_error': 'Error de copia',
        'toast.copy_success': '¡Copiado!',
        'toast.file_selected': 'Archivo seleccionado: {filename}',
        'empty.sportifs': 'Ningún deportista encontrado.',
        'empty.dons': 'Ninguna donación encontrada.',
        'empty.temoignages': 'Ningún testimonio por el momento.'
    },
    // Portugais
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
        'acteur.header.title': 'Torne-se',
        'acteur.header.highlight': 'Ator',
        'acteur.header.subtitle': 'Apoie os talentos e contribua para o desenvolvimento do futebol.',
        'acteur.filter.type': 'Todas as necessidades',
        'acteur.filter.sport': 'Todos os esportes',
        'acteur.filter.region': 'Todas as regiões',
        'acteur.filter.search': 'Pesquisar...',
        'acteur.filter.apply': 'Filtrar',
        'acteur.sportifs.title': 'Atletas a apoiar',
        'acteur.dons.title': 'Apelos de doações',
        'acteur.devenir.title': 'Tornar-se um ator',
        'acteur.temoignages.title': 'Eles patrocinaram',
        'acteur.modal.title': 'Tornar-se um ator',
        'acteur.modal.fullname': 'Nome completo *',
        'acteur.modal.email': 'E-mail *',
        'acteur.modal.phone': 'Telefone *',
        'acteur.modal.justificatif': 'Comprovante (CV, diploma, licença…) *',
        'acteur.modal.upload_click': 'Clique para enviar (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Enviar minha candidatura',
        'acteur.contact.title': 'Contatar',
        'acteur.contact.name': 'Seu nome',
        'acteur.contact.email': 'Seu e-mail',
        'acteur.contact.message': 'Mensagem',
        'acteur.contact.send': 'Enviar',
        'acteur.success.title': 'Inscrição enviada!',
        'acteur.success.message': 'Seu pedido foi registrado.',
        'acteur.success.id_label': 'Seu identificador único:',
        'acteur.success.copy': 'Copiar',
        'acteur.success.note': 'Guarde este identificador para acompanhar seu pedido.',
        'acteur.success.link': 'Acessar acompanhamento',
        'acteur.success.close': 'Fechar',
        'footer_conformite': 'Conformidade APDP Benim',
        'footer_reglementation': 'Regulamento FIFA',
        'footer_double_projet': 'Triplo Projeto Esporte-Estudos-Carreira',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.',
        'toast.error_load_sportifs': 'Erro ao carregar atletas',
        'toast.error_load_dons': 'Erro ao carregar doações',
        'toast.error_load_temoignages': 'Erro ao carregar testemunhos',
        'toast.fill_fields': 'Por favor, preencha todos os campos obrigatórios.',
        'toast.invalid_email': 'E-mail inválido',
        'toast.message_sent': 'Mensagem enviada com sucesso!',
        'toast.error_send': 'Erro ao enviar',
        'toast.upload_error': 'Erro de upload: {error}',
        'toast.inscription_error': 'Erro de inscrição: {error}',
        'toast.copy_error': 'Erro de cópia',
        'toast.copy_success': 'Copiado!',
        'toast.file_selected': 'Arquivo selecionado: {filename}',
        'empty.sportifs': 'Nenhum atleta encontrado.',
        'empty.dons': 'Nenhuma doação encontrada.',
        'empty.temoignages': 'Nenhum testemunho no momento.'
    },
    // Allemand
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
        'acteur.header.title': 'Werde',
        'acteur.header.highlight': 'Akteur',
        'acteur.header.subtitle': 'Unterstütze Talente und trage zur Entwicklung des Fußballs bei.',
        'acteur.filter.type': 'Alle Bedürfnisse',
        'acteur.filter.sport': 'Alle Sportarten',
        'acteur.filter.region': 'Alle Regionen',
        'acteur.filter.search': 'Suchen...',
        'acteur.filter.apply': 'Filtern',
        'acteur.sportifs.title': 'Sportler zu unterstützen',
        'acteur.dons.title': 'Spendenaufrufe',
        'acteur.devenir.title': 'Akteur werden',
        'acteur.temoignages.title': 'Sie haben gesponsert',
        'acteur.modal.title': 'Akteur werden',
        'acteur.modal.fullname': 'Vollständiger Name *',
        'acteur.modal.email': 'E-Mail *',
        'acteur.modal.phone': 'Telefon *',
        'acteur.modal.justificatif': 'Nachweis (CV, Diplom, Lizenz…) *',
        'acteur.modal.upload_click': 'Klicken Sie zum Hochladen (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Meine Bewerbung einreichen',
        'acteur.contact.title': 'Kontakt',
        'acteur.contact.name': 'Ihr Name',
        'acteur.contact.email': 'Ihre E-Mail',
        'acteur.contact.message': 'Nachricht',
        'acteur.contact.send': 'Senden',
        'acteur.success.title': 'Anmeldung gesendet!',
        'acteur.success.message': 'Ihr Antrag wurde registriert.',
        'acteur.success.id_label': 'Ihre eindeutige Kennung:',
        'acteur.success.copy': 'Kopieren',
        'acteur.success.note': 'Bewahren Sie diese Kennung auf, um Ihren Antrag zu verfolgen.',
        'acteur.success.link': 'Zur Nachverfolgung',
        'acteur.success.close': 'Schließen',
        'footer_conformite': 'APDP Benin Konformität',
        'footer_reglementation': 'FIFA-Regulierung',
        'footer_double_projet': 'Dreifachprojekt Sport-Studium-Beruf',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.',
        'toast.error_load_sportifs': 'Fehler beim Laden der Sportler',
        'toast.error_load_dons': 'Fehler beim Laden der Spendenaufrufe',
        'toast.error_load_temoignages': 'Fehler beim Laden der Testimonials',
        'toast.fill_fields': 'Bitte füllen Sie alle Pflichtfelder aus.',
        'toast.invalid_email': 'Ungültige E-Mail',
        'toast.message_sent': 'Nachricht erfolgreich gesendet!',
        'toast.error_send': 'Fehler beim Senden',
        'toast.upload_error': 'Upload-Fehler: {error}',
        'toast.inscription_error': 'Anmeldefehler: {error}',
        'toast.copy_error': 'Kopierfehler',
        'toast.copy_success': 'Kopiert!',
        'toast.file_selected': 'Datei ausgewählt: {filename}',
        'empty.sportifs': 'Kein Sportler gefunden.',
        'empty.dons': 'Kein Spendenaufruf gefunden.',
        'empty.temoignages': 'Noch kein Testimonial.'
    },
    // Italien
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
        'acteur.header.title': 'Diventa',
        'acteur.header.highlight': 'Attore',
        'acteur.header.subtitle': 'Sostieni i talenti e contribuisci allo sviluppo del calcio.',
        'acteur.filter.type': 'Tutti i bisogni',
        'acteur.filter.sport': 'Tutti gli sport',
        'acteur.filter.region': 'Tutte le regioni',
        'acteur.filter.search': 'Cerca...',
        'acteur.filter.apply': 'Filtra',
        'acteur.sportifs.title': 'Atleti da sostenere',
        'acteur.dons.title': 'Appelli di donazione',
        'acteur.devenir.title': 'Diventare un attore',
        'acteur.temoignages.title': 'Hanno sponsorizzato',
        'acteur.modal.title': 'Diventare un attore',
        'acteur.modal.fullname': 'Nome completo *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Telefono *',
        'acteur.modal.justificatif': 'Giustificativo (CV, diploma, licenza…) *',
        'acteur.modal.upload_click': 'Clicca per caricare (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Invia la mia candidatura',
        'acteur.contact.title': 'Contattare',
        'acteur.contact.name': 'Il tuo nome',
        'acteur.contact.email': 'La tua email',
        'acteur.contact.message': 'Messaggio',
        'acteur.contact.send': 'Invia',
        'acteur.success.title': 'Iscrizione inviata!',
        'acteur.success.message': 'La tua richiesta è stata registrata.',
        'acteur.success.id_label': 'Il tuo identificativo univoco:',
        'acteur.success.copy': 'Copia',
        'acteur.success.note': 'Conserva questo identificativo per seguire la tua richiesta.',
        'acteur.success.link': 'Accedi al monitoraggio',
        'acteur.success.close': 'Chiudi',
        'footer_conformite': 'Conformità APDP Benin',
        'footer_reglementation': 'Regolamento FIFA',
        'footer_double_projet': 'Progetto Triplo Sport-Studi-Carriera',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.',
        'toast.error_load_sportifs': 'Errore nel caricamento degli atleti',
        'toast.error_load_dons': 'Errore nel caricamento degli appelli di donazione',
        'toast.error_load_temoignages': 'Errore nel caricamento delle testimonianze',
        'toast.fill_fields': 'Si prega di compilare tutti i campi obbligatori.',
        'toast.invalid_email': 'Email non valida',
        'toast.message_sent': 'Messaggio inviato con successo!',
        'toast.error_send': 'Errore durante l\'invio',
        'toast.upload_error': 'Errore di upload: {error}',
        'toast.inscription_error': 'Errore di iscrizione: {error}',
        'toast.copy_error': 'Errore di copia',
        'toast.copy_success': 'Copiato!',
        'toast.file_selected': 'File selezionato: {filename}',
        'empty.sportifs': 'Nessun atleta trovato.',
        'empty.dons': 'Nessun appello di donazione trovato.',
        'empty.temoignages': 'Nessuna testimonianza per il momento.'
    },
    // Arabe
    ar: {
        'loader.message': 'جار التحميل...',
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
        'connexion': 'تسجيل الدخول',
        'inscrire': 'التسجيل',
        'acteur.header.title': 'كن',
        'acteur.header.highlight': 'فاعلا',
        'acteur.header.subtitle': 'ادعم المواهب وساهم في تطوير كرة القدم.',
        'acteur.filter.type': 'جميع الاحتياجات',
        'acteur.filter.sport': 'جميع الرياضات',
        'acteur.filter.region': 'جميع المناطق',
        'acteur.filter.search': 'بحث...',
        'acteur.filter.apply': 'تصفية',
        'acteur.sportifs.title': 'رياضيون للدعم',
        'acteur.dons.title': 'نداءات التبرع',
        'acteur.devenir.title': 'كن فاعلا',
        'acteur.temoignages.title': 'لقد قاموا بالرعاية',
        'acteur.modal.title': 'كن فاعلا',
        'acteur.modal.fullname': 'الاسم الكامل *',
        'acteur.modal.email': 'البريد الإلكتروني *',
        'acteur.modal.phone': 'الهاتف *',
        'acteur.modal.justificatif': 'إثبات (سيرة ذاتية، دبلوم، رخصة…) *',
        'acteur.modal.upload_click': 'انقر للتحميل (PDF، JPG، PNG)',
        'acteur.modal.submit': 'تقديم طلبي',
        'acteur.contact.title': 'اتصل',
        'acteur.contact.name': 'اسمك',
        'acteur.contact.email': 'بريدك الإلكتروني',
        'acteur.contact.message': 'رسالة',
        'acteur.contact.send': 'إرسال',
        'acteur.success.title': 'تم إرسال التسجيل!',
        'acteur.success.message': 'تم تسجيل طلبك.',
        'acteur.success.id_label': 'معرفك الفريد:',
        'acteur.success.copy': 'نسخ',
        'acteur.success.note': 'احتفظ بهذا المعرف لتتبع طلبك.',
        'acteur.success.link': 'الوصول إلى التتبع',
        'acteur.success.close': 'إغلاق',
        'footer_conformite': 'الامتثال لـ APDP بنين',
        'footer_reglementation': 'لوائح الفيفا',
        'footer_double_projet': 'مشروع الرياضة والدراسة والمهنة الثلاثي',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.',
        'toast.error_load_sportifs': 'خطأ في تحميل الرياضيين',
        'toast.error_load_dons': 'خطأ في تحميل نداءات التبرع',
        'toast.error_load_temoignages': 'خطأ في تحميل الشهادات',
        'toast.fill_fields': 'يرجى ملء جميع الحقول الإلزامية.',
        'toast.invalid_email': 'بريد إلكتروني غير صالح',
        'toast.message_sent': 'تم إرسال الرسالة بنجاح!',
        'toast.error_send': 'خطأ في الإرسال',
        'toast.upload_error': 'خطأ في التحميل: {error}',
        'toast.inscription_error': 'خطأ في التسجيل: {error}',
        'toast.copy_error': 'خطأ في النسخ',
        'toast.copy_success': 'تم النسخ!',
        'toast.file_selected': 'الملف المحدد: {filename}',
        'empty.sportifs': 'لم يتم العثور على أي رياضي.',
        'empty.dons': 'لم يتم العثور على أي نداء تبرع.',
        'empty.temoignages': 'لا توجد شهادات في الوقت الحالي.'
    },
    // Chinois
    zh: {
        'loader.message': '加载中...',
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
        'connexion': '连接',
        'inscrire': '登记',
        'acteur.header.title': '成为',
        'acteur.header.highlight': '行动者',
        'acteur.header.subtitle': '支持人才并为足球发展做出贡献。',
        'acteur.filter.type': '所有需求',
        'acteur.filter.sport': '所有运动',
        'acteur.filter.region': '所有地区',
        'acteur.filter.search': '搜索...',
        'acteur.filter.apply': '筛选',
        'acteur.sportifs.title': '支持的运动员',
        'acteur.dons.title': '捐赠呼吁',
        'acteur.devenir.title': '成为行动者',
        'acteur.temoignages.title': '他们赞助了',
        'acteur.modal.title': '成为行动者',
        'acteur.modal.fullname': '全名 *',
        'acteur.modal.email': '电子邮件 *',
        'acteur.modal.phone': '电话 *',
        'acteur.modal.justificatif': '证明 (简历、文凭、执照…) *',
        'acteur.modal.upload_click': '点击上传 (PDF、JPG、PNG)',
        'acteur.modal.submit': '提交我的申请',
        'acteur.contact.title': '联系',
        'acteur.contact.name': '您的名字',
        'acteur.contact.email': '您的电子邮件',
        'acteur.contact.message': '信息',
        'acteur.contact.send': '发送',
        'acteur.success.title': '注册已发送！',
        'acteur.success.message': '您的请求已记录。',
        'acteur.success.id_label': '您的唯一标识符:',
        'acteur.success.copy': '复制',
        'acteur.success.note': '保留此标识符以跟踪您的请求。',
        'acteur.success.link': '访问跟踪',
        'acteur.success.close': '关闭',
        'footer_conformite': 'APDP 贝宁合规',
        'footer_reglementation': 'FIFA 规则',
        'footer_double_projet': '体育-学习-职业三重项目',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa。 版权所有。',
        'toast.error_load_sportifs': '加载运动员时出错',
        'toast.error_load_dons': '加载捐赠呼吁时出错',
        'toast.error_load_temoignages': '加载见证时出错',
        'toast.fill_fields': '请填写所有必填字段。',
        'toast.invalid_email': '无效的电子邮件',
        'toast.message_sent': '消息发送成功！',
        'toast.error_send': '发送错误',
        'toast.upload_error': '上传错误: {error}',
        'toast.inscription_error': '注册错误: {error}',
        'toast.copy_error': '复制错误',
        'toast.copy_success': '已复制！',
        'toast.file_selected': '选择的文件: {filename}',
        'empty.sportifs': '未找到运动员。',
        'empty.dons': '未找到捐赠呼吁。',
        'empty.temoignages': '目前没有见证。'
    },
    // Russe
    ru: {
        'loader.message': 'Загрузка...',
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
        'connexion': 'Вход',
        'inscrire': 'Регистрация',
        'acteur.header.title': 'Станьте',
        'acteur.header.highlight': 'Актором',
        'acteur.header.subtitle': 'Поддержите таланты и внесите вклад в развитие футбола.',
        'acteur.filter.type': 'Все потребности',
        'acteur.filter.sport': 'Все виды спорта',
        'acteur.filter.region': 'Все регионы',
        'acteur.filter.search': 'Поиск...',
        'acteur.filter.apply': 'Фильтр',
        'acteur.sportifs.title': 'Спортсмены для поддержки',
        'acteur.dons.title': 'Призывы к пожертвованиям',
        'acteur.devenir.title': 'Стать актором',
        'acteur.temoignages.title': 'Они спонсировали',
        'acteur.modal.title': 'Стать актором',
        'acteur.modal.fullname': 'Полное имя *',
        'acteur.modal.email': 'Электронная почта *',
        'acteur.modal.phone': 'Телефон *',
        'acteur.modal.justificatif': 'Подтверждение (CV, диплом, лицензия…) *',
        'acteur.modal.upload_click': 'Нажмите, чтобы загрузить (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Отправить мою заявку',
        'acteur.contact.title': 'Связаться',
        'acteur.contact.name': 'Ваше имя',
        'acteur.contact.email': 'Ваш email',
        'acteur.contact.message': 'Сообщение',
        'acteur.contact.send': 'Отправить',
        'acteur.success.title': 'Регистрация отправлена!',
        'acteur.success.message': 'Ваш запрос зарегистрирован.',
        'acteur.success.id_label': 'Ваш уникальный идентификатор:',
        'acteur.success.copy': 'Копия',
        'acteur.success.note': 'Сохраните этот идентификатор для отслеживания вашего запроса.',
        'acteur.success.link': 'Доступ к отслеживанию',
        'acteur.success.close': 'Закрыть',
        'footer_conformite': 'Соответствие APDP Бенин',
        'footer_reglementation': 'Регламент ФИФА',
        'footer_double_projet': 'Тройной проект Спорт-Учёба-Карьера',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Все права защищены.',
        'toast.error_load_sportifs': 'Ошибка загрузки спортсменов',
        'toast.error_load_dons': 'Ошибка загрузки призывов к пожертвованиям',
        'toast.error_load_temoignages': 'Ошибка загрузки отзывов',
        'toast.fill_fields': 'Пожалуйста, заполните все обязательные поля.',
        'toast.invalid_email': 'Неверный email',
        'toast.message_sent': 'Сообщение успешно отправлено!',
        'toast.error_send': 'Ошибка отправки',
        'toast.upload_error': 'Ошибка загрузки: {error}',
        'toast.inscription_error': 'Ошибка регистрации: {error}',
        'toast.copy_error': 'Ошибка копирования',
        'toast.copy_success': 'Скопировано!',
        'toast.file_selected': 'Выбранный файл: {filename}',
        'empty.sportifs': 'Спортсмены не найдены.',
        'empty.dons': 'Призывы к пожертвованиям не найдены.',
        'empty.temoignages': 'На данный момент отзывов нет.'
    },
    // Japonais
    ja: {
        'loader.message': '読み込み中...',
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
        'connexion': '接続',
        'inscrire': '登録',
        'acteur.header.title': 'なる',
        'acteur.header.highlight': 'アクター',
        'acteur.header.subtitle': '才能をサポートし、サッカーの発展に貢献しましょう。',
        'acteur.filter.type': 'すべてのニーズ',
        'acteur.filter.sport': 'すべてのスポーツ',
        'acteur.filter.region': 'すべての地域',
        'acteur.filter.search': '検索...',
        'acteur.filter.apply': 'フィルター',
        'acteur.sportifs.title': 'サポートするアスリート',
        'acteur.dons.title': '寄付の呼びかけ',
        'acteur.devenir.title': 'アクターになる',
        'acteur.temoignages.title': '彼らはスポンサーになりました',
        'acteur.modal.title': 'アクターになる',
        'acteur.modal.fullname': '氏名 *',
        'acteur.modal.email': 'メールアドレス *',
        'acteur.modal.phone': '電話番号 *',
        'acteur.modal.justificatif': '証明（履歴書、卒業証書、免許証…） *',
        'acteur.modal.upload_click': 'クリックしてアップロード（PDF、JPG、PNG）',
        'acteur.modal.submit': '応募を送信',
        'acteur.contact.title': '連絡',
        'acteur.contact.name': 'お名前',
        'acteur.contact.email': 'メールアドレス',
        'acteur.contact.message': 'メッセージ',
        'acteur.contact.send': '送信',
        'acteur.success.title': '登録が送信されました！',
        'acteur.success.message': 'リクエストが記録されました。',
        'acteur.success.id_label': '一意の識別子:',
        'acteur.success.copy': 'コピー',
        'acteur.success.note': 'リクエストを追跡するためにこの識別子を保管してください。',
        'acteur.success.link': '追跡にアクセス',
        'acteur.success.close': '閉じる',
        'footer_conformite': 'APDP ベニン準拠',
        'footer_reglementation': 'FIFA 規則',
        'footer_double_projet': 'スポーツ・勉強・職業のトリプルプロジェクト',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. 無断複写・転載を禁じます。',
        'toast.error_load_sportifs': 'アスリートの読み込みエラー',
        'toast.error_load_dons': '寄付の呼びかけの読み込みエラー',
        'toast.error_load_temoignages': 'お客様の声の読み込みエラー',
        'toast.fill_fields': '必須項目をすべて入力してください。',
        'toast.invalid_email': '無効なメールアドレス',
        'toast.message_sent': 'メッセージが正常に送信されました！',
        'toast.error_send': '送信エラー',
        'toast.upload_error': 'アップロードエラー: {error}',
        'toast.inscription_error': '登録エラー: {error}',
        'toast.copy_error': 'コピーエラー',
        'toast.copy_success': 'コピーしました！',
        'toast.file_selected': '選択されたファイル: {filename}',
        'empty.sportifs': 'アスリートが見つかりません。',
        'empty.dons': '寄付の呼びかけが見つかりません。',
        'empty.temoignages': '現在、お客様の声はありません。'
    },
    // Turc
    tr: {
        'loader.message': 'Yükleniyor...',
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
        'connexion': 'Giriş',
        'inscrire': 'Kaydol',
        'acteur.header.title': 'Olmak',
        'acteur.header.highlight': 'Aktör',
        'acteur.header.subtitle': 'Yetenekleri destekleyin ve futbolun gelişimine katkıda bulunun.',
        'acteur.filter.type': 'Tüm ihtiyaçlar',
        'acteur.filter.sport': 'Tüm sporlar',
        'acteur.filter.region': 'Tüm bölgeler',
        'acteur.filter.search': 'Ara...',
        'acteur.filter.apply': 'Filtrele',
        'acteur.sportifs.title': 'Desteklenecek sporcular',
        'acteur.dons.title': 'Bağış çağrıları',
        'acteur.devenir.title': 'Aktör ol',
        'acteur.temoignages.title': 'Sponsor oldular',
        'acteur.modal.title': 'Aktör ol',
        'acteur.modal.fullname': 'Tam ad *',
        'acteur.modal.email': 'E-posta *',
        'acteur.modal.phone': 'Telefon *',
        'acteur.modal.justificatif': 'Kanıt (CV, diploma, lisans…) *',
        'acteur.modal.upload_click': 'Yüklemek için tıklayın (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Başvurumu gönder',
        'acteur.contact.title': 'İletişim',
        'acteur.contact.name': 'Adınız',
        'acteur.contact.email': 'E-postanız',
        'acteur.contact.message': 'Mesaj',
        'acteur.contact.send': 'Gönder',
        'acteur.success.title': 'Kayıt gönderildi!',
        'acteur.success.message': 'Talebiniz kaydedildi.',
        'acteur.success.id_label': 'Benzersiz kimliğiniz:',
        'acteur.success.copy': 'Kopyala',
        'acteur.success.note': 'Talebinizi takip etmek için bu kimliği saklayın.',
        'acteur.success.link': 'Takibe eriş',
        'acteur.success.close': 'Kapat',
        'footer_conformite': 'APDP Benin Uyumluluğu',
        'footer_reglementation': 'FIFA Düzenlemeleri',
        'footer_double_projet': 'Spor-Eğitim-Meslek Üçlü Projesi',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.',
        'toast.error_load_sportifs': 'Sporcular yüklenirken hata',
        'toast.error_load_dons': 'Bağış çağrıları yüklenirken hata',
        'toast.error_load_temoignages': 'Görüşler yüklenirken hata',
        'toast.fill_fields': 'Lütfen tüm zorunlu alanları doldurun.',
        'toast.invalid_email': 'Geçersiz e-posta',
        'toast.message_sent': 'Mesaj başarıyla gönderildi!',
        'toast.error_send': 'Gönderme hatası',
        'toast.upload_error': 'Yükleme hatası: {error}',
        'toast.inscription_error': 'Kayıt hatası: {error}',
        'toast.copy_error': 'Kopyalama hatası',
        'toast.copy_success': 'Kopyalandı!',
        'toast.file_selected': 'Seçilen dosya: {filename}',
        'empty.sportifs': 'Sporcu bulunamadı.',
        'empty.dons': 'Bağış çağrısı bulunamadı.',
        'empty.temoignages': 'Şu anda görüş yok.'
    },
    // Coréen
    ko: {
        'loader.message': '로딩 중...',
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
        'connexion': '연결',
        'inscrire': '등록',
        'acteur.header.title': '되기',
        'acteur.header.highlight': '액터',
        'acteur.header.subtitle': '재능을 지원하고 축구 발전에 기여하세요.',
        'acteur.filter.type': '모든 필요',
        'acteur.filter.sport': '모든 스포츠',
        'acteur.filter.region': '모든 지역',
        'acteur.filter.search': '검색...',
        'acteur.filter.apply': '필터',
        'acteur.sportifs.title': '지원할 선수',
        'acteur.dons.title': '기부 요청',
        'acteur.devenir.title': '액터 되기',
        'acteur.temoignages.title': '후원했습니다',
        'acteur.modal.title': '액터 되기',
        'acteur.modal.fullname': '성명 *',
        'acteur.modal.email': '이메일 *',
        'acteur.modal.phone': '전화번호 *',
        'acteur.modal.justificatif': '증명 (CV, 졸업장, 자격증…) *',
        'acteur.modal.upload_click': '업로드하려면 클릭하세요 (PDF, JPG, PNG)',
        'acteur.modal.submit': '신청서 제출',
        'acteur.contact.title': '연락처',
        'acteur.contact.name': '이름',
        'acteur.contact.email': '이메일',
        'acteur.contact.message': '메시지',
        'acteur.contact.send': '보내기',
        'acteur.success.title': '등록이 전송되었습니다!',
        'acteur.success.message': '요청이 기록되었습니다.',
        'acteur.success.id_label': '고유 식별자:',
        'acteur.success.copy': '복사',
        'acteur.success.note': '요청을 추적하려면 이 식별자를 보관하세요.',
        'acteur.success.link': '추적에 접근',
        'acteur.success.close': '닫기',
        'footer_conformite': 'APDP 베냉 준수',
        'footer_reglementation': 'FIFA 규정',
        'footer_double_projet': '스포츠-공부-직업 삼중 프로젝트',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. 모든 권리 보유.',
        'toast.error_load_sportifs': '선수 로딩 오류',
        'toast.error_load_dons': '기부 요청 로딩 오류',
        'toast.error_load_temoignages': '추천사 로딩 오류',
        'toast.fill_fields': '모든 필수 필드를 입력하십시오.',
        'toast.invalid_email': '유효하지 않은 이메일',
        'toast.message_sent': '메시지가 성공적으로 전송되었습니다!',
        'toast.error_send': '전송 오류',
        'toast.upload_error': '업로드 오류: {error}',
        'toast.inscription_error': '등록 오류: {error}',
        'toast.copy_error': '복사 오류',
        'toast.copy_success': '복사되었습니다!',
        'toast.file_selected': '선택된 파일: {filename}',
        'empty.sportifs': '선수를 찾을 수 없습니다.',
        'empty.dons': '기부 요청을 찾을 수 없습니다.',
        'empty.temoignages': '현재 추천사가 없습니다.'
    },
    // Hindi
    hi: {
        'loader.message': 'लोड हो रहा है...',
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
        'connexion': 'कनेक्शन',
        'inscrire': 'साइन अप करें',
        'acteur.header.title': 'बनें',
        'acteur.header.highlight': 'अभिनेता',
        'acteur.header.subtitle': 'प्रतिभाओं का समर्थन करें और फुटबॉल के विकास में योगदान दें।',
        'acteur.filter.type': 'सभी आवश्यकताएं',
        'acteur.filter.sport': 'सभी खेल',
        'acteur.filter.region': 'सभी क्षेत्र',
        'acteur.filter.search': 'खोजें...',
        'acteur.filter.apply': 'फ़िल्टर करें',
        'acteur.sportifs.title': 'समर्थन करने के लिए खिलाड़ी',
        'acteur.dons.title': 'दान की अपील',
        'acteur.devenir.title': 'अभिनेता बनें',
        'acteur.temoignages.title': 'उन्होंने प्रायोजित किया',
        'acteur.modal.title': 'अभिनेता बनें',
        'acteur.modal.fullname': 'पूरा नाम *',
        'acteur.modal.email': 'ईमेल *',
        'acteur.modal.phone': 'फ़ोन *',
        'acteur.modal.justificatif': 'प्रमाण (CV, डिप्लोमा, लाइसेंस…) *',
        'acteur.modal.upload_click': 'अपलोड करने के लिए क्लिक करें (PDF, JPG, PNG)',
        'acteur.modal.submit': 'मेरा आवेदन जमा करें',
        'acteur.contact.title': 'संपर्क करें',
        'acteur.contact.name': 'आपका नाम',
        'acteur.contact.email': 'आपका ईमेल',
        'acteur.contact.message': 'संदेश',
        'acteur.contact.send': 'भेजें',
        'acteur.success.title': 'पंजीकरण भेजा गया!',
        'acteur.success.message': 'आपका अनुरोध दर्ज कर लिया गया है।',
        'acteur.success.id_label': 'आपका अद्वितीय पहचानकर्ता:',
        'acteur.success.copy': 'कॉपी',
        'acteur.success.note': 'अपने अनुरोध को ट्रैक करने के लिए इस पहचानकर्ता को सुरक्षित रखें।',
        'acteur.success.link': 'ट्रैकिंग तक पहुंचें',
        'acteur.success.close': 'बंद करें',
        'footer_conformite': 'APDP बेनिन अनुपालन',
        'footer_reglementation': 'फीफा नियम',
        'footer_double_projet': 'खेल-अध्ययन-पेशा ट्रिपल प्रोजेक्ट',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।',
        'toast.error_load_sportifs': 'खिलाड़ियों को लोड करने में त्रुटि',
        'toast.error_load_dons': 'दान अपील लोड करने में त्रुटि',
        'toast.error_load_temoignages': 'प्रशंसापत्र लोड करने में त्रुटि',
        'toast.fill_fields': 'कृपया सभी आवश्यक फ़ील्ड भरें।',
        'toast.invalid_email': 'अमान्य ईमेल',
        'toast.message_sent': 'संदेश सफलतापूर्वक भेज दिया गया!',
        'toast.error_send': 'भेजने में त्रुटि',
        'toast.upload_error': 'अपलोड त्रुटि: {error}',
        'toast.inscription_error': 'पंजीकरण त्रुटि: {error}',
        'toast.copy_error': 'कॉपी त्रुटि',
        'toast.copy_success': 'कॉपी किया गया!',
        'toast.file_selected': 'चयनित फ़ाइल: {filename}',
        'empty.sportifs': 'कोई खिलाड़ी नहीं मिला।',
        'empty.dons': 'कोई दान अपील नहीं मिली।',
        'empty.temoignages': 'फिलहाल कोई प्रशंसापत्र नहीं।'
    },
    // Néerlandais
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
        'acteur.header.title': 'Word',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Steun talenten en draag bij aan de ontwikkeling van het voetbal.',
        'acteur.filter.type': 'Alle behoeften',
        'acteur.filter.sport': 'Alle sporten',
        'acteur.filter.region': 'Alle regio\'s',
        'acteur.filter.search': 'Zoeken...',
        'acteur.filter.apply': 'Filter',
        'acteur.sportifs.title': 'Te steunen sporters',
        'acteur.dons.title': 'Donatie-oproepen',
        'acteur.devenir.title': 'Word acteur',
        'acteur.temoignages.title': 'Zij sponsorden',
        'acteur.modal.title': 'Word acteur',
        'acteur.modal.fullname': 'Volledige naam *',
        'acteur.modal.email': 'E-mail *',
        'acteur.modal.phone': 'Telefoon *',
        'acteur.modal.justificatif': 'Bewijs (CV, diploma, licentie…) *',
        'acteur.modal.upload_click': 'Klik om te uploaden (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Mijn aanvraag indienen',
        'acteur.contact.title': 'Contact',
        'acteur.contact.name': 'Uw naam',
        'acteur.contact.email': 'Uw e-mail',
        'acteur.contact.message': 'Bericht',
        'acteur.contact.send': 'Versturen',
        'acteur.success.title': 'Inschrijving verzonden!',
        'acteur.success.message': 'Uw verzoek is geregistreerd.',
        'acteur.success.id_label': 'Uw unieke identificatie:',
        'acteur.success.copy': 'Kopiëren',
        'acteur.success.note': 'Bewaar deze identificatie om uw verzoek te volgen.',
        'acteur.success.link': 'Toegang tot tracking',
        'acteur.success.close': 'Sluiten',
        'footer_conformite': 'APDP Benin Naleving',
        'footer_reglementation': 'FIFA Regelgeving',
        'footer_double_projet': 'Triple Project Sport-Studie-Beroep',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.',
        'toast.error_load_sportifs': 'Fout bij laden sporters',
        'toast.error_load_dons': 'Fout bij laden donatie-oproepen',
        'toast.error_load_temoignages': 'Fout bij laden getuigenissen',
        'toast.fill_fields': 'Vul alle verplichte velden in.',
        'toast.invalid_email': 'Ongeldig e-mailadres',
        'toast.message_sent': 'Bericht succesvol verzonden!',
        'toast.error_send': 'Fout bij verzenden',
        'toast.upload_error': 'Uploadfout: {error}',
        'toast.inscription_error': 'Inschrijvingsfout: {error}',
        'toast.copy_error': 'Kopieerfout',
        'toast.copy_success': 'Gekopieerd!',
        'toast.file_selected': 'Geselecteerd bestand: {filename}',
        'empty.sportifs': 'Geen sporter gevonden.',
        'empty.dons': 'Geen donatie-oproep gevonden.',
        'empty.temoignages': 'Nog geen getuigenis.'
    },
    // Polonais
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
        'acteur.header.title': 'Zostań',
        'acteur.header.highlight': 'Aktorem',
        'acteur.header.subtitle': 'Wspieraj talenty i przyczyniaj się do rozwoju piłki nożnej.',
        'acteur.filter.type': 'Wszystkie potrzeby',
        'acteur.filter.sport': 'Wszystkie sporty',
        'acteur.filter.region': 'Wszystkie regiony',
        'acteur.filter.search': 'Szukaj...',
        'acteur.filter.apply': 'Filtruj',
        'acteur.sportifs.title': 'Sportowcy do wsparcia',
        'acteur.dons.title': 'Wezwania do darowizn',
        'acteur.devenir.title': 'Zostań aktorem',
        'acteur.temoignages.title': 'Oni sponsorowali',
        'acteur.modal.title': 'Zostań aktorem',
        'acteur.modal.fullname': 'Pełne imię i nazwisko *',
        'acteur.modal.email': 'E-mail *',
        'acteur.modal.phone': 'Telefon *',
        'acteur.modal.justificatif': 'Dowód (CV, dyplom, licencja…) *',
        'acteur.modal.upload_click': 'Kliknij, aby przesłać (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Wyślij moje zgłoszenie',
        'acteur.contact.title': 'Kontakt',
        'acteur.contact.name': 'Twoje imię',
        'acteur.contact.email': 'Twój e-mail',
        'acteur.contact.message': 'Wiadomość',
        'acteur.contact.send': 'Wyślij',
        'acteur.success.title': 'Zgłoszenie wysłane!',
        'acteur.success.message': 'Twoja prośba została zarejestrowana.',
        'acteur.success.id_label': 'Twój unikalny identyfikator:',
        'acteur.success.copy': 'Kopiuj',
        'acteur.success.note': 'Zachowaj ten identyfikator, aby śledzić swoją prośbę.',
        'acteur.success.link': 'Dostęp do śledzenia',
        'acteur.success.close': 'Zamknij',
        'footer_conformite': 'Zgodność APDP Benin',
        'footer_reglementation': 'Regulacje FIFA',
        'footer_double_projet': 'Potrójny Projekt Sport-Nauka-Zawód',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.',
        'toast.error_load_sportifs': 'Błąd ładowania sportowców',
        'toast.error_load_dons': 'Błąd ładowania wezwań do darowizn',
        'toast.error_load_temoignages': 'Błąd ładowania referencji',
        'toast.fill_fields': 'Proszę wypełnić wszystkie wymagane pola.',
        'toast.invalid_email': 'Nieprawidłowy e-mail',
        'toast.message_sent': 'Wiadomość wysłana pomyślnie!',
        'toast.error_send': 'Błąd wysyłania',
        'toast.upload_error': 'Błąd przesyłania: {error}',
        'toast.inscription_error': 'Błąd rejestracji: {error}',
        'toast.copy_error': 'Błąd kopiowania',
        'toast.copy_success': 'Skopiowano!',
        'toast.file_selected': 'Wybrany plik: {filename}',
        'empty.sportifs': 'Nie znaleziono sportowca.',
        'empty.dons': 'Nie znaleziono wezwania do darowizn.',
        'empty.temoignages': 'Na razie brak referencji.'
    },
    // Vietnamien
    vi: {
        'loader.message': 'Đang tải...',
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
        'connexion': 'Đăng nhập',
        'inscrire': 'Đăng ký',
        'acteur.header.title': 'Trở thành',
        'acteur.header.highlight': 'Diễn viên',
        'acteur.header.subtitle': 'Hỗ trợ tài năng và đóng góp vào sự phát triển của bóng đá.',
        'acteur.filter.type': 'Tất cả nhu cầu',
        'acteur.filter.sport': 'Tất cả các môn thể thao',
        'acteur.filter.region': 'Tất cả các vùng',
        'acteur.filter.search': 'Tìm kiếm...',
        'acteur.filter.apply': 'Lọc',
        'acteur.sportifs.title': 'Vận động viên để hỗ trợ',
        'acteur.dons.title': 'Lời kêu gọi quyên góp',
        'acteur.devenir.title': 'Trở thành một diễn viên',
        'acteur.temoignages.title': 'Họ đã tài trợ',
        'acteur.modal.title': 'Trở thành một diễn viên',
        'acteur.modal.fullname': 'Họ và tên *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Điện thoại *',
        'acteur.modal.justificatif': 'Bằng chứng (CV, bằng cấp, giấy phép…) *',
        'acteur.modal.upload_click': 'Nhấp để tải lên (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Gửi đơn của tôi',
        'acteur.contact.title': 'Liên hệ',
        'acteur.contact.name': 'Tên của bạn',
        'acteur.contact.email': 'Email của bạn',
        'acteur.contact.message': 'Tin nhắn',
        'acteur.contact.send': 'Gửi',
        'acteur.success.title': 'Đăng ký đã được gửi!',
        'acteur.success.message': 'Yêu cầu của bạn đã được ghi nhận.',
        'acteur.success.id_label': 'Mã định danh duy nhất của bạn:',
        'acteur.success.copy': 'Sao chép',
        'acteur.success.note': 'Giữ mã định danh này để theo dõi yêu cầu của bạn.',
        'acteur.success.link': 'Truy cập theo dõi',
        'acteur.success.close': 'Đóng',
        'footer_conformite': 'Tuân thủ APDP Benin',
        'footer_reglementation': 'Quy định FIFA',
        'footer_double_projet': 'Dự án ba mục Thể thao-Học tập-Nghề nghiệp',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.',
        'toast.error_load_sportifs': 'Lỗi tải vận động viên',
        'toast.error_load_dons': 'Lỗi tải lời kêu gọi quyên góp',
        'toast.error_load_temoignages': 'Lỗi tải lời chứng thực',
        'toast.fill_fields': 'Vui lòng điền tất cả các trường bắt buộc.',
        'toast.invalid_email': 'Email không hợp lệ',
        'toast.message_sent': 'Đã gửi tin nhắn thành công!',
        'toast.error_send': 'Lỗi gửi',
        'toast.upload_error': 'Lỗi tải lên: {error}',
        'toast.inscription_error': 'Lỗi đăng ký: {error}',
        'toast.copy_error': 'Lỗi sao chép',
        'toast.copy_success': 'Đã sao chép!',
        'toast.file_selected': 'Tệp đã chọn: {filename}',
        'empty.sportifs': 'Không tìm thấy vận động viên nào.',
        'empty.dons': 'Không tìm thấy lời kêu gọi quyên góp nào.',
        'empty.temoignages': 'Hiện chưa có lời chứng thực nào.'
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
        loadSportifs();
        loadDons();
        loadTemoignages();
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let sportifs = [];
let dons = [];
let temoignages = [];
let currentFilters = { type: 'all', sport: 'all', region: 'all', search: '' };
let currentRole = '';
let uploadedFileUrl = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
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
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function generatePPId(roleCode) {
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
    return `${randomPart}-${vaPart}-HubIS-${roleCode}-${secondsPart}-${counter}`;
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES DONNÉES ==========
async function loadSportifs() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_acteur_sportifs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        sportifs = data || [];
        renderSportifs();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_sportifs'), 'error');
    } finally {
        hideLoader();
    }
}

async function loadDons() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_acteur_dons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        dons = data || [];
        renderDons();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_dons'), 'error');
    } finally {
        hideLoader();
    }
}

async function loadTemoignages() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_acteur_temoignages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        temoignages = data || [];
        renderTemoignages();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_temoignages'), 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : FILTRES ET RENDU ==========
function filterSportifs() {
    let filtered = [...sportifs];
    if (currentFilters.sport !== 'all') {
        filtered = filtered.filter(s => s.sport === currentFilters.sport);
    }
    if (currentFilters.region !== 'all') {
        filtered = filtered.filter(s => s.region === currentFilters.region);
    }
    if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        filtered = filtered.filter(s => s.full_name?.toLowerCase().includes(search) || s.description?.toLowerCase().includes(search));
    }
    return filtered;
}

function filterDons() {
    let filtered = [...dons];
    if (currentFilters.region !== 'all') {
        filtered = filtered.filter(d => d.region === currentFilters.region);
    }
    if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        filtered = filtered.filter(d => d.title?.toLowerCase().includes(search) || d.description?.toLowerCase().includes(search));
    }
    return filtered;
}

function renderSportifs() {
    const container = document.getElementById('sportifsGrid');
    if (!container) return;
    const filtered = filterSportifs();
    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-message">${t('empty.sportifs')}</p>`;
        return;
    }
    container.innerHTML = filtered.map(s => `
        <div class="card">
            ${s.image_url ? `<img src="${s.image_url}" class="card-image" alt="${escapeHtml(s.full_name)}">` : '<div class="card-image" style="background:#e9ecef; display:flex; align-items:center; justify-content:center;"><i class="fas fa-user-circle" style="font-size:3rem; color:#ccc;"></i></div>'}
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(s.full_name)}</h3>
                <p class="card-desc">${escapeHtml(s.sport)} • ${escapeHtml(s.region)}</p>
                <p class="card-desc">${escapeHtml(s.description || '')}</p>
                <div class="card-footer">
                    <button class="btn-contact" data-type="sportif" data-id="${s.id}" data-name="${escapeHtml(s.full_name)}">Contacter</button>
                </div>
            </div>
        </div>
    `).join('');
    attachContactButtons();
}

function renderDons() {
    const container = document.getElementById('donsGrid');
    if (!container) return;
    const filtered = filterDons();
    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-message">${t('empty.dons')}</p>`;
        return;
    }
    container.innerHTML = filtered.map(d => `
        <div class="card">
            ${d.image_url ? `<img src="${d.image_url}" class="card-image" alt="${escapeHtml(d.title)}">` : '<div class="card-image" style="background:#e9ecef; display:flex; align-items:center; justify-content:center;"><i class="fas fa-hand-holding-heart" style="font-size:3rem; color:#ccc;"></i></div>'}
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(d.title)}</h3>
                <p class="card-desc">${escapeHtml(d.description || '')}</p>
                <div class="card-footer">
                    <button class="btn-contact" data-type="don" data-id="${d.id}" data-name="${escapeHtml(d.title)}">Je soutiens</button>
                </div>
            </div>
        </div>
    `).join('');
    attachContactButtons();
}

function renderTemoignages() {
    const container = document.getElementById('temoignagesGrid');
    if (!container) return;
    if (temoignages.length === 0) {
        container.innerHTML = `<p class="empty-message">${t('empty.temoignages')}</p>`;
        return;
    }
    container.innerHTML = temoignages.map(t => `
        <div class="card">
            <div class="card-content">
                <p class="card-desc">"${escapeHtml(t.content)}"</p>
                <div class="card-footer">
                    <span>— ${escapeHtml(t.author)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function attachContactButtons() {
    document.querySelectorAll('.btn-contact').forEach(btn => {
        btn.removeEventListener('click', contactHandler);
        btn.addEventListener('click', contactHandler);
    });
}

function contactHandler(e) {
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    openContactModal(type, id, name);
}
// ========== FIN : FILTRES ET RENDU ==========

// ========== DÉBUT : MODALE CONTACT ==========
function openContactModal(type, id, name) {
    document.getElementById('contactTargetType').value = type;
    document.getElementById('contactTargetId').value = id;
    document.getElementById('contactModalTitle').textContent = t('acteur.contact.title') + ' ' + name;
    document.getElementById('contactModal').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
    document.getElementById('contactForm').reset();
}

async function sendContactMessage(e) {
    e.preventDefault();
    const targetType = document.getElementById('contactTargetType').value;
    const targetId = document.getElementById('contactTargetId').value;
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    if (!email.includes('@')) {
        showToast(t('toast.invalid_email'), 'warning');
        return;
    }

    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_acteur_contacts')
            .insert([{
                target_type: targetType,
                target_id: targetId,
                sender_name: name,
                sender_email: email,
                message: message,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        showToast(t('toast.message_sent'), 'success');
        closeContactModal();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_send'), 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : MODALE CONTACT ==========

// ========== DÉBUT : OPTIONS DEVENIR ACTEUR ==========
function initActeurOptions() {
    const roles = [
        { code: 'PR', label: 'Parrain', icon: 'fas fa-hand-holding-heart', description: 'Soutenez financièrement les talents.' },
        { code: 'ST', label: 'Staff médical', icon: 'fas fa-notes-medical', description: 'Accompagnez les joueurs dans leur santé.' },
        { code: 'CO', label: 'Coach', icon: 'fas fa-chalkboard-teacher', description: 'Partagez votre expertise.' },
        { code: 'AG', label: 'Agent', icon: 'fas fa-user-tie', description: 'Représentez des sportifs.' },
        { code: 'AC', label: 'Académie', icon: 'fas fa-school', description: 'Recrutez des jeunes talents.' },
        { code: 'CL', label: 'Club', icon: 'fas fa-building', description: 'Recrutez des joueurs.' },
        { code: 'FO', label: 'Formateur', icon: 'fas fa-chalkboard', description: 'Formez la prochaine génération.' }
    ];
    const container = document.getElementById('acteurOptions');
    if (!container) return;
    container.innerHTML = roles.map(r => `
        <div class="acteur-card" data-role="${r.code}">
            <i class="${r.icon}"></i>
            <h3>${r.label}</h3>
            <p>${r.description}</p>
            <button class="btn-acteur" data-role="${r.code}">Devenir ${r.label}</button>
        </div>
    `).join('');
    document.querySelectorAll('.btn-acteur, .acteur-card').forEach(el => {
        el.addEventListener('click', (e) => {
            const roleCode = el.dataset.role || el.closest('.acteur-card')?.dataset.role;
            if (roleCode) openInscriptionModal(roleCode);
        });
    });
}
// ========== FIN : OPTIONS DEVENIR ACTEUR ==========

// ========== DÉBUT : GESTION UPLOAD FICHIER (CORRIGÉ) ==========
function setupActeurFileUpload() {
    const box = document.getElementById('uploadJustificatif');
    const input = document.getElementById('inscriptionFile');
    const statusDiv = document.getElementById('uploadStatus');
    const successDiv = document.getElementById('uploadSuccess');
    if (!box || !input) return;

    statusDiv.style.display = 'none';
    successDiv.style.display = 'none';
    uploadedFileUrl = null;

    input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;

        statusDiv.style.display = 'flex';
        successDiv.style.display = 'none';

        try {
            const fullName = document.getElementById('inscriptionFullName').value.trim() || 'candidat';
            const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
            const fileExt = file.name.split('.').pop();
            const fileName = `${safeName}_${currentRole}_${dateStr}.${fileExt}`;
            const bucket = 'acteur_documents';

            const { error } = await supabasePublic.storage.from(bucket).upload(fileName, file);
            if (error) throw error;

            const { data: urlData } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);
            uploadedFileUrl = urlData.publicUrl;

            statusDiv.style.display = 'none';
            successDiv.style.display = 'flex';
            showToast(t('toast.file_selected', { filename: file.name }), 'success');
        } catch (err) {
            console.error(err);
            statusDiv.style.display = 'none';
            showToast(t('toast.upload_error', { error: err.message }), 'error');
            input.value = '';
        }
    });
}
// ========== FIN : GESTION UPLOAD FICHIER ==========

// ========== DÉBUT : MODALE INSCRIPTION ==========
function openInscriptionModal(roleCode) {
    currentRole = roleCode;
    document.getElementById('inscriptionRole').value = roleCode;
    const roleName = {
        PR: 'Parrain', ST: 'Staff médical', CO: 'Coach', AG: 'Agent',
        AC: 'Académie', CL: 'Club', FO: 'Formateur'
    }[roleCode] || 'Acteur';
    document.getElementById('inscriptionModalTitle').textContent = t('acteur.modal.title') + ' ' + roleName;
    document.getElementById('inscriptionForm').reset();
    const roleFieldsDiv = document.getElementById('roleSpecificFields');
    roleFieldsDiv.innerHTML = `
        <div class="form-group">
            <label>Informations complémentaires</label>
            <textarea id="role_data" rows="3" placeholder="Détails sur votre motivation, expérience..."></textarea>
        </div>
    `;
    uploadedFileUrl = null;
    document.getElementById('uploadStatus').style.display = 'none';
    document.getElementById('uploadSuccess').style.display = 'none';
    document.getElementById('inscriptionFile').value = '';
    const span = document.querySelector('#uploadJustificatif span:not(.progress-text)');
    if (span) span.textContent = t('acteur.modal.upload_click');
    setupActeurFileUpload();
    document.getElementById('inscriptionModal').classList.add('active');
}

function closeInscriptionModal() {
    document.getElementById('inscriptionModal').classList.remove('active');
    currentRole = null;
}
// ========== FIN : MODALE INSCRIPTION ==========

// ========== DÉBUT : SOUMISSION FORMULAIRE INSCRIPTION ==========
document.getElementById('inscriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!uploadedFileUrl) {
        showToast('Veuillez d\'abord téléverser votre justificatif.', 'warning');
        return;
    }

    const role = document.getElementById('inscriptionRole').value;
    const fullName = document.getElementById('inscriptionFullName').value.trim();
    const email = document.getElementById('inscriptionEmail').value.trim();
    const phone = document.getElementById('inscriptionPhone').value.trim();
    const roleData = document.getElementById('role_data')?.value.trim() || '';

    if (!role || !fullName || !email || !phone) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    if (!email.includes('@')) {
        showToast(t('toast.invalid_email'), 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitInscriptionBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    try {
        const ppId = generatePPId(role);
        const roleDataObj = { additional_info: roleData };
        const { error } = await supabasePublic
            .from('public_acteur_inscriptions')
            .insert([{
                pp_id: ppId,
                role: role,
                full_name: fullName,
                email: email,
                phone: phone,
                document_url: uploadedFileUrl,
                role_data: roleDataObj,
                status: 'en_attente',
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;

        document.getElementById('trackingId').textContent = ppId;
        document.getElementById('trackingLink').href = `suivi-acteur.html?id=${ppId}`;
        document.getElementById('successModal').classList.add('active');
        closeInscriptionModal();
    } catch (err) {
        console.error(err);
        showToast(t('toast.inscription_error', { error: err.message }), 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});
// ========== FIN : SOUMISSION FORMULAIRE INSCRIPTION ==========

// ========== DÉBUT : COPIE ID ET FERMETURE MODALE SUCCÈS ==========
document.getElementById('copyTrackingBtn').addEventListener('click', () => {
    const link = document.getElementById('trackingId').textContent;
    if (link) {
        navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('copyTrackingBtn');
            btn.innerHTML = '<i class="fas fa-check"></i> ' + t('toast.copy_success');
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> ' + t('acteur.success.copy');
            }, 2000);
        }).catch(() => showToast(t('toast.copy_error'), 'error'));
    }
});

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
}
window.closeSuccessModal = closeSuccessModal;
// ========== FIN : COPIE ID ET FERMETURE MODALE SUCCÈS ==========

// ========== DÉBUT : FILTRES ==========
document.getElementById('applyFilters').addEventListener('click', () => {
    currentFilters.type = document.getElementById('filterType').value;
    currentFilters.sport = document.getElementById('filterSport').value;
    currentFilters.region = document.getElementById('filterRegion').value;
    currentFilters.search = document.getElementById('searchInput').value;
    renderSportifs();
    renderDons();
});

document.getElementById('contactForm').addEventListener('submit', sendContactMessage);
// ========== FIN : FILTRES ==========

// ========== DÉBUT : MENU MOBILE ET LANGUE ==========
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
// ========== FIN : MENU MOBILE ET LANGUE ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    showLoader();
    applyTranslations();
    initLangSelector();
    await Promise.all([loadSportifs(), loadDons(), loadTemoignages()]);
    initActeurOptions();
    initMenuMobile();
    setupActeurFileUpload();
    hideLoader();
});
// ========== FIN : INITIALISATION ==========
// ========== FIN DE ACTEURS.JS ==========