# Aspect Amis — architecture MVP extensible

**Dans l’app :** pas de page « hub Amis » dans la navigation — le social est **transverse** : présence / pile d’avatars sur le **live**, encart **Tes potes** sur l’accueil, **classement filtré amis** dans **Classements → Parieurs** (bloc démo), etc. Les mêmes capacités (messagerie, duels, Bronca, streaks) doivent **s’accrocher aux écrans existants**, pas à une destination unique.

Document de conception pour **classement amis**, **messagerie**, **feed d’activité**, **duels**, **badge LA BRONCA**, **streaks**.  
Objectif : **MVP simple** (peu de tables, événements explicites), **extensible** (indexes, agrégats, realtime).

---

## 1. Principes

| Principe | Choix MVP |
|----------|-----------|
| Source de vérité | Base relationnelle (PostgreSQL) + optionnel cache Redis pour classements / compteurs chauds |
| Temps réel | **Supabase Realtime** ou **Firebase** sur tables `messages`, `activity_events`, `duels` ; sinon polling 15–30 s sur MVP |
| Graphe amis | Table `friendships` **symétrisée** (une ligne par paire `user_low`, `user_high` + statut) pour requêtes simples et index unique |
| Feed | Table **append-only** `activity_events` (dénormalisation légère : `actor_name`, `payload` JSON) |
| Streaks | **Event-driven** à chaque action qualifiante + job quotidien (cron) pour reset / décrément |

Éviter : graphe Neo4j, microservices multiples, CQRS complet au MVP.

---

## 2. Architecture logique

```
┌─────────────┐     HTTPS/WS      ┌──────────────────┐
│  App React  │ ◄──────────────► │  API (REST/Edge) │
│  hooks amis │                  │  + Auth JWT      │
└──────┬──────┘                  └────────┬─────────┘
       │                                   │
       │ subscribe                         │ SQL
       ▼                                   ▼
┌─────────────┐                  ┌──────────────────┐
│ Realtime    │ ◄── changes ──── │ PostgreSQL       │
│ (optionnel) │                  │ + pg_cron / job  │
└─────────────┘                  └──────────────────┘
```

**Frontend (modulaire)**

- `features/friends/` : liste, demandes, profil ami
- `features/friendsLeaderboard/` : onglets métriques + cache SWR/React Query
- `features/friendsChat/` : threads 1-1 (MVP) ; groupes = phase 2
- `features/friendsFeed/` : infinite scroll sur `activity_events`
- `features/duels/` : création, pick, résultat
- `features/streaks/` : affichage + toast « streak sauvé »

**Backend**

- Services : `FriendsService`, `ActivityService`, `DuelService`, `StreakService`, `BroncaService`
- Tâches planifiées : clôture duels (post-match), reset streaks, snapshot hebdo leaderboard (optionnel)

---

## 3. Schéma de données (PostgreSQL)

### 3.1 Utilisateur & amis

```sql
-- Utilisateur (déjà chez vous : id, pseudo, avatar, etc.)
users (
  id            uuid PRIMARY KEY,
  username      text NOT NULL,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz DEFAULT now(),
  -- stats agrégées (mise à jour async ou sur événement)
  stats_wins    int DEFAULT 0,
  stats_roi_bps int DEFAULT 0,  -- ROI * 10000 si besoin précision
  stats_streak_current int DEFAULT 0,
  updated_at    timestamptz
);

-- Une seule ligne par paire (user_a < user_b lexicographiquement sur uuid)
friendships (
  user_a        uuid NOT NULL REFERENCES users(id),
  user_b        uuid NOT NULL REFERENCES users(id),
  status        text NOT NULL CHECK (status IN ('pending','accepted','blocked')),
  requested_by  uuid NOT NULL REFERENCES users(id),
  created_at    timestamptz DEFAULT now(),
  accepted_at   timestamptz,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE INDEX idx_friendships_user_a ON friendships(user_a) WHERE status = 'accepted';
CREATE INDEX idx_friendships_user_b ON friendships(user_b) WHERE status = 'accepted';
```

### 3.2 Match & présence (LA BRONCA)

