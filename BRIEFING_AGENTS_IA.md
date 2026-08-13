# Briefing complet — RIANE Portfolio (à lire avant toute intervention)

À coller en entier dans le premier message de la mission, en même temps que ce zip. Ce document
est le point d'entrée narratif ; `AGENTS.md` (à la racine) contient les règles techniques
non-négociables et est lu automatiquement par Antigravity à chaque session — ne le supprime pas.

**Mis à jour le 12/08/2026** — inclut le module Revenu & Budget et ses règles de gouvernance.

---

## 1. Ce que tu reçois, et pourquoi c'est sensible

Ce zip est une application personnelle de **gestion patrimoniale réelle** — pas une démo, pas un
boilerplate à améliorer librement. Une personne réelle l'utilise pour piloter de l'argent réel
investi sur PEA, PEA-PME et Compte-Titres Ordinaire, ainsi que son revenu réel (bulletins de paie).
Chaque hypothèse financière que tu manipules (taux de rendement, volatilité, taux d'imposition,
taux net/brut par nature de revenu) a été établie avec un soin particulier — vérifiée, recherchée,
ou sourcée sur des cas réels — dans un document de référence externe (le "plan"). Ton rôle n'est
pas de réinventer ces hypothèses mais de les faire vivre correctement dans le code.

**Trois fautes à ne jamais commettre :**
- Inventer un chiffre financier (rendement, volatilité, taux) qui n'existe pas dans les sources déjà
  établies. Si une donnée manque, dis-le et cherche une source réelle plutôt que d'estimer.
- Introduire une hypothèse dans le code (y compris dans un prompt système d'agent IA) sans vérifier
  qu'elle correspond au plan de référence.
- Assumer qu'un ticker désigne un instrument unique sans vérifier la place de cotation (voir
  section 4, l'épisode GOAI).

## 2. Comment cette application est née (contexte historique)

Trois briques ont été fusionnées en une seule application :

1. **Le plan d'investissement PEA/PEA-PME/CTO** (document Word/PDF externe, pas dans ce zip) —
   fait autorité sur toute hypothèse financière. Portefeuille de référence codé dans l'app
   (**Portefeuille 1, Modéré, 40/40/20**) :
   - PEA classique : 40 % du total, **100 % Nasdaq-100 (PUST.PA)**
   - PEA-PME : 40 % du total — Indépendance Europe Small 26,67 % / Riber 6,67 % / Memscap 6,66 %
   - CTO : 20 % du total — Symbotic 7 % / Coherent 7 % / Constellation Energy 6 %
   - Fiscalité : PEA/PEA-PME 18,6 % sur la plus-value uniquement, CTO 31,4 % (PFU). Plafonds :
     PEA 150 000 €, PEA + PEA-PME combiné 225 000 €.
   - Volatilités annuelles recherchées par titre : PUST 23 %, Indépendance Europe Small 15 %,
     Riber 100 %, Memscap 57 %, Symbotic 70 %, Coherent 70 %, Constellation Energy 40 %. Modèle de
     corrélation à un facteur de marché commun (16 %/an) + change EUR/USD (8 %/an, exposition
     PUST + CTO) + inflation (1,5 à 3 %/an selon scénario).
   - Fiscalité par nature de revenu (cas réel) : salaire de base ≈75,9 % net/brut, prime ≈79,0 %,
     rachat de congés ≈79,9 % — le PAS s'applique ensuite sur chaque composante séparément.
   - Rythme d'achat réel : seul PUST est en virement mensuel. Le reste (PEA-PME, CTO) accumule
     jusqu'à un seuil avant achat groupé (frais de courtage ≈0,5 % proportionnellement lourds sur
     petits montants).

2. **Le moteur patrimonial** (ce repo) — pipeline multi-agents IA, données de marché réelles,
   Monte Carlo, stress test, rapports périodiques automatisés (cron + email).

3. **Un module Revenu & Budget** — suivi des bulletins de paie, avec une règle de gouvernance
   explicite : les primes et rachats de congés ne sont **jamais** dispatchés automatiquement, ils
   s'accumulent dans une réserve allouée manuellement (généralement en CTO). Voir section 3.

## 3. Ce qui a déjà été construit (ne pas refaire)

- **Module Revenu & Budget** (`RevenueBudgetView.tsx`, `useRevenue.ts`, `types/revenue.ts`) :
  import de fiche de paie PDF, extraction IA ventilée par nature de revenu (salaire de base / prime
  / rachat, taux net/brut distincts), historique, synchronisation du budget mensuel régulier.
- **Poche de réserve primes/rachats** (`ReserveAllocation`, `computeReserveBalance`) : accumulation
  automatique, allocation 100 % manuelle. Ne réintroduis pas de dispatching automatique dessus.
