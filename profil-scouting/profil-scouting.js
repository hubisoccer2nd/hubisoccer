/* DEBUT : profil-scouting/profil-scouting.js */
// ========== PROFIL-SCOUTING.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : TRADUCTIONS (24 LANGUES) ==========
const translations = {
    fr: {
      'loader.message': 'Chargement...',
      'profil.back': 'Retour',
      'profil.title': 'Profil du talent',
      'profil.sport': 'Sport',
      'profil.poste': 'Poste',
      'profil.age': 'Âge',
      'profil.pays': 'Pays',
      'profil.continent': 'Continent',
      'profil.categorie': 'Catégorie',
      'profil.club': 'Club',
      'profil.certification': 'Certification',
      'profil.video': 'Vidéo de présentation',
      'profil.not_found': 'Talent introuvable.',
      'profil.error_load': 'Erreur lors du chargement du profil.',
      'sport_label.football': 'Football',
      'sport_label.basketball': 'Basketball',
      'sport_label.tennis': 'Tennis',
      'sport_label.athletisme': 'Athlétisme',
      'sport_label.handball': 'Handball',
      'sport_label.volleyball': 'Volley‑ball',
      'sport_label.rugby': 'Rugby',
      'sport_label.natation': 'Natation',
      'sport_label.arts_martiaux': 'Arts martiaux',
      'sport_label.cyclisme': 'Cyclisme',
      'continent_label.Afrique': 'Afrique',
      'continent_label.Europe': 'Europe',
      'continent_label.Asie': 'Asie',
      'continent_label.Amérique': 'Amérique',
      'continent_label.Océanie': 'Océanie'
    },
    en: {
      'loader.message': 'Loading...',
      'profil.back': 'Back',
      'profil.title': 'Talent Profile',
      'profil.sport': 'Sport',
      'profil.poste': 'Position',
      'profil.age': 'Age',
      'profil.pays': 'Country',
      'profil.continent': 'Continent',
      'profil.categorie': 'Category',
      'profil.club': 'Club',
      'profil.certification': 'Certification',
      'profil.video': 'Presentation video',
      'profil.not_found': 'Talent not found.',
      'profil.error_load': 'Error loading profile.',
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
      'continent_label.Afrique': 'Africa',
      'continent_label.Europe': 'Europe',
      'continent_label.Asie': 'Asia',
      'continent_label.Amérique': 'America',
      'continent_label.Océanie': 'Oceania'
    },
        yo: {
        'loader.message': 'Nlọ...',
        'profil.back': 'Pada',
        'profil.title': 'Profaili talenti',
        'profil.sport': 'Idaraya',
        'profil.poste': 'Ipo',
        'profil.age': 'Ọjọ ori',
        'profil.pays': 'Orilẹ-ede',
        'profil.continent': 'Continent',
        'profil.categorie': 'Ẹka',
        'profil.club': 'Club',
        'profil.certification': 'Ijẹrisi',
        'profil.video': 'Fidio ifihan',
        'profil.not_found': 'A ko ri talenti.',
        'profil.error_load': 'Aṣiṣe nigbati o n gbe profaili.',
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
        'continent_label.Afrique': 'Afrika',
        'continent_label.Europe': 'Yuroopu',
        'continent_label.Asie': 'Asia',
        'continent_label.Amérique': 'Amẹrika',
        'continent_label.Océanie': 'Oseania'
      },
      fon: {
        'loader.message': 'Tɛn ɖo...',
        'profil.back': 'Retour',
        'profil.title': 'Profil du talent',
        'profil.sport': 'Sport',
        'profil.poste': 'Poste',
        'profil.age': 'Âge',
        'profil.pays': 'Pays',
        'profil.continent': 'Continent',
        'profil.categorie': 'Catégorie',
        'profil.club': 'Club',
        'profil.certification': 'Certification',
        'profil.video': 'Vidéo de présentation',
        'profil.not_found': 'Talent introuvable.',
        'profil.error_load': 'Erreur lors du chargement du profil.',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley‑ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'continent_label.Afrique': 'Afrique',
        'continent_label.Europe': 'Europe',
        'continent_label.Asie': 'Asie',
        'continent_label.Amérique': 'Amérique',
        'continent_label.Océanie': 'Océanie'
      },
      mina: {
        'loader.message': 'Chargement...',
        'profil.back': 'Retour',
        'profil.title': 'Profil du talent',
        'profil.sport': 'Sport',
        'profil.poste': 'Poste',
        'profil.age': 'Âge',
        'profil.pays': 'Pays',
        'profil.continent': 'Continent',
        'profil.categorie': 'Catégorie',
        'profil.club': 'Club',
        'profil.certification': 'Certification',
        'profil.video': 'Vidéo de présentation',
        'profil.not_found': 'Talent introuvable.',
        'profil.error_load': 'Erreur lors du chargement du profil.',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley‑ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'continent_label.Afrique': 'Afrique',
        'continent_label.Europe': 'Europe',
        'continent_label.Asie': 'Asie',
        'continent_label.Amérique': 'Amérique',
        'continent_label.Océanie': 'Océanie'
      },
      lin: {
        'loader.message': 'Chargement...',
        'profil.back': 'Retour',
        'profil.title': 'Profil du talent',
        'profil.sport': 'Sport',
        'profil.poste': 'Poste',
        'profil.age': 'Âge',
        'profil.pays': 'Pays',
        'profil.continent': 'Continent',
        'profil.categorie': 'Catégorie',
        'profil.club': 'Club',
        'profil.certification': 'Certification',
        'profil.video': 'Vidéo de présentation',
        'profil.not_found': 'Talent introuvable.',
        'profil.error_load': 'Erreur lors du chargement du profil.',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley‑ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'continent_label.Afrique': 'Afrique',
        'continent_label.Europe': 'Europe',
        'continent_label.Asie': 'Asie',
        'continent_label.Amérique': 'Amérique',
        'continent_label.Océanie': 'Océanie'
      },
      wol: {
        'loader.message': 'Chargement...',
        'profil.back': 'Retour',
        'profil.title': 'Profil du talent',
        'profil.sport': 'Sport',
        'profil.poste': 'Poste',
        'profil.age': 'Âge',
        'profil.pays': 'Pays',
        'profil.continent': 'Continent',
        'profil.categorie': 'Catégorie',
        'profil.club': 'Club',
        'profil.certification': 'Certification',
        'profil.video': 'Vidéo de présentation',
        'profil.not_found': 'Talent introuvable.',
        'profil.error_load': 'Erreur lors du chargement du profil.',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley‑ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'continent_label.Afrique': 'Afrique',
        'continent_label.Europe': 'Europe',
        'continent_label.Asie': 'Asie',
        'continent_label.Amérique': 'Amérique',
        'continent_label.Océanie': 'Océanie'
      },
      diou: {
        'loader.message': 'Chargement...',
        'profil.back': 'Retour',
        'profil.title': 'Profil du talent',
        'profil.sport': 'Sport',
        'profil.poste': 'Poste',
        'profil.age': 'Âge',
        'profil.pays': 'Pays',
        'profil.continent': 'Continent',
        'profil.categorie': 'Catégorie',
        'profil.club': 'Club',
        'profil.certification': 'Certification',
        'profil.video': 'Vidéo de présentation',
        'profil.not_found': 'Talent introuvable.',
        'profil.error_load': 'Erreur lors du chargement du profil.',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley‑ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'continent_label.Afrique': 'Afrique',
        'continent_label.Europe': 'Europe',
        'continent_label.Asie': 'Asie',
        'continent_label.Amérique': 'Amérique',
        'continent_label.Océanie': 'Océanie'
      },
          ha: {
        'loader.message': 'Ana lodi...',
        'profil.back': 'Koma',
        'profil.title': 'Bayanin martaba',
        'profil.sport': 'Wasanni',
        'profil.poste': 'Matsayi',
        'profil.age': 'Shekaru',
        'profil.pays': 'Ƙasa',
        'profil.continent': 'Nahiya',
        'profil.categorie': 'Rukuni',
        'profil.club': 'Kungiya',
        'profil.certification': 'Shaida',
        'profil.video': 'Bidiyon gabatarwa',
        'profil.not_found': 'Ba a sami baiwa ba.',
        'profil.error_load': 'Kuskure wajen loda bayanin.',
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
        'continent_label.Afrique': 'Afrika',
        'continent_label.Europe': 'Turai',
        'continent_label.Asie': 'Asiya',
        'continent_label.Amérique': 'Amurka',
        'continent_label.Océanie': 'Oseaniya'
      },
      sw: {
        'loader.message': 'Inapakia...',
        'profil.back': 'Rudi',
        'profil.title': 'Wasifu wa talanta',
        'profil.sport': 'Mchezo',
        'profil.poste': 'Nafasi',
        'profil.age': 'Umri',
        'profil.pays': 'Nchi',
        'profil.continent': 'Bara',
        'profil.categorie': 'Kategoria',
        'profil.club': 'Klabu',
        'profil.certification': 'Uthibitisho',
        'profil.video': 'Video ya uwasilishaji',
        'profil.not_found': 'Talanta haipatikani.',
        'profil.error_load': 'Hitilafu wakati wa kupakia wasifu.',
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
        'continent_label.Afrique': 'Afrika',
        'continent_label.Europe': 'Ulaya',
        'continent_label.Asie': 'Asia',
        'continent_label.Amérique': 'Amerika',
        'continent_label.Océanie': 'Oceania'
      },
      es: {
        'loader.message': 'Cargando...',
        'profil.back': 'Volver',
        'profil.title': 'Perfil del talento',
        'profil.sport': 'Deporte',
        'profil.poste': 'Posición',
        'profil.age': 'Edad',
        'profil.pays': 'País',
        'profil.continent': 'Continente',
        'profil.categorie': 'Categoría',
        'profil.club': 'Club',
        'profil.certification': 'Certificación',
        'profil.video': 'Video de presentación',
        'profil.not_found': 'Talento no encontrado.',
        'profil.error_load': 'Error al cargar el perfil.',
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
        'continent_label.Afrique': 'África',
        'continent_label.Europe': 'Europa',
        'continent_label.Asie': 'Asia',
        'continent_label.Amérique': 'América',
        'continent_label.Océanie': 'Oceanía'
      },
      pt: {
        'loader.message': 'Carregando...',
        'profil.back': 'Voltar',
        'profil.title': 'Perfil do talento',
        'profil.sport': 'Desporto',
        'profil.poste': 'Posição',
        'profil.age': 'Idade',
        'profil.pays': 'País',
        'profil.continent': 'Continente',
        'profil.categorie': 'Categoria',
        'profil.club': 'Clube',
        'profil.certification': 'Certificação',
        'profil.video': 'Vídeo de apresentação',
        'profil.not_found': 'Talento não encontrado.',
        'profil.error_load': 'Erro ao carregar o perfil.',
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
        'continent_label.Afrique': 'África',
        'continent_label.Europe': 'Europa',
        'continent_label.Asie': 'Ásia',
        'continent_label.Amérique': 'América',
        'continent_label.Océanie': 'Oceânia'
      },
      de: {
        'loader.message': 'Laden...',
        'profil.back': 'Zurück',
        'profil.title': 'Talentprofil',
        'profil.sport': 'Sport',
        'profil.poste': 'Position',
        'profil.age': 'Alter',
        'profil.pays': 'Land',
        'profil.continent': 'Kontinent',
        'profil.categorie': 'Kategorie',
        'profil.club': 'Verein',
        'profil.certification': 'Zertifizierung',
        'profil.video': 'Präsentationsvideo',
        'profil.not_found': 'Talent nicht gefunden.',
        'profil.error_load': 'Fehler beim Laden des Profils.',
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
        'continent_label.Afrique': 'Afrika',
        'continent_label.Europe': 'Europa',
        'continent_label.Asie': 'Asien',
        'continent_label.Amérique': 'Amerika',
        'continent_label.Océanie': 'Ozeanien'
      },
      it: {
        'loader.message': 'Caricamento...',
        'profil.back': 'Indietro',
        'profil.title': 'Profilo del talento',
        'profil.sport': 'Sport',
        'profil.poste': 'Posizione',
        'profil.age': 'Età',
        'profil.pays': 'Paese',
        'profil.continent': 'Continente',
        'profil.categorie': 'Categoria',
        'profil.club': 'Club',
        'profil.certification': 'Certificazione',
        'profil.video': 'Video di presentazione',
        'profil.not_found': 'Talento non trovato.',
        'profil.error_load': 'Errore nel caricamento del profilo.',
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
        'continent_label.Afrique': 'Africa',
        'continent_label.Europe': 'Europa',
        'continent_label.Asie': 'Asia',
        'continent_label.Amérique': 'America',
        'continent_label.Océanie': 'Oceania'
      },
          ar: {
        'loader.message': 'جار التحميل...',
        'profil.back': 'عودة',
        'profil.title': 'الملف الشخصي للموهبة',
        'profil.sport': 'الرياضة',
        'profil.poste': 'المركز',
        'profil.age': 'العمر',
        'profil.pays': 'البلد',
        'profil.continent': 'القارة',
        'profil.categorie': 'الفئة',
        'profil.club': 'النادي',
        'profil.certification': 'الشهادة',
        'profil.video': 'فيديو تعريفي',
        'profil.not_found': 'الموهبة غير موجودة.',
        'profil.error_load': 'خطأ أثناء تحميل الملف الشخصي.',
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
        'continent_label.Afrique': 'أفريقيا',
        'continent_label.Europe': 'أوروبا',
        'continent_label.Asie': 'آسيا',
        'continent_label.Amérique': 'أمريكا',
        'continent_label.Océanie': 'أوقيانوسيا'
    },
    zh: {
        'loader.message': '加载中...',
        'profil.back': '返回',
        'profil.title': '人才档案',
        'profil.sport': '运动',
        'profil.poste': '位置',
        'profil.age': '年龄',
        'profil.pays': '国家',
        'profil.continent': '大洲',
        'profil.categorie': '类别',
        'profil.club': '俱乐部',
        'profil.certification': '认证',
        'profil.video': '介绍视频',
        'profil.not_found': '未找到人才。',
        'profil.error_load': '加载档案时出错。',
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
        'continent_label.Afrique': '非洲',
        'continent_label.Europe': '欧洲',
        'continent_label.Asie': '亚洲',
        'continent_label.Amérique': '美洲',
        'continent_label.Océanie': '大洋洲'
    },
    ru: {
        'loader.message': 'Загрузка...',
        'profil.back': 'Назад',
        'profil.title': 'Профиль таланта',
        'profil.sport': 'Спорт',
        'profil.poste': 'Позиция',
        'profil.age': 'Возраст',
        'profil.pays': 'Страна',
        'profil.continent': 'Континент',
        'profil.categorie': 'Категория',
        'profil.club': 'Клуб',
        'profil.certification': 'Сертификация',
        'profil.video': 'Видеопрезентация',
        'profil.not_found': 'Талант не найден.',
        'profil.error_load': 'Ошибка при загрузке профиля.',
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
        'continent_label.Afrique': 'Африка',
        'continent_label.Europe': 'Европа',
        'continent_label.Asie': 'Азия',
        'continent_label.Amérique': 'Америка',
        'continent_label.Océanie': 'Океания'
    },
    ja: {
        'loader.message': '読み込み中...',
        'profil.back': '戻る',
        'profil.title': 'タレントプロフィール',
        'profil.sport': 'スポーツ',
        'profil.poste': 'ポジション',
        'profil.age': '年齢',
        'profil.pays': '国',
        'profil.continent': '大陸',
        'profil.categorie': 'カテゴリ',
        'profil.club': 'クラブ',
        'profil.certification': '認証',
        'profil.video': '紹介ビデオ',
        'profil.not_found': 'タレントが見つかりません。',
        'profil.error_load': 'プロフィールの読み込みエラー。',
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
        'continent_label.Afrique': 'アフリカ',
        'continent_label.Europe': 'ヨーロッパ',
        'continent_label.Asie': 'アジア',
        'continent_label.Amérique': 'アメリカ',
        'continent_label.Océanie': 'オセアニア'
    },
    tr: {
        'loader.message': 'Yükleniyor...',
        'profil.back': 'Geri',
        'profil.title': 'Yetenek Profili',
        'profil.sport': 'Spor',
        'profil.poste': 'Pozisyon',
        'profil.age': 'Yaş',
        'profil.pays': 'Ülke',
        'profil.continent': 'Kıta',
        'profil.categorie': 'Kategori',
        'profil.club': 'Kulüp',
        'profil.certification': 'Sertifika',
        'profil.video': 'Tanıtım videosu',
        'profil.not_found': 'Yetenek bulunamadı.',
        'profil.error_load': 'Profil yüklenirken hata oluştu.',
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
        'continent_label.Afrique': 'Afrika',
        'continent_label.Europe': 'Avrupa',
        'continent_label.Asie': 'Asya',
        'continent_label.Amérique': 'Amerika',
        'continent_label.Océanie': 'Okyanusya'
    },
    ko: {
        'loader.message': '로딩 중...',
        'profil.back': '뒤로',
        'profil.title': '인재 프로필',
        'profil.sport': '스포츠',
        'profil.poste': '포지션',
        'profil.age': '나이',
        'profil.pays': '국가',
        'profil.continent': '대륙',
        'profil.categorie': '카테고리',
        'profil.club': '클럽',
        'profil.certification': '인증',
        'profil.video': '소개 영상',
        'profil.not_found': '인재를 찾을 수 없습니다.',
        'profil.error_load': '프로필 로딩 오류.',
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
        'continent_label.Afrique': '아프리카',
        'continent_label.Europe': '유럽',
        'continent_label.Asie': '아시아',
        'continent_label.Amérique': '아메리카',
        'continent_label.Océanie': '오세아니아'
    },
    hi: {
        'loader.message': 'लोड हो रहा है...',
        'profil.back': 'वापस',
        'profil.title': 'प्रतिभा प्रोफ़ाइल',
        'profil.sport': 'खेल',
        'profil.poste': 'पद',
        'profil.age': 'आयु',
        'profil.pays': 'देश',
        'profil.continent': 'महाद्वीप',
        'profil.categorie': 'श्रेणी',
        'profil.club': 'क्लब',
        'profil.certification': 'प्रमाणन',
        'profil.video': 'प्रस्तुति वीडियो',
        'profil.not_found': 'प्रतिभा नहीं मिली।',
        'profil.error_load': 'प्रोफ़ाइल लोड करने में त्रुटि।',
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
        'continent_label.Afrique': 'अफ्रीका',
        'continent_label.Europe': 'यूरोप',
        'continent_label.Asie': 'एशिया',
        'continent_label.Amérique': 'अमेरिका',
        'continent_label.Océanie': 'ओशिनिया'
    },
    nl: {
        'loader.message': 'Laden...',
        'profil.back': 'Terug',
        'profil.title': 'Talentprofiel',
        'profil.sport': 'Sport',
        'profil.poste': 'Positie',
        'profil.age': 'Leeftijd',
        'profil.pays': 'Land',
        'profil.continent': 'Continent',
        'profil.categorie': 'Categorie',
        'profil.club': 'Club',
        'profil.certification': 'Certificering',
        'profil.video': 'Presentatievideo',
        'profil.not_found': 'Talent niet gevonden.',
        'profil.error_load': 'Fout bij laden profiel.',
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
        'continent_label.Afrique': 'Afrika',
        'continent_label.Europe': 'Europa',
        'continent_label.Asie': 'Azië',
        'continent_label.Amérique': 'Amerika',
        'continent_label.Océanie': 'Oceanië'
    },
    pl: {
        'loader.message': 'Ładowanie...',
        'profil.back': 'Wstecz',
        'profil.title': 'Profil talentu',
        'profil.sport': 'Sport',
        'profil.poste': 'Pozycja',
        'profil.age': 'Wiek',
        'profil.pays': 'Kraj',
        'profil.continent': 'Kontynent',
        'profil.categorie': 'Kategoria',
        'profil.club': 'Klub',
        'profil.certification': 'Certyfikat',
        'profil.video': 'Film prezentacyjny',
        'profil.not_found': 'Nie znaleziono talentu.',
        'profil.error_load': 'Błąd ładowania profilu.',
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
        'continent_label.Afrique': 'Afryka',
        'continent_label.Europe': 'Europa',
        'continent_label.Asie': 'Azja',
        'continent_label.Amérique': 'Ameryka',
        'continent_label.Océanie': 'Oceania'
    },
    vi: {
        'loader.message': 'Đang tải...',
        'profil.back': 'Quay lại',
        'profil.title': 'Hồ sơ tài năng',
        'profil.sport': 'Thể thao',
        'profil.poste': 'Vị trí',
        'profil.age': 'Tuổi',
        'profil.pays': 'Quốc gia',
        'profil.continent': 'Châu lục',
        'profil.categorie': 'Hạng mục',
        'profil.club': 'Câu lạc bộ',
        'profil.certification': 'Chứng nhận',
        'profil.video': 'Video giới thiệu',
        'profil.not_found': 'Không tìm thấy tài năng.',
        'profil.error_load': 'Lỗi khi tải hồ sơ.',
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
        'continent_label.Afrique': 'Châu Phi',
        'continent_label.Europe': 'Châu Âu',
        'continent_label.Asie': 'Châu Á',
        'continent_label.Amérique': 'Châu Mỹ',
        'continent_label.Océanie': 'Châu Đại Dương'
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
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) loadProfil(id);
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

// ========== DÉBUT : UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT ET AFFICHAGE DU PROFIL ==========
async function loadProfil(id) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_scouting_sportifs')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            document.getElementById('profilContainer').innerHTML = `<p class="not-found">${t('profil.not_found')}</p>`;
            return;
        }
        renderProfil(data);
    } catch (err) {
        console.error(err);
        document.getElementById('profilContainer').innerHTML = `<p class="error-message">${t('profil.error_load')}</p>`;
    } finally {
        hideLoader();
    }
}

