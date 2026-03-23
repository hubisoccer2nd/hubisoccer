# hubisoccer
VIVEZ LE SPORT, TRANSFORMEZ LE LOISIR EN UN VERITABLE PILIER DE REUSSITE
# HubISoccer – The Hub of Inspiration of Soccer

**Plateforme de détection de talents et d’accompagnement sport-études-carrière**

HubISoccer transforme le talent de la rue en opportunité professionnelle. Nous certifions le parcours académique des talents et les connectons aux agents agréés, tout en leur offrant une communauté d’échange et de soutien.

## 🌍 Notre Vision : Corps – Âme – Esprit

- **Corps** : valoriser les compétences sportives (football, basketball, tennis, athlétisme, etc.) par des outils de suivi, de détection et de mise en relation.
- **Âme** : créer une communauté où chaque talent peut échanger, s’entraider et se développer dans une ambiance inspirante.
- **Esprit** : accompagner chaque parcours vers un projet de vie épanoui (sport, études, carrière), en respectant les valeurs éthiques et la réglementation FIFA.

## 🗂️ Structure du dépôt

Le code source est organisé en deux grands espaces :

### 📁 `public/`
Toutes les pages accessibles sans authentification :
- Pages d’accueil, d’information, de découverte (`index.html`, `actualites.html`, `faq.html`, etc.)
- Pages d’inscription et de connexion (`auth/`)
- Administration publique (`admin/`) pour gérer les contenus publics

### 📁 `prive/`
Pages réservées aux utilisateurs connectés, organisées par rôle :
- `auth/` – pages d’authentification des espaces privés
- `footballer/`, `basketter/`, `parrainprive/`, `agent-fifa/`, `corps arbitral/`, `staff médical/`, `cricket/`, `tennis/`, `athletisme/`, `natation/`, `rugby/`, `volley-ball/`, `cyclisme/`, `boxe/`
- `gestionnaire-tournoi/` – administration des tournois

Chaque sous‑dossier de rôle contient :
- Ses propres fichiers HTML (dashboard, feed, messages, etc.)
- Ses propres CSS et JS (dossiers `css/` et `js/`)
- Un dossier `adminX/` pour l’administration spécifique à ce rôle

## 🛠️ Technologies utilisées

- **Front‑end** : HTML5, CSS3, JavaScript (ES6)
- **Framework UI** : aucun – développement pur
- **Base de données** : [Supabase](https://supabase.com) (PostgreSQL + API REST + Realtime)
- **Authentification** : Supabase Auth (gestion des utilisateurs et rôles)
- **Hébergement** : GitHub Pages pour l’espace public (ou tout serveur statique)

## 🚀 Démarrage rapide

1. **Cloner le dépôt**
   bash
   git clone https://github.com/hubisoccer2nd/hubisoccer.git
   cd hubisoccer
2. **Configurer les clés Supabase**
   - Créez un projet sur [Supabase](https://supabase.com)
   - Récupérez l’URL et la clé **anon public** (ou la clé **publishable**)
   - Copiez le fichier `public/js/config.example.js` en `public/js/config.js` et remplacez les valeurs.

3. **Lancer en local**
   Ouvrez `index.html` dans votre navigateur (ou utilisez un serveur local comme Live Server).

## 📋 Pages principales

- **Espace public** : `index.html`, `hub-community.html`, `scouting.html`, `tournoi.html`, etc.
- **Espace privé** (exemple pour footballeur) : `prive/footballer/dashboard.html`, `feed.html`, `messages.html`

Toutes les pages partagent les mêmes éléments de footer :

```html
<div class="compliance-badges">
    <div class="badge-item">Conformité APDP Bénin</div>
    <div class="badge-item">Règlementation FIFA</div>
    <div class="badge-item">Triple Projet Sport-Études-Carrière</div>
</div>
<div class="contact-box">
    <a href="tel:+2290195973157">📞 +229 01 95 97 31 57</a>
    <a href="mailto:contacthubisoccer@gmail.com">📧 contacthubisoccer@gmail.com</a>
</div>
<div class="legal">
    <p>HubISoccer - The Hub of Inspiration of Soccer</p>
    <p>RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236</p>
    <p>© 2026 HubISoccer - Ozawa. Tous droits réservés.</p>
</div>
```
## 📄 Licence

Ce projet est protégé par le droit d’auteur. Aucune licence n’est accordée ; le code peut être consulté mais ne peut être copié, modifié ou distribué sans autorisation explicite de l’auteur.  
Pour toute demande, contactez‑nous à l’adresse ci‑dessus.


## 📞 Contact

- **Téléphone** : +229 01 95 97 31 57  
- **Email** : contacthubisoccer@gmail.com  
- **Site web** : (à venir)
**HubISoccer – Le talent de la rue, le futur du football.**  
```