- **Fréquences d'achat réalistes** (`Position.dcaFrequency` + `calculateMonthlyInvestmentPlan` dans
  `flowRebalancer.ts`) : PUST mensuel, PEA-PME/CTO semestriel ou annuel selon le calendrier fixe
  (approximation calendaire, pas un vrai suivi de solde de trésorerie daté — voir limites).
- Automatisation proactive (`api/cron/periodic-review/`) : cron quotidien, rapports mensuel /
  trimestriel / 4 mois / annuel générés et envoyés par email (Resend) sans action utilisateur.
- Recalibrage de `riskAnalytics.ts` sur les vraies données recherchées (volatilités, rendements,
  betas) — source unique pour dashboard risque, Monte Carlo (mean/vol), rapports IA.
- Structure de portefeuille par défaut (`src/data/portfolio.ts`) alignée exactement sur P1 — un
  fonds ACWI (GPEA.PA) qui traînait par erreur dans le gabarit initial et dans le prompt système de
  l'agent d'analyse a été retiré (voir section 4).

## 4. Deux leçons concrètes des dérives déjà trouvées et corrigées

**Dérive de composition (10/08/2026)** : `src/data/portfolio.ts` incluait un fonds ACWI (GPEA.PA) à
40 % + PUST à seulement 20 %, alors que le plan est sans ambiguïté (PEA classique = 100 % PUST
depuis le 27/07/2026). Pire : le prompt système de l'agent d'analyse conversationnelle
(`src/services/agents/orchestrator.ts`) recommandait explicitement d'allouer jusqu'à 50 % du PEA
vers ce fonds ACWI — ça biaisait en direct les recommandations données à l'utilisateur. **Une
hypothèse fausse peut se cacher dans un prompt système d'agent IA, pas seulement dans les données.**

**Collision de ticker (12/08/2026)** : une recherche sur "GOAI" a d'abord identifié une micro-cap
Nasdaq spéculative en difficulté financière (Eva Live Inc.) — le mauvais instrument. "GOAI" désigne
en réalité un ETF Amundi établi (MSCI Robotics & AI, LU1861132840) coté sur les places européennes.
Même ticker, deux émetteurs, deux marchés, deux profils de risque radicalement différents. **Avant
toute recherche sur un ticker, vérifie la place de cotation et le nom complet de l'émetteur.**

## 5. Règles de travail (résumé — le détail complet est dans AGENTS.md)

- `npm run build` doit passer sans erreur avant de considérer une tâche terminée.
- `npx eslint <fichiers modifiés>` doit être propre. Les erreurs pré-existantes ailleurs dans le
  repo ne sont pas à corriger sauf mission dédiée — ne pas élargir le scope silencieusement.
- App **mono-utilisateur** (`OWNER_UID`) — ne pas complexifier vers du multi-tenant sans demande
  explicite.
- Respecter les patterns UI existants (classes CSS de `globals.css`, navigation par onglets).
- Avant tout changement touchant à une hypothèse financière ou à un prompt d'agent IA : présente ton
  plan et attends une validation. La rigueur prime sur la vitesse d'exécution.

## 6. Feuille de route — missions par ordre de priorité

### Mission A (priorité haute, toujours pas faite) — Moteur Monte Carlo par instrument
Spécification technique complète déjà rédigée : voir `ANTIGRAVITY_MISSION_MONTE_CARLO.md` à la
racine de ce zip.

### Mission B — Audit de cohérence complet
Chercher systématiquement d'autres occurrences d'une hypothèse ou composition qui ne
correspondrait pas au Portefeuille 1 (données par défaut, prompts système des agents IA, fallbacks
de prix, registres d'actifs, exemples codés en dur) — sur le modèle des deux dérives de la
section 4. Documenter chaque écart trouvé avant de corriger, présenter la liste pour validation.

### Mission C (basse priorité, ne pas lancer sans demande explicite)
- Suivi de trésorerie par position avec vraies dates (remplacer l'approximation calendaire de
  `calculateMonthlyInvestmentPlan` par un vrai solde accumulé daté, avec projection de date d'achat).
- Chiffrage de l'intégration de GOAI (ETF Amundi MSCI Robotics & AI) comme complément de
  diversification CTO — impact sur les pondérations P1/P3, la fiscalité, les scénarios.
- Modélisation des frais de courtage réels (≈0,5 % BoursoBank/IBKR) dans les calculs de patrimoine.
- Généralisation multi-utilisateurs du cron.

## 7. Documents fournis dans ce zip

- `README.md` — vue d'ensemble technique, stack, installation, variables d'environnement.
- `AGENTS.md` — règles de travail détaillées, carte du code, lu automatiquement par Antigravity.
- `ANTIGRAVITY_MISSION_MONTE_CARLO.md` — spec complète de la Mission A.
- Ce fichier — contexte narratif complet, à donner en premier message de toute nouvelle mission.