function renderProfil(talent) {
    const container = document.getElementById('profilContainer');
    let html = `
        <div class="profil-card">
            <div class="profil-image">
                <img src="${talent.image_url || '../public/img/user-default.jpg'}" alt="${escapeHtml(talent.nom)}">
            </div>
            <div class="profil-info">
                <h1>${escapeHtml(talent.nom)}</h1>
                <p class="profil-poste">${t(`sport_label.${talent.cat}`) || talent.cat} - ${escapeHtml(talent.poste)}</p>
                <div class="profil-details">
                    <div class="detail-item"><strong>${t('profil.age')}</strong><span>${talent.age} ans</span></div>
                    <div class="detail-item"><strong>${t('profil.pays')}</strong><span>${escapeHtml(talent.pays)}</span></div>
                    <div class="detail-item"><strong>${t('profil.continent')}</strong><span>${t(`continent_label.${talent.continent}`) || talent.continent}</span></div>
                    <div class="detail-item"><strong>${t('profil.categorie')}</strong><span>${escapeHtml(talent.cat)}</span></div>
                    <div class="detail-item"><strong>${t('profil.club')}</strong><span>${escapeHtml(talent.club) || '-'}</span></div>
                    <div class="detail-item"><strong>${t('profil.certification')}</strong><span>${escapeHtml(talent.cert) || '-'}</span></div>
                </div>
    `;
    if (talent.video_url) {
        html += `
            <div class="profil-video">
                <h3>${t('profil.video')}</h3>
                <video controls style="width:100%; max-width: 600px; border-radius: 12px;">
                    <source src="${talent.video_url}" type="video/mp4">
                    Votre navigateur ne supporte pas la lecture de vidéo.
                </video>
            </div>
        `;
    }
    html += `</div></div>`;
    container.innerHTML = html;
}
// ========== FIN : CHARGEMENT ET AFFICHAGE DU PROFIL ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        loadProfil(id);
    } else {
        window.location.href = '../scouting/';
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
/* FIN : profil-scouting/profil-scouting.js */