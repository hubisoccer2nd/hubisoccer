/* DEBUT : partenaires/partenaires.js */
// ========== PARTENAIRES.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : TRADUCTIONS (24 LANGUES) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'NOS CLUBS',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Connexion',
        'inscrire': 'S\'inscrire',
        'partenaires.title': 'Nos Partenaires',
        'partenaires.subtitle': 'Ils nous font confiance.',
        'partenaires.no_items': 'Aucun partenaire pour le moment.',
        'partenaires.error_load': 'Erreur lors du chargement des partenaires.',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    en: {
        'loader.message': 'Loading...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'FIRST STEP',
        'acteurs': 'BECOME AN ACTOR',
        'artiste': 'BECOME AN ARTIST',
        'nos_clubs': 'OUR CLUBS',
        'tournoi_public': 'PUBLIC TOURNAMENT',
        'esp': 'LEARN MORE',
        'connexion': 'Login',
        'inscrire': 'Sign up',
        'partenaires.title': 'Our Partners',
        'partenaires.subtitle': 'They trust us.',
        'partenaires.no_items': 'No partners yet.',
        'partenaires.error_load': 'Error loading partners.',
        'footer_conformite': 'APDP Benin Compliance',
        'footer_reglementation': 'FIFA Regulations',
        'footer_double_projet': 'Triple Sport-Studies-Career Project',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    },
    yo: {
        'loader.message': 'Nlọ...',
        'hub_market': 'ỌJÀ',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'Ilana',
        'affiliation': 'Ifọwọsi',
        'premier_pas': 'Igbese Akọkọ',
        'acteurs': 'Di Oṣere',
        'artiste': 'Di Oṣere',
        'nos_clubs': 'Awọn Ẹgbẹ Wa',
        'tournoi_public': 'Idije Gbogbo eniyan',
        'esp': 'Kọ Ẹkọ Siwaju',
        'connexion': 'Wo ile',
        'inscrire': 'Forukọsilẹ',
        'partenaires.title': 'Awọn alabaṣepọ wa',
        'partenaires.subtitle': 'Wọn gbẹkẹle wa.',
        'partenaires.no_items': 'Ko si alabaṣepọ fun bayi.',
        'partenaires.error_load': 'Aṣiṣe nigbati o n gbe awọn alabaṣepọ.',
        'footer_conformite': 'Ifaramọ APDP Benin',
        'footer_reglementation': 'Awọn ilana FIFA',
        'footer_double_projet': 'Ise agbese Idaraya-Ẹkọ-Meji',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM: RB/ABC/24 A 111814 | IFU: 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.'
    },
    fon: {
        'loader.message': 'Tɛn ɖo...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'Mǐtɔn bɔlu xɔ ɖé lɛ',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Byɔ xɔntin',
        'inscrire': 'Nyikɔ wlan',
        'partenaires.title': 'Nos Partenaires',
        'partenaires.subtitle': 'Ils nous font confiance.',
        'partenaires.no_items': 'Aucun partenaire pour le moment.',
        'partenaires.error_load': 'Erreur lors du chargement des partenaires.',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    mina: {
        'loader.message': 'Chargement...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'Míà bɔlu hɔn ɖé lɛ',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Gé ɖé émè',
        'inscrire': 'Ŋkɔ́ wlá',
        'partenaires.title': 'Nos Partenaires',
        'partenaires.subtitle': 'Ils nous font confiance.',
        'partenaires.no_items': 'Aucun partenaire pour le moment.',
        'partenaires.error_load': 'Erreur lors du chargement des partenaires.',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    lin: {
        'loader.message': 'Chargement...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'Ba Clubs na biso',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Kota',
        'inscrire': 'Komikomisa',
        'partenaires.title': 'Nos Partenaires',
        'partenaires.subtitle': 'Ils nous font confiance.',
        'partenaires.no_items': 'Aucun partenaire pour le moment.',
        'partenaires.error_load': 'Erreur lors du chargement des partenaires.',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    wol: {
        'loader.message': 'Chargement...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'Sunu clubs yi',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Dugg',
        'inscrire': 'Seetal',
        'partenaires.title': 'Nos Partenaires',
        'partenaires.subtitle': 'Ils nous font confiance.',
        'partenaires.no_items': 'Aucun partenaire pour le moment.',
        'partenaires.error_load': 'Erreur lors du chargement des partenaires.',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    diou: {
        'loader.message': 'Chargement...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'An ka clubs ni',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Dɔ́n',
        'inscrire': 'Sɛ̀bɛ̀n',
        'partenaires.title': 'Nos Partenaires',
        'partenaires.subtitle': 'Ils nous font confiance.',
        'partenaires.no_items': 'Aucun partenaire pour le moment.',
        'partenaires.error_load': 'Erreur lors du chargement des partenaires.',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    ha: {
        'loader.message': 'Ana lodi...',
        'hub_market': 'KASUWA',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'TSARI',
        'affiliation': 'ALAƘA',
        'premier_pas': 'MATAKI NA FARKO',
        'acteurs': 'ZAMA DAN WASAN',
        'artiste': 'ZAMA MAWAKI',
        'nos_clubs': 'KUNGIYOYINMU',
        'tournoi_public': 'GASAR JAM\'IYYA',
        'esp': 'KARA KOYO',
        'connexion': 'Shiga',
        'inscrire': 'Yi rajista',
        'partenaires.title': 'Abokan hulɗarmu',
        'partenaires.subtitle': 'Suna amincewa da mu.',
        'partenaires.no_items': 'Babu abokin hulɗa a yanzu.',
        'partenaires.error_load': 'Kuskure wajen loda abokan hulɗa.',
        'footer_conformite': 'APDP Benin Amincewa',
        'footer_reglementation': 'Dokokin FIFA',
        'footer_double_projet': 'Tsarin Wasanni-Ilimi-Aiki Uku',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Duk haƙƙoƙin mallaka.'
    },
    sw: {
        'loader.message': 'Inapakia...',
        'hub_market': 'SOKO',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'MCHAKATO',
        'affiliation': 'Uhusiano',
        'premier_pas': 'HATUA YA KWANZA',
        'acteurs': 'KUWA MTAALAMU',
        'artiste': 'KUWA MSANII',
        'nos_clubs': 'VILABU VYETU',
        'tournoi_public': 'MASHINDANO YA UMMA',
        'esp': 'JIFUNZE ZAIDI',
        'connexion': 'Ingia',
        'inscrire': 'Jiandikishe',
        'partenaires.title': 'Washirika wetu',
        'partenaires.subtitle': 'Wanatuamini.',
        'partenaires.no_items': 'Hakuna mshirika kwa sasa.',
        'partenaires.error_load': 'Hitilafu wakati wa kupakia washirika.',
        'footer_conformite': 'Uzingatiaji wa APDP Benin',
        'footer_reglementation': 'Kanuni za FIFA',
        'footer_double_projet': 'Mradi wa Michezo-Masomo-Kazi Mara Tatu',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Haki zote zimehifadhiwa.'
    },
    es: {
        'loader.message': 'Cargando...',
        'hub_market': 'MERCADO',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESO',
        'affiliation': 'AFILIACIÓN',
        'premier_pas': 'PRIMER PASO',
        'acteurs': 'CONVIÉRTETE EN ACTOR',
        'artiste': 'CONVIÉRTETE EN ARTISTA',
        'nos_clubs': 'NUESTROS CLUBES',
        'tournoi_public': 'TORNEO PÚBLICO',
        'esp': 'SABER MÁS',
        'connexion': 'Iniciar sesión',
        'inscrire': 'Registrarse',
        'partenaires.title': 'Nuestros Socios',
        'partenaires.subtitle': 'Ellos confían en nosotros.',
        'partenaires.no_items': 'Ningún socio por el momento.',
        'partenaires.error_load': 'Error al cargar los socios.',
        'footer_conformite': 'Conformidad APDP Benín',
        'footer_reglementation': 'Reglamento FIFA',
        'footer_double_projet': 'Triple Proyecto Deporte-Estudios-Carrera',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.'
    },
    pt: {
        'loader.message': 'Carregando...',
        'hub_market': 'MERCADO',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSO',
        'affiliation': 'AFILIAÇÃO',
        'premier_pas': 'PRIMEIRO PASSO',
        'acteurs': 'TORNE-SE UM ATOR',
        'artiste': 'TORNE-SE UM ARTISTA',
        'nos_clubs': 'NOSSOS CLUBES',
        'tournoi_public': 'TORNEIO PÚBLICO',
        'esp': 'SAIBA MAIS',
        'connexion': 'Entrar',
        'inscrire': 'Inscrever-se',
        'partenaires.title': 'Os Nossos Parceiros',
        'partenaires.subtitle': 'Eles confiam em nós.',
        'partenaires.no_items': 'Nenhum parceiro de momento.',
        'partenaires.error_load': 'Erro ao carregar os parceiros.',
        'footer_conformite': 'Conformidade APDP Benim',
        'footer_reglementation': 'Regulamento FIFA',
        'footer_double_projet': 'Triplo Projeto Desporto-Estudos-Carreira',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.'
    },
    de: {
        'loader.message': 'Laden...',
        'hub_market': 'MARKT',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROZESS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'ERSTER SCHRITT',
        'acteurs': 'WERDE AKTEUR',
        'artiste': 'WERDE KÜNSTLER',
        'nos_clubs': 'UNSERE CLUBS',
        'tournoi_public': 'ÖFFENTLICHES TURNIER',
        'esp': 'MEHR ERFAHREN',
        'connexion': 'Anmelden',
        'inscrire': 'Registrieren',
        'partenaires.title': 'Unsere Partner',
        'partenaires.subtitle': 'Sie vertrauen uns.',
        'partenaires.no_items': 'Noch keine Partner.',
        'partenaires.error_load': 'Fehler beim Laden der Partner.',
        'footer_conformite': 'APDP Benin Konformität',
        'footer_reglementation': 'FIFA-Regulierung',
        'footer_double_projet': 'Dreifachprojekt Sport-Studium-Beruf',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.'
    },
    it: {
        'loader.message': 'Caricamento...',
        'hub_market': 'MERCATO',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSO',
        'affiliation': 'AFFILIAZIONE',
        'premier_pas': 'PRIMO PASSO',
        'acteurs': 'DIVENTA UN ATTORE',
        'artiste': 'DIVENTA UN ARTISTA',
        'nos_clubs': 'I NOSTRI CLUB',
        'tournoi_public': 'TORNEO PUBBLICO',
        'esp': 'SCOPRI DI PIÙ',
        'connexion': 'Accedi',
        'inscrire': 'Registrati',
        'partenaires.title': 'I Nostri Partner',
        'partenaires.subtitle': 'Si fidano di noi.',
        'partenaires.no_items': 'Nessun partner per il momento.',
        'partenaires.error_load': 'Errore durante il caricamento dei partner.',
        'footer_conformite': 'Conformità APDP Benin',
        'footer_reglementation': 'Regolamento FIFA',
        'footer_double_projet': 'Triplo Progetto Sport-Studi-Carriera',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.'
    },
    ar: {
        'loader.message': 'جار التحميل...',
        'hub_market': 'السوق',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'الاستكشاف',
        'processus': 'العملية',
        'affiliation': 'الانتماء',
        'premier_pas': 'الخطوة الأولى',
        'acteurs': 'كن فاعلاً',
        'artiste': 'كن فناناً',
        'nos_clubs': 'أنديتنا',
        'tournoi_public': 'بطولة عامة',
        'esp': 'اعرف المزيد',
        'connexion': 'تسجيل الدخول',
        'inscrire': 'التسجيل',
        'partenaires.title': 'شركاؤنا',
        'partenaires.subtitle': 'إنهم يثقون بنا.',
        'partenaires.no_items': 'لا يوجد شركاء حالياً.',
        'partenaires.error_load': 'خطأ أثناء تحميل الشركاء.',
        'footer_conformite': 'الامتثال لـ APDP بنين',
        'footer_reglementation': 'لوائح الفيفا',
        'footer_double_projet': 'مشروع الرياضة والدراسة والمهنة الثلاثي',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.'
    },
    zh: {
        'loader.message': '加载中...',
        'hub_market': '市场',
        'hub_community': 'HUB COMMUNITY',
        'scouting': '球探',
        'processus': '流程',
        'affiliation': '隶属',
        'premier_pas': '第一步',
        'acteurs': '成为行动者',
        'artiste': '成为艺术家',
        'nos_clubs': '我们的俱乐部',
        'tournoi_public': '公开锦标赛',
        'esp': '了解更多',
        'connexion': '登录',
        'inscrire': '注册',
        'partenaires.title': '我们的合作伙伴',
        'partenaires.subtitle': '他们信任我们。',
        'partenaires.no_items': '暂无合作伙伴。',
        'partenaires.error_load': '加载合作伙伴时出错。',
        'footer_conformite': 'APDP 贝宁合规',
        'footer_reglementation': 'FIFA 规则',
        'footer_double_projet': '体育-学业-职业三重项目',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa。 版权所有。'
    },
    ru: {
        'loader.message': 'Загрузка...',
        'hub_market': 'РЫНОК',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'СКАУТИНГ',
        'processus': 'ПРОЦЕСС',
        'affiliation': 'ПАРТНЕРСТВО',
        'premier_pas': 'ПЕРВЫЙ ШАГ',
        'acteurs': 'СТАНЬ ДЕЯТЕЛЕМ',
        'artiste': 'СТАНЬ АРТИСТОМ',
        'nos_clubs': 'НАШИ КЛУБЫ',
        'tournoi_public': 'ПУБЛИЧНЫЙ ТУРНИР',
        'esp': 'УЗНАТЬ БОЛЬШЕ',
        'connexion': 'Войти',
        'inscrire': 'Регистрация',
        'partenaires.title': 'Наши Партнёры',
        'partenaires.subtitle': 'Они доверяют нам.',
        'partenaires.no_items': 'Пока нет партнёров.',
        'partenaires.error_load': 'Ошибка при загрузке партнёров.',
        'footer_conformite': 'Соответствие APDP Бенин',
        'footer_reglementation': 'Регламент ФИФА',
        'footer_double_projet': 'Тройной проект Спорт-Учёба-Карьера',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Все права защищены.'
    },
    ja: {
        'loader.message': '読み込み中...',
        'hub_market': 'マーケット',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'スカウティング',
        'processus': 'プロセス',
        'affiliation': 'アフィリエイト',
        'premier_pas': '第一歩',
        'acteurs': 'アクターになる',
        'artiste': 'アーティストになる',
        'nos_clubs': '私たちのクラブ',
        'tournoi_public': '公開トーナメント',
        'esp': 'もっと知る',
        'connexion': 'ログイン',
        'inscrire': '登録',
        'partenaires.title': '私たちのパートナー',
        'partenaires.subtitle': '彼らは私たちを信頼しています。',
        'partenaires.no_items': '現在パートナーはいません。',
        'partenaires.error_load': 'パートナーの読み込み中にエラーが発生しました。',
        'footer_conformite': 'APDP ベナン準拠',
        'footer_reglementation': 'FIFA 規則',
        'footer_double_projet': 'スポーツ・勉強・職業のトリプルプロジェクト',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. 全著作権所有。'
    },
    tr: {
        'loader.message': 'Yükleniyor...',
        'hub_market': 'PAZAR',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'SÜREÇ',
        'affiliation': 'BAĞLILIK',
        'premier_pas': 'İLK ADIM',
        'acteurs': 'AKTÖR OL',
        'artiste': 'SANATÇI OL',
        'nos_clubs': 'KULÜPLERİMİZ',
        'tournoi_public': 'AÇIK TURNUVA',
        'esp': 'DAHA FAZLA',
        'connexion': 'Giriş',
        'inscrire': 'Kaydol',
        'partenaires.title': 'Ortaklarımız',
        'partenaires.subtitle': 'Bize güveniyorlar.',
        'partenaires.no_items': 'Henüz ortak yok.',
        'partenaires.error_load': 'Ortaklar yüklenirken hata oluştu.',
        'footer_conformite': 'APDP Benin Uyumluluğu',
        'footer_reglementation': 'FIFA Düzenlemeleri',
        'footer_double_projet': 'Üçlü Proje Spor-Eğitim-Kariyer',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.'
    },
    ko: {
        'loader.message': '로딩 중...',
        'hub_market': '마켓',
        'hub_community': 'HUB COMMUNITY',
        'scouting': '스카우팅',
        'processus': '프로세스',
        'affiliation': '제휴',
        'premier_pas': '첫걸음',
        'acteurs': '액터 되기',
        'artiste': '아티스트 되기',
        'nos_clubs': '우리 클럽',
        'tournoi_public': '공개 토너먼트',
        'esp': '더 알아보기',
        'connexion': '로그인',
        'inscrire': '가입',
        'partenaires.title': '우리 파트너',
        'partenaires.subtitle': '그들은 우리를 신뢰합니다.',
        'partenaires.no_items': '현재 파트너가 없습니다.',
        'partenaires.error_load': '파트너 로딩 중 오류.',
        'footer_conformite': 'APDP 베냉 준수',
        'footer_reglementation': 'FIFA 규정',
        'footer_double_projet': '스포츠-공부-직업 삼중 프로젝트',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. 모든 권리 보유.'
    },
    hi: {
        'loader.message': 'लोड हो रहा है...',
        'hub_market': 'बाज़ार',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'स्काउटिंग',
        'processus': 'प्रक्रिया',
        'affiliation': 'संबद्धता',
        'premier_pas': 'पहला कदम',
        'acteurs': 'एक एक्टर बनें',
        'artiste': 'एक कलाकार बनें',
        'nos_clubs': 'हमारे क्लब',
        'tournoi_public': 'सार्वजनिक टूर्नामेंट',
        'esp': 'और जानें',
        'connexion': 'लॉग इन',
        'inscrire': 'साइन अप',
        'partenaires.title': 'हमारे सहयोगी',
        'partenaires.subtitle': 'वे हम पर भरोसा करते हैं।',
        'partenaires.no_items': 'अभी तक कोई सहयोगी नहीं।',
        'partenaires.error_load': 'सहयोगियों को लोड करने में त्रुटि।',
        'footer_conformite': 'APDP बेनिन अनुपालन',
        'footer_reglementation': 'फीफा नियम',
        'footer_double_projet': 'खेल-अध्ययन-पेशा तिहरा परियोजना',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।'
    },
    nl: {
        'loader.message': 'Laden...',
        'hub_market': 'MARKT',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCES',
        'affiliation': 'AFFILIATIE',
        'premier_pas': 'EERSTE STAP',
        'acteurs': 'WORD EEN ACTEUR',
        'artiste': 'WORD EEN ARTIST',
        'nos_clubs': 'ONZE CLUBS',
        'tournoi_public': 'OPENBAAR TOERNOOI',
        'esp': 'MEER WETEN',
        'connexion': 'Inloggen',
        'inscrire': 'Inschrijven',
        'partenaires.title': 'Onze Partners',
        'partenaires.subtitle': 'Zij vertrouwen ons.',
        'partenaires.no_items': 'Nog geen partners.',
        'partenaires.error_load': 'Fout bij het laden van partners.',
        'footer_conformite': 'APDP Benin Naleving',
        'footer_reglementation': 'FIFA Regelgeving',
        'footer_double_projet': 'Triple Project Sport-Studie-Beroep',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.'
    },
    pl: {
        'loader.message': 'Ładowanie...',
        'hub_market': 'RYNEK',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SKAUTING',
        'processus': 'PROCES',
        'affiliation': 'AFILIACJA',
        'premier_pas': 'PIERWSZY KROK',
        'acteurs': 'ZOSTAŃ AKTOREM',
        'artiste': 'ZOSTAŃ ARTYSTĄ',
        'nos_clubs': 'NASZE KLUBY',
        'tournoi_public': 'TURNIEJ PUBLICZNY',
        'esp': 'DOWIEDZ SIĘ WIĘCEJ',
        'connexion': 'Zaloguj',
        'inscrire': 'Zarejestruj',
        'partenaires.title': 'Nasi Partnerzy',
        'partenaires.subtitle': 'Oni nam ufają.',
        'partenaires.no_items': 'Brak partnerów.',
        'partenaires.error_load': 'Błąd podczas ładowania partnerów.',
        'footer_conformite': 'Zgodność APDP Benin',
        'footer_reglementation': 'Regulacje FIFA',
        'footer_double_projet': 'Potrójny Projekt Sport-Nauka-Zawód',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.'
    },
    vi: {
        'loader.message': 'Đang tải...',
        'hub_market': 'CHỢ',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'TUYỂN TRẠCH',
        'processus': 'QUY TRÌNH',
        'affiliation': 'LIÊN KẾT',
        'premier_pas': 'BƯỚC ĐẦU TIÊN',
        'acteurs': 'TRỞ THÀNH DIỄN VIÊN',
        'artiste': 'TRỞ THÀNH NGHỆ SĨ',
        'nos_clubs': 'CÂU LẠC BỘ CỦA CHÚNG TÔI',
        'tournoi_public': 'GIẢI ĐẤU CÔNG KHAI',
        'esp': 'TÌM HIỂU THÊM',
        'connexion': 'Đăng nhập',
        'inscrire': 'Đăng ký',
        'partenaires.title': 'Đối tác của chúng tôi',
        'partenaires.subtitle': 'Họ tin tưởng chúng tôi.',
        'partenaires.no_items': 'Chưa có đối tác nào.',
        'partenaires.error_load': 'Lỗi khi tải đối tác.',
        'footer_conformite': 'Tuân thủ APDP Benin',
        'footer_reglementation': 'Quy định FIFA',
        'footer_double_projet': 'Dự án ba mục Thể thao-Học tập-Nghề nghiệp',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.'
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
        loadPartenaires();
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

// ========== DÉBUT : CHARGEMENT DES PARTENAIRES ==========
async function loadPartenaires() {
    const container = document.getElementById('partenairesGrid');
    if (!container) return;
    container.innerHTML = `<div class="loader">${t('loader.message')}</div>`;

    try {
        const { data, error } = await supabasePublic
            .from('public_partenaires')
            .select('*')
            .order('ordre', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = `<p class="no-partenaires">${t('partenaires.no_items')}</p>`;
            return;
        }
        container.innerHTML = data.map(p => `
            <div class="partenaire-card">
                <img src="${escapeHtml(p.logo_url)}" alt="${escapeHtml(p.nom)}">
                <h3>${escapeHtml(p.nom)}</h3>
                <p>${escapeHtml(p.description || '')}</p>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="error-message">${t('partenaires.error_load')}</p>`;
    }
}
// ========== FIN : CHARGEMENT DES PARTENAIRES ==========

// ========== DÉBUT : UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    loadPartenaires();

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }

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
/* FIN : partenaires/partenaires.js */