# Mise à jour à appliquer sur le projet réel (riane-portfolio)

À coller en premier message d'une mission Antigravity **sur votre repo réel** (pas sur ce zip — ce
zip sert de référence source pour le code exact à porter). L'agent doit avoir accès aux deux : ce
zip (état de référence après mise à jour) et votre repo réel (état actuel, potentiellement divergent
si vous avez travaillé dessus entre-temps).

---

## Contexte pour l'agent

Le zip joint est une copie de ce projet (`riane-portfolio`) après une série de mises à jour faites
en dehors de votre repo réel. Ta mission n'est **pas** de construire quelque chose de nouveau : c'est
d'appliquer fidèlement, fichier par fichier, les changements listés ci-dessous à ton propre repo.

**Procédure recommandée pour chaque fichier listé :**
1. Compare la version de ce fichier dans le zip avec la version actuelle de ton repo réel.
2. Si ton repo n'a pas divergé sur ce fichier depuis la base commune → remplace-le directement par
   la version du zip.
3. Si ton repo a évolué indépendamment sur ce fichier (autre session, autre agent) → fusionne
   manuellement en préservant les deux jeux de changements, en donnant priorité à la logique métier
   décrite ci-dessous en cas de conflit réel.
4. Après chaque fichier ou petit groupe de fichiers cohérent : `npm run build` doit rester vert.
5. À la fin : dérouler la checklist de vérification en section finale avant de considérer la mission
   terminée.

Lis `AGENTS.md` (déjà à jour dans le zip, à appliquer aussi sur le repo réel) pour les règles de
travail générales — ce document-ci ne couvre que le changelog précis.

---

## 1. Nouveaux fichiers à créer (copier tels quels depuis le zip)

| Fichier | Rôle |
|---|---|
| `src/types/revenue.ts` | Types Revenu & Budget : `SalaryRecord` ventilé par nature de revenu (salaire de base / prime / rachat de congés, chacun avec son propre net/brut), `ReserveAllocation`, `REFERENCE_NET_RATES` (75,9 % / 79,0 % / 79,9 %), `computeSalaryAnalytics`, `computeReserveBalance`. |
| `src/hooks/useRevenue.ts` | Hook Firestore pour `SalaryRecord[]`, `RevenueConfig`, `ReserveAllocation[]`. |
| `src/components/RevenueBudgetView.tsx` | Vue Revenu & Budget complète (import PDF, ventilation par composante, poche de réserve, allocation manuelle). |
| `src/app/api/parse-payslip/route.ts` | Extraction IA (Gemini) d'un bulletin de paie, ventilée par composante — remplace tout appel à un service tiers existant pour cette fonction. |
| `src/services/firebase/admin.ts` | Firebase Admin SDK — accès serveur (cron), nécessite `FIREBASE_SERVICE_ACCOUNT_KEY`. |
| `src/services/email/resend.ts` | Envoi d'email des rapports périodiques via Resend. |
| `src/app/api/cron/periodic-review/route.ts` | Route cron quotidienne — génère et envoie les rapports dus (mensuel/trimestriel/4 mois/annuel). |
| `vercel.json` | Déclaration du cron Vercel (`0 7 * * *` → `/api/cron/periodic-review`). |
| `AGENTS.md`, `BRIEFING_AGENTS_IA.md`, `ANTIGRAVITY_MISSION_MONTE_CARLO.md` | Documentation agents — copier tels quels. |

## 2. Fichiers existants à modifier

### `src/data/portfolio.ts` — Correction de composition (important, déjà en prod si vous avez suivi les échanges précédents — vérifier que c'est bien appliqué)
- Le fonds `GPEA.PA` (Amundi ACWI) est retiré des positions par défaut — il ne fait pas partie du
  Portefeuille 1 documenté.
