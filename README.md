# Talk-Foot-app1

Application de football en direct : live match, chat, paris, réactions. Replay Rennes-PSG avec simulation temps réel, API Football (5 grands championnats européens).

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
