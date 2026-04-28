// ========== 404.JS ==========
// ========== GESTION DU MENU MOBILE ==========
document.addEventListener('click', function(e) {
    const menuToggle = e.target.closest('#menuToggle');
    if (menuToggle) {
        e.preventDefault();
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        }
        return;
    }
    if (!e.target.closest('.nav-links') && !e.target.closest('#menuToggle')) {
        const navLinks = document.getElementById('navLinks');
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const toggle = document.getElementById('menuToggle');
            if (toggle) toggle.classList.remove('open');
        }
    }
});

// ========== TRADUCTIONS (24 LANGUES) ==========
const translations = {
    // Français
    fr: {
        oops: "Oups ! Page introuvable",
        desc_404: "La page que vous cherchez a peut-être été déplacée, renommée ou n'existe pas.",
        back_home: "← Retour à l'accueil",
        footer_conformite: "Conformité APDP Bénin",
        footer_reglementation: "Règlementation FIFA",
        footer_double_projet: "Triple Projet Sport-Études-Carrière",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Tous droits réservés.",
        connexion: "Connexion",
        inscrire: "S'inscrire",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Anglais
    en: {
        oops: "Oops! Page not found",
        desc_404: "The page you are looking for may have been moved, renamed or does not exist.",
        back_home: "← Back to home",
        footer_conformite: "APDP Benin Compliance",
        footer_reglementation: "FIFA Regulations",
        footer_double_projet: "Triple Sport-Studies-Career Project",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM: RB/ABC/24 A 111814 | TIN: 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. All rights reserved.",
        connexion: "Login",
        inscrire: "Sign up",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "Hub Community",
        scouting: "Scouting",
        processus: "Process",
        affiliation: "AFFILIATION",
        premier_pas: "FIRST STEP",
        acteurs: "BECOME AN ACTOR",
        artiste: "BECOME AN ARTIST",
        tournoi_public: "Public Tournament",
        esp: "LEARN MORE"
    },
    // Yoruba
    yo: {
        oops: "Yeee! Oju-iwe ko ri",
        desc_404: "Oju-iwe ti o n wa le ti gbe, ti tun lorukọ tabi ko si.",
        back_home: "← Pada si ile",
        footer_conformite: "Ifaramọ APDP Benin",
        footer_reglementation: "Awọn ilana FIFA",
        footer_double_projet: "Ise agbese Idaraya-Ẹkọ-Meji",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM: RB/ABC/24 A 111814 | IFU: 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.",
        connexion: "Wo ile",
        inscrire: "Forukọsilẹ",
        hub_market: "HUBISOCCER ỌJA",
        hub_community: "Agbegbe Hub",
        scouting: "Wiwa",
        processus: "Ilana",
        affiliation: "IFỌWỌSI",
        premier_pas: "IGBESE AKỌKỌ",
        acteurs: "DI Oṣere",
        artiste: "DI Oṣere",
        tournoi_public: "Idije Gbogbo eniyan",
        esp: "KỌ ẸKỌ SIWAJU"
    },
    // Fon
    fon: {
        oops: "Yeee! Wema ma ɖe",
        desc_404: "Wema ɔ nɔ ba ɔ, è nɔ tɛn kɛn ya, è ka nɔ yi ɖo tɛn ɔ.",
        back_home: "← Lɛ́ kɔ xwé",
        footer_conformite: "APDP Benin sín sɛ́nwiwa",
        footer_reglementation: "FIFA sɛ́ndo",
        footer_double_projet: "Azɔ̌ Lɔnnu-Nukplɔnkplɔn-Azɔ tɔn",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Acɛ bǐ ɖò alɔ mǐtɔn mɛ.",
        connexion: "Byɔ xɔntin",
        inscrire: "Nyikɔ wlan",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Mina
    mina: {
        oops: "Héé! Wémá ma ɖé",
        desc_404: "Wémá lè ná ɖé lè, é trɔ́ ná, é ŋkɔ́ trɔ́ aló é ma ɖé.",
        back_home: "← Trɔ́ yì aɖé",
        footer_conformite: "APDP Benin sín sɛ̀n",
        footer_reglementation: "FIFA sɛ̀n",
        footer_double_projet: "Àzɔ̌ Fɛ̀fɛ̀-Nɔ̀nɔ̀mɛ̀-Azɔ̀ tɔ̀n",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Mɔ̀ŋkɔ̀n bǐ lè mía sì.",
        connexion: "Gé ɖé émè",
        inscrire: "Ŋkɔ́ wlá",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Lingala
    lin: {
        oops: "Oups! Lokasa ezali te",
        desc_404: "Lokasa oyo ozali koluka ekoki kozala ebandi, ebengami lisusu to ezali te.",
        back_home: "← Kende na ndako",
        footer_conformite: "Botosi APDP Benin",
        footer_reglementation: "Mibeko FIFA",
        footer_double_projet: "Projet Lisano-Boyekoli-Mosala",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Ba droits nionso ebatelami.",
        connexion: "Kota",
        inscrire: "Komikomisa",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Wolof
    wol: {
        oops: "Oups! Xët wi dafa feeñu",
        desc_404: "Xët wi ngay wut dina am dafa feeñu, dafa fanaan ci beneen anam walla dafa feeñu.",
        back_home: "← Dellu ci kër",
        footer_conformite: "Téral APDP Bénin",
        footer_reglementation: "Yoon FIFA",
        footer_double_projet: "Projet Sport-Jang-Liggéey",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Droits yi niou teeu.",
        connexion: "Dugg",
        inscrire: "Seetal",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Dioula
    diou: {
        oops: "Oups! Wɛbɛ ma sɔrɔ",
        desc_404: "Wɛbɛ lɛ bɛ bɛ tɛ tɛ lɛ bɛ lɛ lɛ, i tɛ tɛ wɛbɛ lɛ.",
        back_home: "← Kà kà só",
        footer_conformite: "APDP Bénin tá lá",
        footer_reglementation: "FIFA sàriya",
        footer_double_projet: "Fàrìkòlòmàná-Kàlàn-Báárà prójè",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Sàriya bɛ̀ là.",
        connexion: "Dɔ́n",
        inscrire: "Sɛ̀bɛ̀n",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Hausa
    ha: {
        oops: "Oops! Shafin ya ɓace",
        desc_404: "Shafin da kuke nema mai yiwuwa an canja shi, an sake masa suna ko babu shi.",
        back_home: "← Komawa gida",
        footer_conformite: "APDP Benin Yarda",
        footer_reglementation: "Dokokin FIFA",
        footer_double_projet: "Shirin Wasanni-Ilimi-Sana'a",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Dukkan haƙƙoƙi an kiyaye.",
        connexion: "Shiga",
        inscrire: "Yi rajista",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Kiswahili
    sw: {
        oops: "Oo! Ukurasa haukupatikana",
        desc_404: "Ukurasa unaoutafuta huenda umehamishwa, umepewa jina jipya au haupo.",
        back_home: "← Rudi nyumbani",
        footer_conformite: "Uzingatiaji APDP Benin",
        footer_reglementation: "Kanuni za FIFA",
        footer_double_projet: "Mradi wa Michezo-Elimu-Kazi",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Haki zote zimehifadhiwa.",
        connexion: "Ingia",
        inscrire: "Jiandikishe",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Espagnol
    es: {
        oops: "¡Vaya! Página no encontrada",
        desc_404: "La página que buscas puede haber sido movida, renombrada o no existe.",
        back_home: "← Volver al inicio",
        footer_conformite: "Conformidad APDP Benin",
        footer_reglementation: "Reglamento FIFA",
        footer_double_projet: "Triple Proyecto Deporte-Estudios-Profesión",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Todos los derechos reservados.",
        connexion: "Iniciar sesión",
        inscrire: "Registrarse",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESO",
        affiliation: "AFILIACIÓN",
        premier_pas: "PRIMER PASO",
        acteurs: "CONVIÉRTETE EN ACTOR",
        artiste: "CONVIÉRTETE EN ARTISTA",
        tournoi_public: "TORNEO PÚBLICO",
        esp: "SABER MÁS"
    },
    // Portugais
    pt: {
        oops: "Ops! Página não encontrada",
        desc_404: "A página que você procura pode ter sido movida, renomeada ou não existe.",
        back_home: "← Voltar ao início",
        footer_conformite: "Conformidade APDP Benin",
        footer_reglementation: "Regulamentação FIFA",
        footer_double_projet: "Triplo Projeto Esporte-Estudos-Profissão",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Todos os direitos reservados.",
        connexion: "Entrar",
        inscrire: "Inscrever-se",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSO",
        affiliation: "AFILIAÇÃO",
        premier_pas: "PRIMEIRO PASSO",
        acteurs: "TORNE-SE UM ATOR",
        artiste: "TORNE-SE UM ARTISTA",
        tournoi_public: "TORNEIO PÚBLICO",
        esp: "SAIBA MAIS"
    },
    // Allemand
    de: {
        oops: "Hoppla! Seite nicht gefunden",
        desc_404: "Die gesuchte Seite wurde möglicherweise verschoben, umbenannt oder existiert nicht.",
        back_home: "← Zurück zur Startseite",
        footer_conformite: "APDP Benin Konformität",
        footer_reglementation: "FIFA-Regulierung",
        footer_double_projet: "Dreifachprojekt Sport-Studium-Beruf",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Alle Rechte vorbehalten.",
        connexion: "Anmelden",
        inscrire: "Registrieren",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROZESS",
        affiliation: "AFFILIATION",
        premier_pas: "ERSTER SCHRITT",
        acteurs: "WERDE AKTEUR",
        artiste: "WERDE KÜNSTLER",
        tournoi_public: "ÖFFENTLICHES TURNIER",
        esp: "MEHR ERFAHREN"
    },
    // Italien
    it: {
        oops: "Ops! Pagina non trovata",
        desc_404: "La pagina cercata potrebbe essere stata spostata, rinominata o non esiste.",
        back_home: "← Torna alla home",
        footer_conformite: "Conformità APDP Benin",
        footer_reglementation: "Regolamentazione FIFA",
        footer_double_projet: "Triplo Progetto Sport-Studi-Professione",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Tutti i diritti riservati.",
        connexion: "Accedi",
        inscrire: "Registrati",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSO",
        affiliation: "AFFILIAZIONE",
        premier_pas: "PRIMO PASSO",
        acteurs: "DIVENTA ATTORE",
        artiste: "DIVENTA ARTISTA",
        tournoi_public: "TORNEO PUBBLICO",
        esp: "SCOPRI DI PIÙ"
    },
    // Arabe
    ar: {
        oops: "عذرًا! الصفحة غير موجودة",
        desc_404: "الصفحة التي تبحث عنها ربما تم نقلها أو إعادة تسميتها أو أنها غير موجودة.",
        back_home: "← العودة إلى الصفحة الرئيسية",
        footer_conformite: "الامتثال لـ APDP بنين",
        footer_reglementation: "لوائح الفيفا",
        footer_double_projet: "مشروع الرياضة والدراسة والمهنة الثلاثي",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. جميع الحقوق محفوظة.",
        connexion: "تسجيل الدخول",
        inscrire: "التسجيل",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Chinois
    zh: {
        oops: "哎呀！页面未找到",
        desc_404: "您寻找的页面可能已被移动、重命名或不存在。",
        back_home: "← 返回首页",
        footer_conformite: "APDP 贝宁合规",
        footer_reglementation: "FIFA 规则",
        footer_double_projet: "体育-学习-职业三重项目",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa。 版权所有。",
        connexion: "连接",
        inscrire: "登记",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Russe
    ru: {
        oops: "Ой! Страница не найдена",
        desc_404: "Возможно, страница, которую вы ищете, была перемещена, переименована или не существует.",
        back_home: "← Вернуться на главную",
        footer_conformite: "Соответствие APDP Бенин",
        footer_reglementation: "Регламент ФИФА",
        footer_double_projet: "Тройной проект Спорт-Учёба-Профессия",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Все права защищены.",
        connexion: "Вход",
        inscrire: "Регистрация",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Japonais
    ja: {
        oops: "おっと！ページが見つかりません",
        desc_404: "お探しのページは移動されたか、名前が変更されたか、存在しない可能性があります。",
        back_home: "← ホームに戻る",
        footer_conformite: "APDP ベニン準拠",
        footer_reglementation: "FIFA 規則",
        footer_double_projet: "スポーツ・勉強・職業のトリプルプロジェクト",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. 無断複写・転載を禁じます。",
        connexion: "接続",
        inscrire: "登録",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Turc
    tr: {
        oops: "Aman! Sayfa bulunamadı",
        desc_404: "Aradığınız sayfa taşınmış, yeniden adlandırılmış veya mevcut olmayabilir.",
        back_home: "← Ana sayfaya dön",
        footer_conformite: "APDP Benin Uyumluluğu",
        footer_reglementation: "FIFA Düzenlemeleri",
        footer_double_projet: "Spor-Eğitim-Meslek Üçlü Projesi",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Tüm hakları saklıdır.",
        connexion: "Giriş",
        inscrire: "Kaydol",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Coréen
    ko: {
        oops: "이런! 페이지를 찾을 수 없습니다",
        desc_404: "찾고 계신 페이지가 이동되었거나, 이름이 변경되었거나 존재하지 않습니다.",
        back_home: "← 홈으로 돌아가기",
        footer_conformite: "APDP 베냉 준수",
        footer_reglementation: "FIFA 규정",
        footer_double_projet: "스포츠-공부-직업 삼중 프로젝트",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. 모든 권리 보유.",
        connexion: "연결",
        inscrire: "등록",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Hindi
    hi: {
        oops: "ओह! पेज नहीं मिला",
        desc_404: "जिस पेज को आप ढूंढ रहे हैं वह स्थानांतरित, नाम बदला या मौजूद नहीं हो सकता।",
        back_home: "← होम पेज पर लौटें",
        footer_conformite: "APDP बेनिन अनुपालन",
        footer_reglementation: "फीफा नियम",
        footer_double_projet: "खेल-अध्ययन-पेशा ट्रिपल प्रोजेक्ट",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. सर्वाधिकार सुरक्षित।",
        connexion: "कनेक्शन",
        inscrire: "साइन अप करें",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    // Néerlandais
    nl: {
        oops: "Oeps! Pagina niet gevonden",
        desc_404: "De pagina die u zoekt is mogelijk verplaatst, hernoemd of bestaat niet.",
        back_home: "← Terug naar home",
        footer_conformite: "APDP Benin Naleving",
        footer_reglementation: "FIFA Regelgeving",
        footer_double_projet: "Triple Project Sport-Studie-Beroep",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Alle rechten voorbehouden.",
        connexion: "Inloggen",
        inscrire: "Inschrijven",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCES",
        affiliation: "AFFILIATIE",
        premier_pas: "EERSTE STAP",
        acteurs: "WORD ACTEUR",
        artiste: "WORD ARTIST",
        tournoi_public: "OPENBAAR TOERNOOI",
        esp: "MEER WETEN"
    },
    // Polonais
    pl: {
        oops: "Ups! Strona nie znaleziona",
        desc_404: "Strona, której szukasz, mogła zostać przeniesiona, przemianowana lub nie istnieje.",
        back_home: "← Wróć na stronę główną",
        footer_conformite: "Zgodność APDP Benin",
        footer_reglementation: "Regulacje FIFA",
        footer_double_projet: "Potrójny Projekt Sport-Nauka-Zawód",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Wszelkie prawa zastrzeżone.",
        connexion: "Logowanie",
        inscrire: "Zarejestruj się",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCES",
        affiliation: "AFILIACJA",
        premier_pas: "PIERWSZY KROK",
        acteurs: "ZOSTAŃ AKTOREM",
        artiste: "ZOSTAŃ ARTYSTĄ",
        tournoi_public: "TURNIEJ PUBLICZNY",
        esp: "DOWIEDZ SIĘ WIĘCEJ"
    },
    // Vietnamien
    vi: {
        oops: "Rất tiếc! Không tìm thấy trang",
        desc_404: "Trang bạn đang tìm có thể đã bị di chuyển, đổi tên hoặc không tồn tại.",
        back_home: "← Quay lại trang chủ",
        footer_conformite: "Tuân thủ APDP Benin",
        footer_reglementation: "Quy định FIFA",
        footer_double_projet: "Dự án ba mục Thể thao-Học tập-Nghề nghiệp",
        contact_tel: "📞 +229 01 95 97 31 57",
        contact_email: "📧 contacthubisoccer@gmail.com",
        rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
        copyright: "© 2026 HubISoccer - Ozawa. Tất cả các quyền được bảo lưu.",
        connexion: "Đăng nhập",
        inscrire: "Đăng ký",
        hub_market: "HUBISOCCER MARKET",
        hub_community: "HUB COMMUNITY",
        scouting: "SCOUTING",
        processus: "PROCESSUS",
        affiliation: "AFFILIATION",
        premier_pas: "PREMIER-PAS",
        acteurs: "DEVENEZ UN ACTEUR",
        artiste: "DEVENEZ UN ARTISTE",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    }
};

let currentLang = 'fr';

function applyTranslations(lang) {
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.innerHTML.includes('<')) {
                el.innerHTML = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });
}

function loadLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        applyTranslations(lang);
        localStorage.setItem('hubiLang', lang);
    } else {
        console.warn('Langue non disponible, fallback vers français');
        if (lang !== 'fr') loadLanguage('fr');
    }
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('hubiLang') || 'fr';
    loadLanguage(savedLang);

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => {
            loadLanguage(e.target.value);
        });
    }
});
// ========== FIN DE 404.JS ==========
