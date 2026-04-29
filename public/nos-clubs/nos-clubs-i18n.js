// ========== NOS-CLUBS-I18N.JS ==========
// Fichier centralisé de traductions pour le module "Nos Clubs"
// Contient les 24 langues et les fonctions de traduction
// ========== DÉBUT : TRADUCTIONS ==========
const nosClubsTranslations = {
    fr: {
        // Navbar
        'nav.clubs': 'Nos Clubs',
        'nav.login': 'Connexion',
        // Header
        'header.title': 'Nos Clubs',
        'header.subtitle': 'Rejoignez un club près de chez vous. Entraînez-vous, progressez et préparez votre avenir avec la Trinité HubISoccer.',
        // Filtres
        'filter.search': 'Rechercher un club...',
        'filter.discipline_all': 'Toutes les disciplines',
        'filter.discipline_sport': 'Tous les sports',
        'filter.discipline_artiste': 'Tous les artistes',
        'filter.ville_all': 'Toutes les villes',
        'filter.statut_all': 'Tous les statuts',
        'filter.statut_actif': 'Actifs',
        'filter.statut_archive': 'Archivés',
        // Carte club
        'club.recrutement_ouvert': 'Recrutement ouvert',
        'club.presque_complet': 'Presque complet',
        'club.complet': 'Complet',
        'club.voir': 'Voir le club',
        'club.places': '{places} places',
        // Pied de page
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    en: {
        'nav.clubs': 'Our Clubs',
        'nav.login': 'Login',
        'header.title': 'Our Clubs',
        'header.subtitle': 'Join a club near you. Train, progress and prepare your future with the HubISoccer Trinity.',
        'filter.search': 'Search a club...',
        'filter.discipline_all': 'All disciplines',
        'filter.discipline_sport': 'All sports',
        'filter.discipline_artiste': 'All artists',
        'filter.ville_all': 'All cities',
        'filter.statut_all': 'All statuses',
        'filter.statut_actif': 'Active',
        'filter.statut_archive': 'Archived',
        'club.recrutement_ouvert': 'Open recruitment',
        'club.presque_complet': 'Almost full',
        'club.complet': 'Full',
        'club.voir': 'View club',
        'club.places': '{places} spots',
        'footer.rccm': 'RCCM: RB/ABC/24 A 111814 | TIN: 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    },
    // Yoruba
    yo: {
        'nav.clubs': 'Awọn Ẹgbẹ Wa',
        'nav.login': 'Wo ile',
        'header.title': 'Awọn Ẹgbẹ Wa',
        'header.subtitle': 'Darapọ mọ ẹgbẹ kan nitosi rẹ. Kọ ẹkọ, tẹsiwaju ati mura ọjọ iwaju rẹ pẹlu Mẹta HubISoccer.',
        'filter.search': 'Wa ẹgbẹ kan...',
        'filter.discipline_all': 'Gbogbo awọn ẹka',
        'filter.discipline_sport': 'Gbogbo ere idaraya',
        'filter.discipline_artiste': 'Gbogbo awọn oṣere',
        'filter.ville_all': 'Gbogbo ilu',
        'filter.statut_all': 'Gbogbo ipo',
        'filter.statut_actif': 'Nṣiṣẹ',
        'filter.statut_archive': 'Ti fipamọ',
        'club.recrutement_ouvert': 'Igbanisise ṣiṣi',
        'club.presque_complet': 'O fẹrẹ kun',
        'club.complet': 'O kun',
        'club.voir': 'Wo ẹgbẹ',
        'club.places': '{places} aaye',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.'
    },
    // Fon
    fon: {
        'nav.clubs': 'Mǐtɔn klúbù lɛ',
        'nav.login': 'Byɔ xɔntin',
        'header.title': 'Mǐtɔn klúbù lɛ',
        'header.subtitle': 'Kplɔ́n klúbù ɖé ɖò fi ɖé. Kplɔ́n, yì nukɔn bɔ sɔ́ gǎnmɛ ná sín gǎnmɛ hwɛ xá Trinité HubISoccer.',
        'filter.search': 'Dín klúbù...',
        'filter.discipline_all': 'Nǔɖé lɛ bǐ',
        'filter.discipline_sport': 'Lɔnnu lɛ bǐ',
        'filter.discipline_artiste': 'Hànjìgbɛ lɛ bǐ',
        'filter.ville_all': 'Tò lɛ bǐ',
        'filter.statut_all': 'Tɛn ɖé lɛ bǐ',
        'filter.statut_actif': 'É ɖò wà',
        'filter.statut_archive': 'É ɖò kpá',
        'club.recrutement_ouvert': 'Mɛ wlíwlí ɔ ɖò hùn',
        'club.presque_complet': 'É ɖò wú wɛ',
        'club.complet': 'É gbó',
        'club.voir': 'Kpɔ́n klúbù ɔ',
        'club.places': '{places} fí',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Acɛ bǐ ɖò alɔ mǐtɔn mɛ.'
    },
    // Mina
    mina: {
        'nav.clubs': 'Mía Ƒe Klubuwo',
        'nav.login': 'Gé ɖé émè',
        'header.title': 'Mía Ƒe Klubuwo',
        'header.subtitle': 'Ɖe klubu aɖe si le gowo me. Do ɖe ŋu, yi edzi eye nà dzra wò etsɔme ɖo ɖe HubISoccer ƒe Trinité la nu.',
        'filter.search': 'Di klubu...',
        'filter.discipline_all': 'Wɔnawo katã',
        'filter.discipline_sport': 'Kamedefefe katã',
        'filter.discipline_artiste': 'Aɖaŋudɔwɔla katã',
        'filter.ville_all': 'Duwo katã',
        'filter.statut_all': 'Nɔnɔme katã',
        'filter.statut_actif': 'Le dɔ wɔm',
        'filter.statut_archive': 'Wo xo mɔ',
        'club.recrutement_ouvert': 'Ŋkɔŋlɔɖi le viviti',
        'club.presque_complet': 'Edo kpo',
        'club.complet': 'Eyɔ fũu',
        'club.voir': 'Kpɔ klubu la',
        'club.places': '{places} teƒe',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.'
    },
    // Lingala
    lin: {
        'nav.clubs': 'Ba Clubs na Biso',
        'nav.login': 'Kota',
        'header.title': 'Ba Clubs na Biso',
        'header.subtitle': 'Zala na club pene na yo. Loba, bokóla mpe bongisa avenir na yo na Trinité HubISoccer.',
        'filter.search': 'Luka club...',
        'filter.discipline_all': 'Discipline nyonso',
        'filter.discipline_sport': 'Lisano nyonso',
        'filter.discipline_artiste': 'Ba artistes nyonso',
        'filter.ville_all': 'Ba villes nyonso',
        'filter.statut_all': 'Ba statuts nyonso',
        'filter.statut_actif': 'Ezali kosala',
        'filter.statut_archive': 'Ekomi archive',
        'club.recrutement_ouvert': 'Recrutement efungwami',
        'club.presque_complet': 'Ezalaka presque complet',
        'club.complet': 'Ekotonda',
        'club.voir': 'Tala club',
        'club.places': '{places} ba places',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Ba droits nionso ebatelami.'
    },
    // Wolof
    wol: {
        'nav.clubs': 'Sunu Clubs',
        'nav.login': 'Dugg',
        'header.title': 'Sunu Clubs',
        'header.subtitle': 'Tontu club bu jege la. Xam-xam, yokkuté ak pare seen avenir ak Trinité HubISoccer.',
        'filter.search': 'Wut club...',
        'filter.discipline_all': 'Yépp yépp',
        'filter.discipline_sport': 'Sport yi yépp',
        'filter.discipline_artiste': 'Artiste yi yépp',
        'filter.ville_all': 'Dëkk yi yépp',
        'filter.statut_all': 'Statut yi yépp',
        'filter.statut_actif': 'Di liggéey',
        'filter.statut_archive': 'Archive',
        'club.recrutement_ouvert': 'Recrutement ubbi',
        'club.presque_complet': 'Presque complet',
        'club.complet': 'Complet',
        'club.voir': 'Voir club',
        'club.places': '{places} places',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Droits yi niou teeu.'
    },
    // Dioula
    diou: {
        'nav.clubs': 'An ka Clubs',
        'nav.login': 'Dɔ́n',
        'header.title': 'An ka Clubs',
        'header.subtitle': 'Aw ka club dɔ la aw ka so. Aw ye kalan, aw ye yɔrɔ sɔrɔ ka aw ka avenir labèn ni HubISoccer Trinité ye.',
        'filter.search': 'Club nyini...',
        'filter.discipline_all': 'Discipline bɛɛ',
        'filter.discipline_sport': 'Sport bɛɛ',
        'filter.discipline_artiste': 'Artiste bɛɛ',
        'filter.ville_all': 'Dugu bɛɛ',
        'filter.statut_all': 'Statut bɛɛ',
        'filter.statut_actif': 'A bɛ baara la',
        'filter.statut_archive': 'A bɛ archive la',
        'club.recrutement_ouvert': 'Recrutement bɛ wɛrɛ',
        'club.presque_complet': 'A bɛ surunya',
        'club.complet': 'A fara',
        'club.voir': 'Club lajɛ',
        'club.places': '{places} yɔrɔ',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Sàriya bɛ̀ là.'
    },
    // Hausa
    ha: {
        'nav.clubs': 'Kungiyoyinmu',
        'nav.login': 'Shiga',
        'header.title': 'Kungiyoyinmu',
        'header.subtitle': 'Shiga kungiya kusa da kai. Koyi, ci gaba da shirya makomarka tare da Trinité HubISoccer.',
        'filter.search': 'Neman kungiya...',
        'filter.discipline_all': 'Dukkan fannoni',
        'filter.discipline_sport': 'Dukkan wasanni',
        'filter.discipline_artiste': 'Dukkan masu fasaha',
        'filter.ville_all': 'Dukkan garuruwa',
        'filter.statut_all': 'Dukkan matsayi',
        'filter.statut_actif': 'Aiki',
        'filter.statut_archive': 'Ajiyayye',
        'club.recrutement_ouvert': 'Budaddiyar daukar ma\'aikata',
        'club.presque_complet': 'Kusan cikowa',
        'club.complet': 'Cike',
        'club.voir': 'Duba kungiya',
        'club.places': '{places} wurare',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Dukkan haƙƙoƙi an kiyaye.'
    },
    // Kiswahili
    sw: {
        'nav.clubs': 'Vilabu Vyetu',
        'nav.login': 'Ingia',
        'header.title': 'Vilabu Vyetu',
        'header.subtitle': 'Jiunge na klabu iliyo karibu nawe. Jizoeze, endelea na uandae mustakabali wako na Utatu wa HubISoccer.',
        'filter.search': 'Tafuta klabu...',
        'filter.discipline_all': 'Displini zote',
        'filter.discipline_sport': 'Michezo yote',
        'filter.discipline_artiste': 'Wasanii wote',
        'filter.ville_all': 'Miji yote',
        'filter.statut_all': 'Hali zote',
        'filter.statut_actif': 'Inafanya kazi',
        'filter.statut_archive': 'Imehifadhiwa',
        'club.recrutement_ouvert': 'Uandikishaji wazi',
        'club.presque_complet': 'Karibu kamili',
        'club.complet': 'Imejaa',
        'club.voir': 'Tazama klabu',
        'club.places': '{places} nafasi',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Haki zote zimehifadhiwa.'
    },
    // Espagnol
    es: {
        'nav.clubs': 'Nuestros Clubes',
        'nav.login': 'Iniciar sesión',
        'header.title': 'Nuestros Clubes',
        'header.subtitle': 'Únete a un club cerca de ti. Entrena, progresa y prepara tu futuro con la Trinidad HubISoccer.',
        'filter.search': 'Buscar un club...',
        'filter.discipline_all': 'Todas las disciplinas',
        'filter.discipline_sport': 'Todos los deportes',
        'filter.discipline_artiste': 'Todos los artistas',
        'filter.ville_all': 'Todas las ciudades',
        'filter.statut_all': 'Todos los estados',
        'filter.statut_actif': 'Activos',
        'filter.statut_archive': 'Archivados',
        'club.recrutement_ouvert': 'Reclutamiento abierto',
        'club.presque_complet': 'Casi lleno',
        'club.complet': 'Completo',
        'club.voir': 'Ver club',
        'club.places': '{places} plazas',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.'
    },
    // Portugais
    pt: {
        'nav.clubs': 'Nossos Clubes',
        'nav.login': 'Entrar',
        'header.title': 'Nossos Clubes',
        'header.subtitle': 'Junte-se a um clube perto de si. Treine, progrida e prepare o seu futuro com a Trindade HubISoccer.',
        'filter.search': 'Pesquisar um clube...',
        'filter.discipline_all': 'Todas as disciplinas',
        'filter.discipline_sport': 'Todos os desportos',
        'filter.discipline_artiste': 'Todos os artistas',
        'filter.ville_all': 'Todas as cidades',
        'filter.statut_all': 'Todos os estatutos',
        'filter.statut_actif': 'Ativos',
        'filter.statut_archive': 'Arquivados',
        'club.recrutement_ouvert': 'Recrutamento aberto',
        'club.presque_complet': 'Quase cheio',
        'club.complet': 'Cheio',
        'club.voir': 'Ver clube',
        'club.places': '{places} vagas',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.'
    },
    // Allemand
    de: {
        'nav.clubs': 'Unsere Clubs',
        'nav.login': 'Anmelden',
        'header.title': 'Unsere Clubs',
        'header.subtitle': 'Trete einem Club in deiner Nähe bei. Trainiere, mache Fortschritte und bereite deine Zukunft mit der HubISoccer-Trinität vor.',
        'filter.search': 'Einen Club suchen...',
        'filter.discipline_all': 'Alle Disziplinen',
        'filter.discipline_sport': 'Alle Sportarten',
        'filter.discipline_artiste': 'Alle Künstler',
        'filter.ville_all': 'Alle Städte',
        'filter.statut_all': 'Alle Status',
        'filter.statut_actif': 'Aktiv',
        'filter.statut_archive': 'Archiviert',
        'club.recrutement_ouvert': 'Offene Rekrutierung',
        'club.presque_complet': 'Fast voll',
        'club.complet': 'Voll',
        'club.voir': 'Club ansehen',
        'club.places': '{places} Plätze',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.'
    },
    // Italien
    it: {
        'nav.clubs': 'I Nostri Club',
        'nav.login': 'Accedi',
        'header.title': 'I Nostri Club',
        'header.subtitle': 'Unisciti a un club vicino a te. Allenati, progredisci e prepara il tuo futuro con la Trinità HubISoccer.',
        'filter.search': 'Cerca un club...',
        'filter.discipline_all': 'Tutte le discipline',
        'filter.discipline_sport': 'Tutti gli sport',
        'filter.discipline_artiste': 'Tutti gli artisti',
        'filter.ville_all': 'Tutte le città',
        'filter.statut_all': 'Tutti gli stati',
        'filter.statut_actif': 'Attivi',
        'filter.statut_archive': 'Archiviati',
        'club.recrutement_ouvert': 'Reclutamento aperto',
        'club.presque_complet': 'Quasi pieno',
        'club.complet': 'Pieno',
        'club.voir': 'Vedi club',
        'club.places': '{places} posti',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.'
    },
    // Arabe
    ar: {
        'nav.clubs': 'أنديتنا',
        'nav.login': 'تسجيل الدخول',
        'header.title': 'أنديتنا',
        'header.subtitle': 'انضم إلى نادٍ قريب منك. تدرب، تقدم واستعد لمستقبلك مع ثالوث HubISoccer.',
        'filter.search': 'ابحث عن نادٍ...',
        'filter.discipline_all': 'كل التخصصات',
        'filter.discipline_sport': 'كل الرياضات',
        'filter.discipline_artiste': 'كل الفنانين',
        'filter.ville_all': 'كل المدن',
        'filter.statut_all': 'كل الحالات',
        'filter.statut_actif': 'نشط',
        'filter.statut_archive': 'مؤرشف',
        'club.recrutement_ouvert': 'تجنيد مفتوح',
        'club.presque_complet': 'شبه مكتمل',
        'club.complet': 'مكتمل',
        'club.voir': 'عرض النادي',
        'club.places': '{places} مقعدًا',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.'
    },
    // Chinois
    zh: {
        'nav.clubs': '我们的俱乐部',
        'nav.login': '登录',
        'header.title': '我们的俱乐部',
        'header.subtitle': '加入您附近的俱乐部。训练、进步并用 HubISoccer 三位一体规划您的未来。',
        'filter.search': '搜索俱乐部...',
        'filter.discipline_all': '所有学科',
        'filter.discipline_sport': '所有运动',
        'filter.discipline_artiste': '所有艺术家',
        'filter.ville_all': '所有城市',
        'filter.statut_all': '所有状态',
        'filter.statut_actif': '活跃',
        'filter.statut_archive': '已归档',
        'club.recrutement_ouvert': '招聘开放',
        'club.presque_complet': '几乎满员',
        'club.complet': '已满',
        'club.voir': '查看俱乐部',
        'club.places': '{places} 个名额',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa。 版权所有。'
    },
    // Russe
    ru: {
        'nav.clubs': 'Наши клубы',
        'nav.login': 'Войти',
        'header.title': 'Наши клубы',
        'header.subtitle': 'Вступите в клуб рядом с вами. Тренируйтесь, развивайтесь и готовьте своё будущее с Тринити HubISoccer.',
        'filter.search': 'Поиск клуба...',
        'filter.discipline_all': 'Все дисциплины',
        'filter.discipline_sport': 'Все виды спорта',
        'filter.discipline_artiste': 'Все артисты',
        'filter.ville_all': 'Все города',
        'filter.statut_all': 'Все статусы',
        'filter.statut_actif': 'Активные',
        'filter.statut_archive': 'Архивные',
        'club.recrutement_ouvert': 'Открытый набор',
        'club.presque_complet': 'Почти заполнен',
        'club.complet': 'Заполнен',
        'club.voir': 'Смотреть клуб',
        'club.places': '{places} мест',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Все права защищены.'
    },
    // Japonais
    ja: {
        'nav.clubs': 'クラブ一覧',
        'nav.login': 'ログイン',
        'header.title': 'クラブ一覧',
        'header.subtitle': 'お近くのクラブに参加しましょう。トレーニングを積み、成長し、HubISoccer三位一体であなたの未来を準備してください。',
        'filter.search': 'クラブを検索...',
        'filter.discipline_all': 'すべての分野',
        'filter.discipline_sport': 'すべてのスポーツ',
        'filter.discipline_artiste': 'すべてのアーティスト',
        'filter.ville_all': 'すべての都市',
        'filter.statut_all': 'すべてのステータス',
        'filter.statut_actif': 'アクティブ',
        'filter.statut_archive': 'アーカイブ',
        'club.recrutement_ouvert': '募集中',
        'club.presque_complet': 'ほぼ満員',
        'club.complet': '満員',
        'club.voir': 'クラブを見る',
        'club.places': '{places} 席',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. 無断複写・転載を禁じます。'
    },
    // Turc
    tr: {
        'nav.clubs': 'Kulüplerimiz',
        'nav.login': 'Giriş',
        'header.title': 'Kulüplerimiz',
        'header.subtitle': 'Yakınınızdaki bir kulübe katılın. Antrene edin, ilerleyin ve HubISoccer Üçlemesi ile geleceğinizi hazırlayın.',
        'filter.search': 'Kulüp ara...',
        'filter.discipline_all': 'Tüm disiplinler',
        'filter.discipline_sport': 'Tüm sporlar',
        'filter.discipline_artiste': 'Tüm sanatçılar',
        'filter.ville_all': 'Tüm şehirler',
        'filter.statut_all': 'Tüm durumlar',
        'filter.statut_actif': 'Aktif',
        'filter.statut_archive': 'Arşivlenmiş',
        'club.recrutement_ouvert': 'Açık alım',
        'club.presque_complet': 'Neredeyse dolu',
        'club.complet': 'Dolu',
        'club.voir': 'Kulübü gör',
        'club.places': '{places} yer',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.'
    },
    // Coréen
    ko: {
        'nav.clubs': '우리 클럽',
        'nav.login': '로그인',
        'header.title': '우리 클럽',
        'header.subtitle': '가까운 클럽에 가입하세요. 훈련하고 발전하며 HubISoccer 트리니티로 미래를 준비하세요.',
        'filter.search': '클럽 검색...',
        'filter.discipline_all': '모든 분야',
        'filter.discipline_sport': '모든 스포츠',
        'filter.discipline_artiste': '모든 예술가',
        'filter.ville_all': '모든 도시',
        'filter.statut_all': '모든 상태',
        'filter.statut_actif': '활성',
        'filter.statut_archive': '보관됨',
        'club.recrutement_ouvert': '모집 중',
        'club.presque_complet': '거의 만석',
        'club.complet': '만석',
        'club.voir': '클럽 보기',
        'club.places': '{places} 자리',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. 모든 권리 보유.'
    },
    // Hindi
    hi: {
        'nav.clubs': 'हमारे क्लब',
        'nav.login': 'लॉग इन',
        'header.title': 'हमारे क्लब',
        'header.subtitle': 'अपने पास के क्लब में शामिल हों। प्रशिक्षण लें, आगे बढ़ें और HubISoccer त्रिमूर्ति के साथ अपना भविष्य तैयार करें।',
        'filter.search': 'क्लब खोजें...',
        'filter.discipline_all': 'सभी विधाएँ',
        'filter.discipline_sport': 'सभी खेल',
        'filter.discipline_artiste': 'सभी कलाकार',
        'filter.ville_all': 'सभी शहर',
        'filter.statut_all': 'सभी स्थिति',
        'filter.statut_actif': 'सक्रिय',
        'filter.statut_archive': 'संग्रहीत',
        'club.recrutement_ouvert': 'भर्ती खुली',
        'club.presque_complet': 'लगभग पूर्ण',
        'club.complet': 'पूर्ण',
        'club.voir': 'क्लब देखें',
        'club.places': '{places} स्थान',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।'
    },
    // Néerlandais
    nl: {
        'nav.clubs': 'Onze Clubs',
        'nav.login': 'Inloggen',
        'header.title': 'Onze Clubs',
        'header.subtitle': 'Word lid van een club bij jou in de buurt. Train, maak vorderingen en bereid je toekomst voor met de HubISoccer Drie-eenheid.',
        'filter.search': 'Zoek een club...',
        'filter.discipline_all': 'Alle disciplines',
        'filter.discipline_sport': 'Alle sporten',
        'filter.discipline_artiste': 'Alle artiesten',
        'filter.ville_all': 'Alle steden',
        'filter.statut_all': 'Alle statussen',
        'filter.statut_actif': 'Actief',
        'filter.statut_archive': 'Gearchiveerd',
        'club.recrutement_ouvert': 'Open aanwerving',
        'club.presque_complet': 'Bijna vol',
        'club.complet': 'Vol',
        'club.voir': 'Bekijk club',
        'club.places': '{places} plaatsen',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.'
    },
    // Polonais
    pl: {
        'nav.clubs': 'Nasze Kluby',
        'nav.login': 'Zaloguj się',
        'header.title': 'Nasze Kluby',
        'header.subtitle': 'Dołącz do klubu w swojej okolicy. Trenuj, rozwijaj się i przygotuj swoją przyszłość z Trójcą HubISoccer.',
        'filter.search': 'Szukaj klubu...',
        'filter.discipline_all': 'Wszystkie dyscypliny',
        'filter.discipline_sport': 'Wszystkie sporty',
        'filter.discipline_artiste': 'Wszyscy artyści',
        'filter.ville_all': 'Wszystkie miasta',
        'filter.statut_all': 'Wszystkie statusy',
        'filter.statut_actif': 'Aktywne',
        'filter.statut_archive': 'Zarchiwizowane',
        'club.recrutement_ouvert': 'Otwarta rekrutacja',
        'club.presque_complet': 'Prawie pełny',
        'club.complet': 'Pełny',
        'club.voir': 'Zobacz klub',
        'club.places': '{places} miejsc',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.'
    },
    // Vietnamien
    vi: {
        'nav.clubs': 'Câu lạc bộ của chúng tôi',
        'nav.login': 'Đăng nhập',
        'header.title': 'Câu lạc bộ của chúng tôi',
        'header.subtitle': 'Tham gia một câu lạc bộ gần bạn. Tập luyện, tiến bộ và chuẩn bị tương lai của bạn với Bộ Ba HubISoccer.',
        'filter.search': 'Tìm kiếm câu lạc bộ...',
        'filter.discipline_all': 'Tất cả các môn',
        'filter.discipline_sport': 'Tất cả các môn thể thao',
        'filter.discipline_artiste': 'Tất cả nghệ sĩ',
        'filter.ville_all': 'Tất cả thành phố',
        'filter.statut_all': 'Tất cả trạng thái',
        'filter.statut_actif': 'Đang hoạt động',
        'filter.statut_archive': 'Đã lưu trữ',
        'club.recrutement_ouvert': 'Tuyển dụng mở',
        'club.presque_complet': 'Gần đầy',
        'club.complet': 'Đầy',
        'club.voir': 'Xem câu lạc bộ',
        'club.places': '{places} chỗ',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.'
    }
};

// ========== DÉBUT : FONCTIONS DE TRADUCTION ==========
let nosClubsCurrentLang = localStorage.getItem('nosclubs_lang') || navigator.language.split('-')[0];
if (!nosClubsTranslations[nosClubsCurrentLang]) nosClubsCurrentLang = 'fr';

function nosClubsT(key, params = {}) {
    let text = nosClubsTranslations[nosClubsCurrentLang]?.[key] || nosClubsTranslations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

function nosClubsSetLanguage(lang) {
    if (nosClubsTranslations[lang]) {
        nosClubsCurrentLang = lang;
        localStorage.setItem('nosclubs_lang', lang);
        if (typeof applyNosClubsTranslations === 'function') {
            applyNosClubsTranslations();
        }
    }
}

function applyNosClubsTranslations(scope = document) {
    scope.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.hasAttribute('data-i18n-placeholder')) {
                el.placeholder = nosClubsT(key);
            } else {
                el.innerHTML = nosClubsT(key);
            }
        }
    });
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========
// ========== FIN DE NOS-CLUBS-I18N.JS ==========