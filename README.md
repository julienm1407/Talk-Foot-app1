# Talk-Foot-app1

Application de football en direct : live match, chat, paris, réactions. Replay Rennes-PSG avec simulation temps réel, API Football (5 grands championnats européens).

### UX — Gestalt & lisibilité
- **Logo** : wordmark officiel `public/logo-talk-foot.png`, composant `LogoMark` (`src/layout/LogoMark.tsx`) — barre du haut, menus, connexion, onboarding. Favicon / Apple touch : même fichier dans `index.html`.
- Les **sections** de l’accueil suivent une **hiérarchie stable** : petit libellé (CAPS) → titre → description → contenu, pour la **proximité** et la **similarité** entre blocs.
- **Couleurs (charte Talk Foot)** : **marine** (`tf.dark`), **gris** (`tf.grey` / `grey-pastel`), **bleu électrique** (`tf.electric`) — surfaces **plates**, peu de dégradés. **Couleurs clubs / ligues** : uniquement sur la page match via les variables `--tf-match-*` (injectées par `Channel`), sans les mélanger à la charte globale.
- Détail des principes et pistes d’évolution : [`docs/UX-GESTALT.md`](docs/UX-GESTALT.md).

### Vocabulaire
- Les communautés utilisateur sont des **groupes de supporters** (pas « serveurs »). En interface on privilégie des libellés **courts** (« groupe », « salon », **Agenda** pour le calendrier) ; le détail peut aller dans `title` / `aria-label` si besoin.

### Personnalisation supporter
- **Mode supporter (teinte maillot)** : dans **Profil → Apparence**, activer colore le haut du personnage **et** bascule l’**accueil** sur ton club : matchs / accès rapide / actus filtrées, actus synthétiques « 100 % club » si besoin, **agenda** et **top commentaires** alignés kop (même logique que le mode Virage pour les commentaires). Désactiver = retour au fil général.
- **Juste après connexion** : une fois identifié, une **fenêtre de config** (ligue + club) s’ouvre **une seule fois** si ce n’est pas encore fait — plus de popup à chaque visite.
- **Accueil** : si tu as quitté avant la fin, un **bandeau** discret sur l’accueil propose **Configurer** (pas sur les autres pages).
- **Actus** : tri / priorité selon ta ligue et ton club.
- **Salons** : tagués par club/ligue ; **rivaux** en **lecture seule** ou **masqués** (case à cocher accueil).
- **Mode Virage** : uniquement dans **Profil** ou dans le **chat d’un match live** — filtre les messages sur ton **club de cœur** (+ les tiens). Pas dans la barre du haut.

### Personnage & boutique maillots (sans logos officiels)
- **Maillots sur l’avatar** : silhouette **type maillot pro** (encolure, manches courtes, **parements** blancs + liseré couleur), motifs dont **bande centrale** (style tribune, sans logo) et **mesh** technique. Défaut personnage : marine + rouge façon bande centrale.
- **Profil → Apparence** : personnage SVG (teint, cheveux, yeux, barbe, lunettes, coiffe de base, couleurs/motifs du haut). **Mode supporter** applique les **couleurs** de ton club favori (préférences fan) sur le torse — géométrie générique uniquement.
- **Profil → Équipement** : écharpes, casquettes boutique, maillots, accessoires par-dessus le personnage ; aperçu rotatif (face / dos avec flocage).
- **Boutique → Maillots inspirés** : collection **inspirée** d’ambiances tribunes (texte + couleurs + motifs) ; achat en jetons avec **prénom / numéro fictifs**, **taille** et **manches** (indicatif digital). Aperçu sur le mannequin. Lien d’exemple vers une boutique externe (à remplacer par ton URL e-commerce).

## Lancer le projet

```bash
npm install
npm run dev
```

## Variables d'environnement

Copie `.env.example` en `.env` et ajoute ta clé API (optionnel pour le mode démo) :
```
VITE_API_SPORTS_KEY=ta_cle_api
```

## Structure du projet (Vite + React)

> **Important — ne pas mettre `index.html` dans `public/`**  
> Avec **Vite**, le fichier **`index.html` doit être à la racine** du projet (à côté de `package.json`).  
> Ce n’est **pas** le même modèle que certains anciens tutos (ex. tout dans `src/` ou HTML dans `public/`).  
> La [doc officielle Vite](https://vite.dev/guide/#index-html-and-project-root) : *« index.html at project root »*.

```
talk-foot-appli/
├── index.html          ← entrée Vite (OBLIGATOIRE ici, pas dans public/)
├── package.json
├── vite.config.ts
├── public/             ← assets bruts copiés tels quels (favicon, fonts…)
│   ├── logo-talk-foot.png  ← logo officiel (wordmark)
│   ├── favicon.svg
│   └── …
├── src/
│   ├── main.tsx        ← monté sur #root depuis index.html
│   ├── App.tsx
│   └── …
├── dist/               ← généré par `npm run build` (index.html + assets/)
└── docs/               ← généré par `npm run build:pages` (pour GitHub Pages)
```

| Élément | Rôle |
|--------|------|
| `index.html` (racine) | Point d’entrée : charge `<script src="/src/main.tsx">`, Vite le transforme au build |
| `public/` | Fichiers servis à l’URL racine **sans** passer par le bundler |
| `src/` | Tout le code React / TS / CSS importé par l’app |
| `dist/` | **Site compilé** après `npm run build` → `dist/index.html` + `dist/assets/` |
| `docs/` | Même chose pour GitHub Pages après `npm run build:pages` |

**GitHub Pages** ne doit servir que le **résultat du build** (`docs/` ou `dist/`), jamais le dossier `src/` directement.

## GitHub Pages

1. Sur GitHub : **Settings → Pages** → Source : branche **main**, dossier **`/docs`**.
2. En local :
   ```bash
   npm run build:pages
   git add docs && git commit -m "Deploy GitHub Pages" && git push
   ```
3. Le site sera sur `https://julienm1407.github.io/Talk-Foot-app1/` (adapte si tu renommes le dépôt).

**Si tu renommes le dépôt**, avant le build :
```bash
GH_PAGES_BASE=/NouveauNomDuRepo/ npm run build:pages
```
(ou modifie la valeur par défaut dans `vite.config.ts`.)

Le build génère aussi **`404.html`** (même contenu que `index.html`) et **`.nojekyll`** pour que les routes React (`/channel/…`) fonctionnent après rechargement.

**Tester en local comme sur GitHub Pages :**
```bash
npm run build:pages
npm run preview:pages
```
Ouvre l’URL affichée (souvent `http://localhost:4173/Talk-Foot-app1/`).
