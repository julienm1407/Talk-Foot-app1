# Talk Foot — applications mobiles (Capacitor)

Identifiant : **`com.talkfoot.app`**  
Site web : **https://talk-foot.com**  
Politique de confidentialité : **https://talk-foot.com/privacy**  
CGU : **https://talk-foot.com/terms**

## Prérequis

| Outil | Android | iOS |
|-------|---------|-----|
| Node.js | 20+ | 20+ |
| IDE | Android Studio (Ladybug+) | Xcode 16+ (macOS) |
| Compte store | Google Play Console | Apple Developer Program (99 €/an) |

Variables d’environnement : reprendre `.env.local` (Clerk, Supabase, SportMonks) — **ne pas** committer de clés secrètes dans le repo natif.

## Workflow quotidien

```bash
npm run dev              # web local
npm run build:mobile     # build Vite + cap sync
npm run cap:open:android # ouvre Android Studio
npm run cap:open:ios     # ouvre Xcode (macOS)
npm run cap:assets       # régénère icônes / splash depuis mobile/assets/icon.png
```

## Android — build release (Google Play)

1. Copier `android/keystore.properties.example` → `android/keystore.properties`
2. Créer le keystore (une seule fois) :
   ```bash
   keytool -genkey -v -keystore android/talk-foot-release.keystore -alias talkfoot -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Build AAB :
   ```bash
   npm run android:release
   ```
   Sortie : `android/app/build/outputs/bundle/release/app-release.aab`
4. Play Console → **Production** → créer l’app → uploader l’AAB
5. Remplir la fiche : `mobile/store/google-play/listing.fr-FR.json`
6. Questionnaire contenu, classification PEGI, politique de confidentialité (URL ci-dessus)

### Clerk (OAuth mobile)

Dans le dashboard Clerk → **Paths / Redirect URLs**, ajouter :

- `talkfoot://app`
- `com.talkfoot.app://oauth`

## iOS — build release (App Store)

> Nécessite un Mac avec Xcode.

1. Ouvrir `ios/App/App.xcworkspace` dans Xcode
2. **Signing & Capabilities** : Team Apple Developer, Bundle ID `com.talkfoot.app`
3. Incrémenter **Version** (1.0) et **Build** (1) à chaque soumission
4. **Product → Archive** → **Distribute App** → App Store Connect
5. Fiche App Store : `mobile/store/app-store/listing.fr-FR.json`
6. Export options : `mobile/store/app-store/ExportOptions.plist.example`

### Clerk (OAuth iOS)

Mêmes redirect URLs + Associated Domains si tu utilises Universal Links (`applinks:talk-foot.com`).

## Mode « site distant » (optionnel)

Dans `capacitor.config.ts`, décommente :

```ts
server: { url: 'https://talk-foot.com', cleartext: false }
```

L’app charge alors le site en prod sans rebundler le JS à chaque release native (mises à jour web instantanées). Utile en phase beta ; pour les stores, le mode **bundlé** (`dist`) est recommandé.

## Structure

```
capacitor.config.ts      # config Capacitor
mobile/assets/           # icon.png + splash.png sources
mobile/store/            # métadonnées Play + App Store
android/                 # projet Gradle
ios/                     # projet Xcode
src/mobile/              # bootstrap natif (status bar, retour Android)
```

## Checklist avant soumission

- [ ] `versionCode` / `versionName` (Android) et `CFBundleVersion` (iOS) incrémentés
- [ ] Captures d’écran phone + tablette (voir `mobile/store/screenshots/README.md`)
- [ ] URL politique de confidentialité accessible
- [ ] Compte démo pour la review Apple (email + mot de passe)
- [ ] Classification « Paris fictifs / tokens » expliquée dans les notes review
- [ ] Test connexion Clerk + chat live + achats Stripe sur device réel