```sql
matches (
  id            uuid PRIMARY KEY,
  external_id   text UNIQUE,     -- id fournisseur data
  home_team_id  uuid,
  away_team_id  uuid,
  kickoff_at    timestamptz,
  status        text,            -- scheduled, live, finished
  score_home    int,
  score_away    int
);

-- Présence « regarde le match » (heartbeat ou join live)
match_watch_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid NOT NULL REFERENCES matches(id),
  user_id       uuid NOT NULL REFERENCES users(id),
  started_at    timestamptz NOT NULL,
  ended_at      timestamptz,
  UNIQUE (match_id, user_id)     -- MVP : une session active par user/match
);

CREATE INDEX idx_watch_match ON match_watch_sessions(match_id) WHERE ended_at IS NULL;
```

### 3.3 Paris & activité

```sql
bets (
  id            uuid PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES users(id),
  match_id      uuid NOT NULL REFERENCES matches(id),
  stake_tokens  int NOT NULL,
  outcome       text NOT NULL,   -- home_win, draw, away_win, etc.
  odds          numeric,
  status        text NOT NULL,   -- open, won, lost, void
  payout_tokens int DEFAULT 0,
  settled_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_bets_user ON bets(user_id, created_at DESC);
CREATE INDEX idx_bets_match ON bets(match_id);

-- Feed unifié (ami + soi optionnel)
activity_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid NOT NULL REFERENCES users(id),
  actor_name    text NOT NULL,   -- dénormalisé
  type          text NOT NULL,   -- bet_placed, bet_won, live_join, post_tribune, duel_won, streak_milestone, ...
  match_id      uuid REFERENCES matches(id),
  bet_id        uuid REFERENCES bets(id),
  duel_id       uuid,
  payload       jsonb DEFAULT '{}',
  visibility    text NOT NULL DEFAULT 'friends', -- friends, public, private
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_friends_time ON activity_events(created_at DESC);
CREATE INDEX idx_activity_actor ON activity_events(actor_id, created_at DESC);
```

### 3.4 Duels

```sql
duels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid NOT NULL REFERENCES matches(id),
  challenger_id   uuid NOT NULL REFERENCES users(id),
  opponent_id     uuid NOT NULL REFERENCES users(id),
  stake_tokens    int NOT NULL DEFAULT 0,      -- mise symbolique / plafond
  reward_tokens   int NOT NULL,                -- bonus versé au gagnant
  pick_challenger text,   -- 'home' | 'away' | 'draw'
  pick_opponent   text,
  status          text NOT NULL CHECK (status IN ('pending','active','completed','cancelled')),
  winner_id       uuid REFERENCES users(id),
  result_reason   text,
  locked_at       timestamptz,   -- avant coup d'envoi
  resolved_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (match_id, challenger_id, opponent_id)
);

CREATE INDEX idx_duels_users ON duels(challenger_id, status);
CREATE INDEX idx_duels_opponent ON duels(opponent_id, status);
```

### 3.5 Messagerie (MVP 1-1)

```sql
conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low      uuid NOT NULL REFERENCES users(id),
  user_high     uuid NOT NULL REFERENCES users(id),
  last_message_at timestamptz,
  UNIQUE (user_low, user_high),
  CHECK (user_low < user_high)
);

chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  sender_id       uuid NOT NULL REFERENCES users(id),
  body            text,
  content_type    text NOT NULL DEFAULT 'text',  -- text, share_match, share_bet, share_event
  attachment      jsonb,  -- { matchId, betId, title, deepLink }
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz
);

CREATE INDEX idx_chat_conv_time ON chat_messages(conversation_id, created_at DESC);
```

### 3.6 Badges & streaks

```sql
user_badges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  badge_key     text NOT NULL,   -- 'la_bronca_match', 'la_bronca_season', ...
  scope_id      uuid,            -- match_id si temporaire par match
  earned_at     timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz,     -- NULL = permanent
  meta          jsonb DEFAULT '{}',
  UNIQUE (user_id, badge_key, scope_id)
);

user_streaks (
  user_id       uuid NOT NULL REFERENCES users(id),
  streak_key    text NOT NULL,   -- 'daily_interaction', 'co_watch_friend', ...
  current_count int NOT NULL DEFAULT 0,
  best_count    int NOT NULL DEFAULT 0,
  last_event_at date NOT NULL,   -- jour civil pour daily
  updated_at    timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, streak_key)
);
```

---

## 4. API REST (MVP)