- `PUST.PA` : `targetWeight` corrigé à **0.40** (fraction du portefeuille TOTAL, pas de l'enveloppe).
- Poids CTO corrigés : Symbotic **0.07**, Coherent **0.07**, Constellation **0.06** (les valeurs
  précédentes 0.35/0.35/0.30 étaient des fractions de l'enveloppe CTO, incohérentes avec le reste).
- Ajout de `dcaFrequency` par position : `'monthly'` pour PUST uniquement ; `'semestrial'` pour
  Indépendance/Riber/Memscap ; `'annual'` pour Symbotic/Coherent/Constellation.

### `src/services/agents/orchestrator.ts` — Correction du prompt système
- Retirer toute recommandation d'allouer une part du PEA vers un "Core Stabilisateur MSCI ACWI
  (GPEA.PA)" — remplacé par une consigne explicite : la PEA classique est concentrée à 100 % PUST,
  ne pas proposer de réintroduire un ETF Core diversifié sauf demande explicite.
- L'exemple chiffré de répartition DCA (précédemment 500€ GPEA + 200€ PUST) est remplacé par un
  exemple cohérent avec P1 (700€ PUST 40%, 467€ Indépendance 26,67%).
- La branche "profil conservateur" ne doit plus proposer de pourcentages inventés (aucune
  composition validée n'existe pour ce profil dans le plan) — elle doit le signaler explicitement.

### `src/engines/riskAnalytics.ts` — Recalibrage des hypothèses
- `ASSET_VOLATILITY` : PUST.PA 23%, `0P0001DKPM.F` (Indépendance) 15%, ALRIB.PA (Riber) 100%,
  MEMS.PA (Memscap) 57%, COHR 70%, CEG 40%, SYM 70% — remplace des valeurs approximatives
  précédentes nettement plus basses, notamment sur Riber (35%→100%).
- Nouveaux registres `ASSET_EXPECTED_RETURN` et `ASSET_BETA` (mêmes tickers).
- `calculatePortfolioRiskMetrics` : remplace l'heuristique de diversification 1/√N par un vrai
  modèle à facteur de marché unique (`MARKET_FACTOR_VOL = 0.16`), calcule un `expectedReturn`
  pondéré réel (au lieu d'un flat 9% générique), et un `coveragePercent`.
- Type `PortfolioRiskMetrics` étendu avec `expectedReturn` et `coveragePercent`.

### `src/engines/flowRebalancer.ts` — Ajout (ne pas toucher aux fonctions existantes)
- Ajouter en fin de fichier : `DcaFrequency`, `monthsBetweenPurchases`, `isDueThisMonth`,
  `MonthlyInvestmentPlan`, `calculateMonthlyInvestmentPlan` — logique de fréquence d'achat par
  position (voir le zip pour le code exact, ~90 lignes).

### `src/services/firebase/firestore.ts` — Nouvelles fonctions
- `getSalaryRecords`, `saveSalaryRecord`, `deleteSalaryRecord`, `getRevenueConfig`,
  `saveRevenueConfig` (module Revenu & Budget de base).
- `getReserveAllocations`, `saveReserveAllocation`, `deleteReserveAllocation` (poche de réserve).
- `getReports`, `saveReport`, `deleteAllReports` avec type `SavedReportRecord` (migration de
  l'historique des rapports périodiques de localStorage vers Firestore).

### `src/components/MonteCarloModal.tsx` — Pré-remplissage réel
- Accepte deux nouvelles props optionnelles `positions` et `fxRates`.
- `expectedReturn`/`volatility` initialisés depuis `calculatePortfolioRiskMetrics(positions,
  fxRates)` plutôt que des valeurs génériques (7.5%/15%) — reste éditable, avec bouton "Revenir aux
  valeurs du portefeuille" et bandeau de transparence sur la couverture des hypothèses.

### `src/components/ReportsView.tsx` — Persistance Firestore
- Nouvelle prop `uid`. Charge l'historique depuis Firestore (fusionné avec localStorage pour
  compatibilité ascendante), écrit dans les deux à la génération d'un rapport.
- Badge "🤖 Auto" sur les rapports générés par le cron (`generatedBy: 'cron'`).

### `src/app/api/generate-report/route.ts`
- `ReportPeriod` étendu avec `'quadrimestrial'` (tous les 4 mois), en plus de
  monthly/quarterly/semestrial/annual — logique de libellé et de multiplicateur DCA mise à jour en
  conséquence.
- Texte de section risque enrichi : affiche désormais `riskMetrics.expectedReturn` et
  `riskMetrics.coveragePercent` en plus de la volatilité et de la VaR.

### `src/components/ReportsView.tsx` (sélecteur de période)
- Ajout des entrées `quadrimestrial` dans la liste des périodes proposées (P1/P2 2026).

### `src/app/page.tsx` — Câblage
- Import et état pour `useRevenue()` (records, revenueConfig, allocations, handlers).
- Nouvel élément de navigation "💰 Revenu & Budget" (`currentView === 'revenue'`) avec rendu de
  `RevenueBudgetView`.
- `MonteCarloModal` reçoit désormais `positions={positions}` et `fxRates={fxRates}`.
- `ReportsView` reçoit désormais `uid={user?.uid}`.

### `README.md`
- Réécriture complète — reflète l'état réel du projet (plus le README générique "developer
  showcase" d'origine). Copier tel quel depuis le zip si votre repo a encore l'ancienne version.

### `.env.example`
- Nouvelles variables : `FIREBASE_SERVICE_ACCOUNT_KEY`, `OWNER_UID`, `OWNER_EMAIL`,
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `APP_BASE_URL`.

## 3. Dépendances npm à ajouter

```bash
npm install pdf-parse resend firebase-admin
```

---

## 4. Checklist de vérification finale

- [ ] `npm run build` passe sans erreur.
- [ ] Aucune référence à `GPEA.PA` comme stratégie active (ni dans `portfolio.ts`, ni dans
      `orchestrator.ts`) — seuls les registres génériques (`riskAnalytics.ts`, `assetRegistry.ts`)
      peuvent encore le reconnaître s'il est ajouté manuellement par l'utilisateur.
- [ ] Un bulletin de paie avec prime détectée n'affiche **aucune** proposition de répartition
      PEA/PEA-PME/CTO automatique — seulement un ajout à la réserve.
- [ ] `Position.dcaFrequency` est bien réglé sur chaque position par défaut (`portfolio.ts`).
- [ ] Le cron `/api/cron/periodic-review` répond (test manuel avec le bon `CRON_SECRET` en header
      `Authorization: Bearer ...`).
- [ ] Le Monte Carlo modal se pré-remplit avec les vraies positions quand elles existent.
- [ ] Les nouvelles variables d'environnement sont documentées dans `.env.local` (pas juste
      `.env.example`) sur votre déploiement réel.
