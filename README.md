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

## Structure (aperçu)

| Dossier / fichier | Rôle |
|-------------------|------|
| `index.html` | Point d’entrée Vite (dev + build) |
| `public/` | Fichiers statiques copiés tels quels (favicon, polices…) |
| `src/` | Code React / TypeScript |
| `dist/` | Build **classique** (`npm run build`) — hébergement type Netlify / serveur |
| `docs/` | Build **GitHub Pages** (`npm run build:pages`) — contient `index.html` prêt à servir |

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