| Méthode | Route | Rôle |
|---------|--------|------|
| GET | `/friends` | Liste amis acceptés (+ statut online optionnel) |
| POST | `/friends/request` | `targetUserId` |
| POST | `/friends/accept` | `requesterId` |
| DELETE | `/friends/:userId` | Retrait / blocage |
| GET | `/friends/leaderboard?metric=wins|roi|streak&window=7d|30d|all` | Classement restreint aux amis |
| GET | `/activity?cursor=&limit=` | Feed amis (filtré serveur) |
| POST | `/activity` | Rare : création manuelle si besoin |
| GET | `/conversations` | Liste threads |
| GET | `/conversations/:id/messages?cursor=` | Pagination |
| POST | `/conversations/:id/messages` | Envoi (+ `content_type`, `attachment`) |
| POST | `/duels` | Créer duel `{ matchId, opponentId, pick, stakeTokens? }` |
| PATCH | `/duels/:id/pick` | Réponse adversaire |
| POST | `/duels/:id/lock` | Verrouillage auto côté serveur à T-15min |
| POST | `/matches/:id/watch` | Début / heartbeat présence |
| DELETE | `/matches/:id/watch` | Fin session |
| GET | `/matches/:id/bronca` | Qui a le badge sur ce match (lecture) |

**Temps réel (canaux suggérés)**

- `conversation:{id}` — nouveaux messages  
- `user:{id}/activity` — optionnel  
- `match:{id}/presence` — compteur amis (pour UI Bronca)

---

## 5. Hooks React (exemples)

```ts
// useFriendsLeaderboard(metric, window)
// useFriendsActivity({ cursor })
// useConversationMessages(conversationId)
// useSendChatMessage()
// useDuel(matchId, opponentId)
// useMatchWatchSession(matchId)  // heartbeat
// useStreakDisplay('daily_interaction')
```

Stratégie cache : **React Query** avec `staleTime` court pour leaderboard (30–60 s), plus long pour liste d’amis.

---

## 6. Logique clé

### 6.1 Classement entre amis

**Entrée** : `viewerId`, `metric`, `window`.

**Étapes**

1. Résoudre le set `friendIds` : `SELECT user_b FROM friendships WHERE user_a = $viewer AND status='accepted' UNION ...` (les deux côtés de la paire).
2. Injecter `viewerId` dans le set (option « moi inclus »).
3. Selon métrique :
   - **gains** : `SUM(payout_tokens)` sur `bets` où `status='won'` et `settled_at` dans la fenêtre.
   - **ROI** : `(SUM(payout) - SUM(stake)) / NULLIF(SUM(stake),0)` sur la même fenêtre.
   - **streak** : `users.stats_streak_current` ou `user_streaks` pour clé dédiée.
4. `ORDER BY metric DESC`, `LIMIT 50`, tie-breaker `user_id`.

**Optimisation** : table matérialisée `leaderboard_friends_daily` (job nocturn) si > 10k users actifs — pas au MVP.

**Pseudo-SQL**

```sql
WITH f AS (
  SELECT CASE WHEN user_a = $me THEN user_b ELSE user_a END AS fid
  FROM friendships
  WHERE ($me IN (user_a, user_b)) AND status = 'accepted'
),
ids AS (SELECT fid FROM f UNION SELECT $me)
SELECT u.id, u.username, SUM(b.payout_tokens) AS score
FROM users u
JOIN bets b ON b.user_id = u.id AND b.status = 'won'
  AND b.settled_at >= $from AND b.settled_at < $to
WHERE u.id IN (SELECT fid FROM ids)
GROUP BY u.id, u.username
ORDER BY score DESC NULLS LAST
LIMIT 50;
```

---

### 6.2 Gestion duel

**Règles MVP**

- Création possible seulement si `match.status = 'scheduled'` et avant `locked_at` (ex. 15 min avant coup d’envoi).
- Les deux picks doivent être renseignées avant lock.
- À la fin du match : comparer pick au résultat réel (`home` / `away` / `draw`).
  - Un seul bon → il gagne `reward_tokens`.
  - Les deux bons ou les deux faux → nul (remboursement stake ou split selon produit).
  - Jetons crédités via transaction idempotente `duel_payout:{duelId}`.

**Workflow**

