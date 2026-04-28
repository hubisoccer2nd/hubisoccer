// ========== INDEX.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const supabaseUrl = 'https://rasepmelflfjtliflyrz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseSpacePublic = window.supabase.createClient(supabaseUrl, supabaseKey);

// ========== DÉBUT : CHARGEMENT DES ENGAGEMENTS ==========
async function loadEngagements() {
    const container = document.getElementById('engagementsContainer');
    if (!container) return;

    const { data: engagements, error } = await supabaseSpacePublic
        .from('public_engagements')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Erreur chargement engagements:', error);
        container.innerHTML = '<p>Erreur de chargement.</p>';
        return;
    }

    let html = '';
    engagements.forEach(e => {
        html += `
            <div class="card">
                <i class="fas ${e.icon || 'fa-handshake'}"></i>
                <h3>${escapeHtml(e.title)}</h3>
                <p>${escapeHtml(e.description)}</p>
            </div>
        `;
    });
    container.innerHTML = html || '<p>Aucun engagement.</p>';
}
// ========== FIN : CHARGEMENT DES ENGAGEMENTS ==========

// ========== DÉBUT : CHARGEMENT DES RÔLES ==========
async function loadRoles() {
    const container = document.getElementById('rolesContainer');
    if (!container) return;

    const { data: roles, error } = await supabaseSpacePublic
        .from('public_roles')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Erreur chargement rôles:', error);
        container.innerHTML = '<p>Erreur de chargement.</p>';
        return;
    }

    let html = '';
    roles.forEach(r => {
        html += `
            <div class="card">
                <i class="fas ${r.icon || 'fa-user'}"></i>
                <h3>${escapeHtml(r.title)}</h3>
                <p>${escapeHtml(r.description)}</p>
            </div>
        `;
    });
    container.innerHTML = html || '<p>Aucun rôle.</p>';
}
// ========== FIN : CHARGEMENT DES RÔLES ==========

