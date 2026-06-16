# Assets sources Capacitor

Remplace ces fichiers pour régénérer icônes et splash :

| Fichier | Taille recommandée |
|---------|-------------------|
| `icon.png` | 1024 × 1024 PNG (logo centré, fond transparent ou blanc) |
| `splash.png` | 2732 × 2732 PNG (logo centré sur fond #061222) |

Puis :

```bash
npm run cap:assets
npm run build:mobile
```

Les sources actuelles sont copiées depuis `public/logo-talk-foot.png`.