1. `POST /duels` → ligne `pending`, notif adversaire.
2. `PATCH pick` adversaire → `active` si les deux picks OK.
3. Cron / worker match-end : charge `duels` où `match_id = X` et `status = 'active'`, calcule `winner_id`, `UPDATE`, `INSERT activity_events` type `duel_won`, crédit wallet.

---

### 6.3 Badge « LA BRONCA »

**Définition MVP** : sur un `match_id` donné, parmi les utilisateurs avec session de watch active (ou ayant regardé > N minutes), compter combien d’**amis acceptés** sont simultanément en watch. L’utilisateur qui maximise ce compteur reçoit le badge.

**Algorithme (à la clôture du live ou toutes les 5 min en live)**

```text
Pour chaque user U en watch sur match M:
  friends_U = amis acceptés de U
  count_U = |friends_U ∩ users_en_watch_M|

bronca_winner = argmax_U count_U (tie-break: plus ancien en watch, puis user_id)
```

**Persistance**

- `user_badges` : `badge_key = 'la_bronca_match'`, `scope_id = match_id`, `expires_at = kickoff + 7j` (temporaire) ou permanent si produit « titre saison ».
- Éviter recalcul : stocker `match_bronca_snapshot(match_id, user_id, friend_count, computed_at)` pour affichage historique.

---

### 6.4 Streaks (style Snapchat)

**Types possibles**

| `streak_key` | Règle MVP |
|--------------|-----------|
| `daily_interaction` | Au moins 1 message envoyé **à un ami** ou 1 pari **par jour civil** (timezone user). |
| `co_watch_friend` | Même match live qu’au moins 1 ami pendant ≥ 10 min (heartbeat). |

**Mise à jour event-driven**

```text
onQualifiedAction(userId, streakKey, eventDate):
  row = user_streaks[userId, streakKey]
  if row is null:
    insert current_count=1, last_event_at=eventDate
  else if eventDate == row.last_event_at:
    return  // déjà compté aujourd'hui
  else if eventDate == row.last_event_at + 1 day:
    row.current_count += 1
    row.best_count = max(row.best_count, row.current_count)
    row.last_event_at = eventDate
  else:
    row.current_count = 1
    row.last_event_at = eventDate
```

**Cron quotidien (00:05 UTC ou fuseau majoritaire)**

- Pour chaque streak `daily_interaction` : si `last_event_at < today - 1` → reset `current_count` à 0 (déjà fait implicitement par la logique ci-dessus à la prochaine action ; le cron sert à **notifier** « streak cassée »).

---

## 7. UX / gamification (suggestions)

- **Leaderboard** : onglets « Cette semaine / Saison » + pastille sur toi ; animation montée/descente.
- **Duels** : carte match avec visuel « toi vs [ami] », compte à rebours jusqu’au lock, push « Il a choisi son camp ».
- **LA BRONCA** : flare visuel sur l’avatar en live + tooltip « X potes avec toi sur ce match ».
- **Streak** : flamme avec nombre ; message « Plus que 2h pour sauver la série » (fenêtre gracieuse 24h option).
- **Chat** : pièces jointes riches (carte match, ticket de pari) en **preview** tap-to-open.

**Extensions** : ligues d’amis saisonnières, défis hebdo (« 3 duels gagnés »), réactions sur messages, threads groupe par match.

---

## 8. Alignement avec Talk Foot (client actuel)

- Types existants : `User`, `Message` (live/tribune) — **ne pas confondre** avec `chat_messages` amis ; préfixer routes/types (`FriendMessage`, `DirectConversation`).
- Wallet / jetons : réutiliser la même monnaie pour récompenses duel (transaction tracée).
- Phase 0 sans backend : mocks dans `src/data/friendsMock.ts` + hooks derrière interface pour swap futur API.

---

## 9. Checklist MVP livrable

- [ ] Amitiés : demande / acceptation / liste  
- [ ] Leaderboard amis (1 métrique + fenêtre 7j)  
- [ ] Feed activité (5 types d’événements)  
- [ ] Chat 1-1 + partage match (payload JSON)  
- [ ] Duel : création, pick, résolution auto fin match  
- [ ] Bronca : calcul à la fin du live + badge temporaire  
- [ ] Streak : `daily_interaction` + cron notification  

---

*Document vivant — ajuster métriques et fenêtres avec la monétisation / équilibrage jetons.*