// ========== DÉBUT : CHARGEMENT DES STADES ==========
async function loadStades() {
    const container = document.getElementById('stadesContainer');
    if (!container) return;

    const { data: stades, error } = await supabaseSpacePublic
        .from('public_stades')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Erreur chargement stades:', error);
        container.innerHTML = '<p>Erreur de chargement.</p>';
        return;
    }

    let html = '';
    stades.forEach(s => {
        html += `
            <div class="stade-card">
                <img class="stade-img" src="${s.image_url}" alt="${escapeHtml(s.name)}" loading="lazy">
                <div class="content">
                    <h4>${escapeHtml(s.name)}</h4>
                    <p>${escapeHtml(s.description)}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html || '<p>Aucun stade.</p>';
}
// ========== FIN : CHARGEMENT DES STADES ==========

// ========== DÉBUT : ÉCHAPPEMENT HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
// ========== FIN : ÉCHAPPEMENT HTML ==========

// ========== DÉBUT : GESTION DU MENU MOBILE ==========
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
// ========== FIN : GESTION DU MENU MOBILE ==========

// ========== DÉBUT : TRADUCTIONS (24 LANGUES) ==========
const translations = {
    // Français
    fr: {
        titre_page: "HubISoccer | Le talent de la rue, le futur du football",
        sport_etudes: "Sport + Études + Métier",
        talent_rue: "LE TALENT DE LA RUE,<br>LE FUTUR DU FOOTBALL.",
        description: "HubISoccer transforme la détection de rue en opportunité professionnelle. Nous certifions le parcours académique des talents et les connectons aux agents agréés.",
        reseau_scouting: "Réseau Scouting",
        tournoi: "Tournoi HubISoccer",
        engagement_ethique: "NOTRE ENGAGEMENT ÉTHIQUE & JURIDIQUE",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Tournoi HubISoccer. Connectez-vous à votre destin footballistique mondial.",
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
        titre_page: "HubISoccer | Street talent, the future of football",
        sport_etudes: "Sport + Studies + Career",
        talent_rue: "STREET TALENT,<br>THE FUTURE OF FOOTBALL.",
        description: "HubISoccer transforms street scouting into professional opportunity. We certify the academic background of talents and connect them to licensed agents.",
        reseau_scouting: "Scouting Network",
        tournoi: "HubISoccer Tournament",
        engagement_ethique: "OUR ETHICAL & LEGAL COMMITMENT",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer Tournament. Connect to your global football destiny.",
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
        titre_page: "HubISoccer | Talent ita, ọjọ iwaju bọọlu",
        sport_etudes: "Idaraya + Ẹkọ + Iṣẹ",
        talent_rue: "TALENT ITA,<br>ỌJỌ IWAJU BỌỌLU",
        description: "HubISoccer ṣe iyipada wiwa talenti ita si aye ọjọgbọn. A jẹrisi ẹkọ ti awọn talenti ati ki o sopọ wọn si awọn aṣoju ti a fọwọsi.",
        reseau_scouting: "Nẹtiwọọki Wiwa",
        tournoi: "Idije HubISoccer",
        engagement_ethique: "ILANA WA TI ẸTỌ",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Idije HubISoccer. Sopọ si ayanmọ bọọlu agbaye rẹ.",
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
        titre_page: "HubISoccer | Acɛ wɛ ɖo taji ɔ, bɔlu ɖaxo sín fifa",
        sport_etudes: "Lɔnnu + Nukplɔnkplɔn + Azɔ",
        talent_rue: "ACƐ WƐ ƉO TAJI Ɔ,<br>BƆLU ƉAXO SÍN FIFA.",
        description: "HubISoccer nɔ gbasá acɛ wɛ ɖo taji bo nɔ sɔ́ xwe azɔ wiwa ɖaxo. Mǐ nɔ ɖɔ nukplɔnkplɔn yetɔn bɔ nǎ nɔ kan yetɔn hwɛ xá mɛɖaxo lɛ.",
        reseau_scouting: "Azɔngbasá Acɛ Wɛ",
        tournoi: "Bɔlu fifá HubISoccer",
        engagement_ethique: "MƐSÍN SƐ́N ƉÓ É NYÍ NÚGBO",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Bɔlu fifá HubISoccer. Kan xá fifa bɔlu tɔn ɖo gbɛ ɔ bǐ mɛ.",
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
        titre_page: "HubISoccer | Mɔ̀ŋkɔ̀n lè àlì jí, bɔ̀lù fɛ̀fɛ̀ lè ètè",
        sport_etudes: "Fɛ̀fɛ̀ + Nɔ̀nɔ̀mɛ̀ + Azɔ̀",
        talent_rue: "MƆ̀ŊKƆ̀N LÈ ÀLÌ JÍ,<br>BƆ̀LÙ FƐ̀FƐ̀ LÈ ÈTÈ.",
        description: "HubISoccer nɔ̀ trɔ̀ mɔ̀ŋkɔ̀n lè àlì jí wɔ̀ azɔ̀ gblèǹ. Mí nɔ̀ ɖò nɔ̀nɔ̀mɛ̀ wò àmàǹ àɖàŋù lè gbè lè à wɔ̀ nɔ̀ kàn wò xá àgɛ̀ǹtì sɔ̀ wè.",
        reseau_scouting: "Àzɔ̌ mɔ̀ŋkɔ̀n wá",
        tournoi: "Bɔ̀lù fɛ̀fɛ̀ HubISoccer",
        engagement_ethique: "MÍA FÉ ƉÓ É NYÍ NÚGBO",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Bɔ̀lù fɛ̀fɛ̀ HubISoccer. Kàn xá àfɛ̀ bɔ̀lù tɔ̀wò ɖò xéxé mɛ.",
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
        titre_page: "HubISoccer | Mayele ya balabala, bokɛsɛni ya ndembo",
        sport_etudes: "Lisano + Boyekoli + Mosala",
        talent_rue: "MAYELE YA BALABALA,<br>BOKƐSƐNI YA NDEMBO.",
        description: "HubISoccer ebongoli bokɛsɛni ya balabala na libaku ya mosala. Tondimaka boyekoli ya mayele mpe tokangaka bango na ba agents ya ndingisa.",
        reseau_scouting: "Reseau ya boluki",
        tournoi: "Tournoi HubISoccer",
        engagement_ethique: "BOLENDISI NA BISO YA MIBEKO",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Tournoi HubISoccer. Kanga na mokano na yo ya ndembo ya mokili mobimba.",
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
        titre_page: "HubISoccer | Xam-xam bu mbedd, ëllëg bu football bi",
        sport_etudes: "Sport + Jang + Liggéey",
        talent_rue: "XAM-XAM BU MBEDD,<br>ËLLËG BU FOOTBALL BI.",
        description: "HubISoccer defar xam-xam bu mbedd ngir mu doon liggéey bu rafet. Dina nu kootaar jang mi, te di leen a takk ak agent yi am ndigal.",
        reseau_scouting: "Réseau Scouting",
        tournoi: "Tournoi HubISoccer",
        engagement_ethique: "SUNU YËGLI BU YIW",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Tournoi HubISoccer. Takk ak sa ëllëg football bu àdduna bi.",
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
        titre_page: "HubISoccer | Dɔ́nniyá sìra lá, bɔ̀lu kùnfɛ̀",
        sport_etudes: "Fàrìkòlòmàná + Kàlàn + Báárà",
        talent_rue: "DƆ́NNIYÁ SÌRA LÁ,<br>BƆ̀LU KÙNFƐ̀.",
        description: "HubISoccer bɛ́ dɔ́nniyá sìra lá fɛ̀n ka kɛ báárà ye. An bɛ́ kàlàn sɛ̀bɛ̀n dɔ́nniyáw kà an bɛ́ w ́à fàràn àjɛ̀ntì là.",
        reseau_scouting: "Dɔ́nniyá sɛ̀bɛ̀n",
        tournoi: "Bɔ̀lu fɛ̀fɛ̀ HubISoccer",
        engagement_ethique: "ÀN DÀLILU SÒRÒ",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Bɔ̀lu fɛ̀fɛ̀ HubISoccer. Kà w fàràn ì yá bɔ̀lu dùnyá la.",
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
        titre_page: "HubISoccer | Hazaka daga titi, makomar ƙwallon ƙafa",
        sport_etudes: "Wasanni + Ilimi + Sana'a",
        talent_rue: "HAZAKA DAGA TITI,<br>MAKOMAR ƘWALLON ƘAFA.",
        description: "HubISoccer tana canza hazaka daga titi zuwa damar sana'a. Muna tabbatar da ilimin matasa kuma muna haɗa su da wakilai masu lasisi.",
        reseau_scouting: "Cibiyar Neman Hazaka",
        tournoi: "Gasar HubISoccer",
        engagement_ethique: "MUHIMMANCIYAR MU TA DABI'A",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Gasar HubISoccer. Haɗa da makomar ƙwallon ƙafa ta duniya.",
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
        titre_page: "HubISoccer | Kipaji cha mtaani, mustakabali wa soka",
        sport_etudes: "Michezo + Elimu + Kazi",
        talent_rue: "KIPAJI CHA MTAANI,<br>MUSTAKABALI WA SOKA.",
        description: "HubISoccer inabadilisha utambuzi wa mtaani kuwa fursa ya kitaaluma. Tunathibitisha masomo ya vipaji na kuwaunganisha na mawakala wenye leseni.",
        reseau_scouting: "Mtandao wa Utambuzi",
        tournoi: "Mashindano ya HubISoccer",
        engagement_ethique: "AHADI YETU YA MAADILI",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Mashindano ya HubISoccer. Ungana na mustakabali wako wa soka duniani.",
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
        titre_page: "HubISoccer | Talento de la calle, el futuro del fútbol",
        sport_etudes: "Deporte + Estudios + Profesión",
        talent_rue: "TALENTO DE LA CALLE,<br>EL FUTURO DEL FÚTBOL.",
        description: "HubISoccer transforma la detección callejera en oportunidad profesional. Certificamos el recorrido académico de los talentos y los conectamos con agentes autorizados.",
        reseau_scouting: "Red Scouting",
        tournoi: "Torneo HubISoccer",
        engagement_ethique: "NUESTRO COMPROMISO ÉTICO Y LEGAL",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Torneo HubISoccer. Conéctate con tu destino futbolístico mundial.",
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
        titre_page: "HubISoccer | Talento de rua, o futuro do futebol",
        sport_etudes: "Esporte + Estudos + Profissão",
        talent_rue: "TALENTO DE RUA,<br>O FUTURO DO FUTEBOL.",
        description: "HubISoccer transforma a detecção de rua em oportunidade profissional. Certificamos o percurso acadêmico dos talentos e os conectamos com agentes licenciados.",
        reseau_scouting: "Rede Scouting",
        tournoi: "Torneio HubISoccer",
        engagement_ethique: "NOSSO COMPROMISSO ÉTICO E LEGAL",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Torneio HubISoccer. Conecte-se ao seu destino futebolístico mundial.",
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
        titre_page: "HubISoccer | Straßentalent, die Zukunft des Fußballs",
        sport_etudes: "Sport + Studium + Beruf",
        talent_rue: "STRASSENTALENT,<br>DIE ZUKUNFT DES FUSSBALLS.",
        description: "HubISoccer verwandelt Straßenscouting in berufliche Chancen. Wir zertifizieren den akademischen Werdegang der Talente und verbinden sie mit lizenzierten Agenten.",
        reseau_scouting: "Scouting-Netzwerk",
        tournoi: "HubISoccer Turnier",
        engagement_ethique: "UNSER ETHISCHES & RECHTLICHES ENGAGEMENT",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer Turnier. Verbinde dich mit deinem weltweiten Fußballschicksal.",
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
        titre_page: "HubISoccer | Talento di strada, il futuro del calcio",
        sport_etudes: "Sport + Studi + Professione",
        talent_rue: "TALENTO DI STRADA,<br>IL FUTURO DEL CALCIO.",
        description: "HubISoccer trasforma il rilevamento di strada in opportunità professionale. Certifichiamo il percorso accademico dei talenti e li connettiamo con agenti autorizzati.",
        reseau_scouting: "Rete Scouting",
        tournoi: "Torneo HubISoccer",
        engagement_ethique: "IL NOSTRO IMPEGNO ETICO & LEGALE",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Torneo HubISoccer. Connettiti al tuo destino calcistico mondiale.",
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
        titre_page: "HubISoccer | موهبة الشارع، مستقبل كرة القدم",
        sport_etudes: "رياضة + دراسة + مهنة",
        talent_rue: "موهبة الشارع،<br>مستقبل كرة القدم.",
        description: "HubISoccer يحول اكتشاف المواهب في الشارع إلى فرصة احترافية. نحن نعتمد المسار الأكاديمي للمواهب ونربطهم بوكلاء مرخصين.",
        reseau_scouting: "شبكة الاستكشاف",
        tournoi: "دورة HubISoccer",
        engagement_ethique: "التزامنا الأخلاقي والقانوني",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "دورة HubISoccer. اتصل بمصيرك الكروي العالمي.",
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
        titre_page: "HubISoccer | 街头天才，足球的未来",
        sport_etudes: "体育 + 学习 + 职业",
        talent_rue: "街头天才，<br>足球的未来。",
        description: "HubISoccer 将街头发掘转变为职业机会。我们认证人才的学术背景，并将他们与持牌经纪人联系起来。",
        reseau_scouting: "侦察网络",
        tournoi: "HubISoccer 锦标赛",
        engagement_ethique: "我们的道德与法律承诺",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer 锦标赛。连接您的全球足球命运。",
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
        titre_page: "HubISoccer | Уличный талант, будущее футбола",
        sport_etudes: "Спорт + Учёба + Профессия",
        talent_rue: "УЛИЧНЫЙ ТАЛАНТ,<br>БУДУЩЕЕ ФУТБОЛА.",
        description: "HubISoccer превращает уличный отбор в профессиональные возможности. Мы подтверждаем академический путь талантов и связываем их с лицензированными агентами.",
        reseau_scouting: "Скаутинговая сеть",
        tournoi: "Турнир HubISoccer",
        engagement_ethique: "НАША ЭТИЧЕСКАЯ И ЮРИДИЧЕСКАЯ ОТВЕТСТВЕННОСТЬ",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Турнир HubISoccer. Подключитесь к своей мировой футбольной судьбе.",
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
        titre_page: "HubISoccer | ストリートの才能、サッカーの未来",
        sport_etudes: "スポーツ + 勉強 + 職業",
        talent_rue: "ストリートの才能、<br>サッカーの未来。",
        description: "HubISoccer は、ストリートでの発掘をプロの機会に変えます。私たちは才能の学歴を認定し、認可されたエージェントとつなぎます。",
        reseau_scouting: "スカウティングネットワーク",
        tournoi: "HubISoccer トーナメント",
        engagement_ethique: "私たちの倫理的・法的コミットメント",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer トーナメント。あなたの世界的なサッカーの運命につながりましょう。",
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
        titre_page: "HubISoccer | Sokak yeteneği, futbolun geleceği",
        sport_etudes: "Spor + Eğitim + Meslek",
        talent_rue: "SOKAK YETENEĞİ,<br>FUTBOLUN GELECEĞİ.",
        description: "HubISoccer, sokak keşfini profesyonel fırsata dönüştürür. Yeteneklerin akademik geçmişini onaylıyor ve onları lisanslı temsilcilerle buluşturuyoruz.",
        reseau_scouting: "Scouting Ağı",
        tournoi: "HubISoccer Turnuvası",
        engagement_ethique: "ETİK & YASAL TAAHHÜDÜMÜZ",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer Turnuvası. Küresel futbol kaderinize bağlanın.",
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
        titre_page: "HubISoccer | 거리 재능, 축구의 미래",
        sport_etudes: "스포츠 + 공부 + 직업",
        talent_rue: "거리 재능,<br>축구의 미래.",
        description: "HubISoccer는 거리 발굴을 직업 기회로 바꿉니다. 우리는 재능의 학업 경력을 인증하고 허가된 에이전트와 연결합니다.",
        reseau_scouting: "스카우팅 네트워크",
        tournoi: "HubISoccer 토너먼트",
        engagement_ethique: "우리의 윤리적 및 법적 약속",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer 토너먼트. 세계 축구 운명에 연결하세요.",
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
        titre_page: "HubISoccer | सड़क की प्रतिभा, फुटबॉल का भविष्य",
        sport_etudes: "खेल + अध्ययन + पेशा",
        talent_rue: "सड़क की प्रतिभा,<br>फुटबॉल का भविष्य।",
        description: "HubISoccer सड़क स्काउटिंग को पेशेवर अवसर में बदलता है। हम प्रतिभाओं की शैक्षणिक पृष्ठभूमि प्रमाणित करते हैं और उन्हें लाइसेंस प्राप्त एजेंटों से जोड़ते हैं।",
        reseau_scouting: "स्काउटिंग नेटवर्क",
        tournoi: "HubISoccer टूर्नामेंट",
        engagement_ethique: "हमारी नैतिक और कानूनी प्रतिबद्धता",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer टूर्नामेंट। अपने वैश्विक फुटबॉल भाग्य से जुड़ें।",
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
        titre_page: "HubISoccer | Straattalent, de toekomst van voetbal",
        sport_etudes: "Sport + Studie + Beroep",
        talent_rue: "STRAATTALENT,<br>DE TOEKOMST VAN VOETBAL.",
        description: "HubISoccer verandert straatscouting in professionele kansen. Wij certificeren de academische achtergrond van talenten en verbinden hen met erkende makelaars.",
        reseau_scouting: "Scouting Netwerk",
        tournoi: "HubISoccer Toernooi",
        engagement_ethique: "ONZE ETHISCHE & JURIDISCHE VERBINTENIS",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "HubISoccer Toernooi. Verbind je met je wereldwijde voetbalbestemming.",
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
        titre_page: "HubISoccer | Talent uliczny, przyszłość piłki nożnej",
        sport_etudes: "Sport + Nauka + Zawód",
        talent_rue: "TALENT ULICZNY,<br>PRZYSZŁOŚĆ PIŁKI NOŻNEJ.",
        description: "HubISoccer przekształca uliczny skauting w profesjonalną szansę. Certyfikujemy akademickie pochodzenie talentów i łączymy ich z licencjonowanymi agentami.",
        reseau_scouting: "Sieć Skautingowa",
        tournoi: "Turniej HubISoccer",
        engagement_ethique: "NASZE ZOBOWIĄZANIE ETYCZNE I PRAWNE",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Turniej HubISoccer. Połącz się ze swoim globalnym przeznaczeniem piłkarskim.",
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
        titre_page: "HubISoccer | Tài năng đường phố, tương lai bóng đá",
        sport_etudes: "Thể thao + Học tập + Nghề nghiệp",
        talent_rue: "TÀI NĂNG ĐƯỜNG PHỐ,<br>TƯƠNG LAI BÓNG ĐÁ.",
        description: "HubISoccer biến việc phát hiện tài năng đường phố thành cơ hội nghề nghiệp. Chúng tôi chứng nhận nền tảng học vấn của các tài năng và kết nối họ với các đại lý được cấp phép.",
        reseau_scouting: "Mạng lưới Tuyển trạch",
        tournoi: "Giải đấu HubISoccer",
        engagement_ethique: "CAM KẾT ĐẠO ĐỨC & PHÁP LÝ CỦA CHÚNG TÔI",
        hub_inspiration: "THE HUB OF INSPIRATION OF SOCCER",
        tournoi_desc: "Giải đấu HubISoccer. Kết nối với định mệnh bóng đá toàn cầu của bạn.",
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
// ========== FIN : TRADUCTIONS ==========

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
    loadEngagements();
    loadRoles();
    loadStades();

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
// ========== FIN DE INDEX.JS ==========
