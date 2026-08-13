<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RIANE Portfolio — Contexte projet pour agents IA

Lis ce fichier en entier avant toute tâche. Ce projet est une application personnelle
**mono-utilisateur** de gestion patrimoniale réelle (pas une démo, pas un boilerplate) — les
décisions ici ont un impact sur de l'argent réel. Priorise toujours la justesse et la traçabilité
des calculs sur la vitesse d'exécution.

## Ce qu'est l'application

Trois briques fusionnées en une seule app le 09/08/2026 :
1. **Plan d'investissement PEA/PEA-PME/CTO** — document de référence externe (Word/PDF), qui fait
   autorité sur toutes les hypothèses financières (fiscalité, volatilités, méthodologie de calcul).
2. **Moteur patrimonial** (ce repo) — positions réelles, agents IA de recherche, Monte Carlo, stress
   test, rapports périodiques.
3. **Revenu & Budget** — module porté depuis une app Flutter aujourd'hui retirée (AuraBudget Pro) ;
   parsing de fiche de paie par IA, capacité d'épargne mensuelle.

Historique complet dans `README.md` (section Tech Stack + Limites connues) et dans les rapports
Git successifs — ne pars jamais du principe que ce repo est un point de départ vierge.

## Règles non négociables

- **Ne jamais inventer une hypothèse financière** (taux de rendement, volatilité, taux d'imposition).
  Si une donnée manque, dis-le explicitement et cherche une source réelle (recherche web) plutôt que
  d'estimer à la louche. C'est la même règle qui a guidé toute la construction de ce projet.
- **Toujours vérifier la compilation avant de considérer une tâche terminée** :
  `npm run build` doit passer sans erreur, et `npx eslint <fichiers modifiés>` doit être propre
  (les warnings/erreurs pré-existants ailleurs dans `src/app/page.tsx` ne sont pas à corriger sauf
  demande explicite — ne pas élargir le scope).
- **App mono-utilisateur** — `OWNER_UID` (env var) est LE compte à servir. Ne pas complexifier vers
  du multi-tenant sans demande explicite.
- **Une seule vérité fiscale** : PEA/PEA-PME = 18,6 % sur la plus-value uniquement (jamais de
  compensation sur moins-value sauf mention explicite "convention symétrique"), CTO = 31,4 % (PFU).
  Plafonds : PEA 150 000 €, PEA + PEA-PME combiné 225 000 €. Au-delà, tout versement supplémentaire
  part obligatoirement en CTO.
- **Respecte les patterns UI existants** : classes CSS déjà définies dans `globals.css`
  (`.card`, `.btn-primary/secondary/ghost`, `.input`, `.table`, `.badge-*`, `.empty-state`) —
  ne pas introduire de nouvelle librairie de style. `page.tsx` est une single-page app avec
  navigation par onglets (`PageView` type + `currentView` state) ; toute nouvelle vue majeure suit
  ce pattern plutôt qu'un routing Next.js séparé.

## Carte du code

```
src/
├── app/
│   ├── page.tsx                      # Single-page app (~2600 lignes), navigation par onglets
│   └── api/
│       ├── generate-report/route.ts  # Génération de rapport IA (appelé manuellement + par le cron)
│       ├── parse-payslip/route.ts    # Extraction IA de fiche de paie, ventilée par nature de revenu
│       │                              # (salaire de base / prime / rachat de congés — taux net/brut
│       │                              # distincts, voir REFERENCE_NET_RATES dans types/revenue.ts)
│       ├── cron/periodic-review/     # Déclencheur automatique quotidien (Vercel Cron)
│       └── market-quote/route.ts
├── components/                       # Un composant par vue/modal, props explicites (pas de context API)
│   └── RevenueBudgetView.tsx         # Module Revenu & Budget : fiches de paie + réserve primes/rachats
├── engines/                          # Logique pure, sans état React — Monte Carlo, risque, stress test,
│                                      # rééquilibrage, rapports périodiques. C'est ici que vivent les
│                                      # hypothèses financières (à garder synchronisées avec le plan PDF).
│   └── flowRebalancer.ts             # calculateSmartFlowRebalance (historique) +
│                                      # calculateMonthlyInvestmentPlan (respecte Position.dcaFrequency —
│                                      # seul PUST est mensuel, le reste accumule jusqu'à un mois dû)
├── services/
│   ├── agents/                       # Pipeline multi-agents IA (orchestrator → dataAgent →
│   │                                  # researchAgent → criticAgent)
│   ├── market-data/                  # Alpha Vantage, Finnhub, Yahoo Finance, RSS réel
│   ├── firebase/
│   │   ├── firestore.ts              # Client SDK (contexte navigateur, session utilisateur)
│   │   └── admin.ts                  # Admin SDK (contexte serveur/cron, PAS de session utilisateur)
│   └── email/resend.ts               # Envoi des rapports périodiques
├── hooks/                            # useState/useEffect wrappers autour de Firestore (usePortfolio,
│                                      # useRevenue, useAnalysis)
└── types/                            # Sources de vérité des interfaces (Position, PortfolioConfig,
    └── revenue.ts                    # SalaryRecord (ventilé par composante), ReserveAllocation,
                                       # REFERENCE_NET_RATES (75,9 %/79,0 %/79,9 % — cf. plan PDF)
```

## Poche de réserve primes/rachats — règle non négociable

Les primes/bonus et rachats de jours de repos détectés sur un bulletin ne sont **jamais** répartis
automatiquement selon `RevenueConfig.allocationSplit` (40/40/20). Ils s'accumulent dans
`bonusReserveContribution` (voir `computeReserveBalance`), et c'est l'utilisateur qui décide
manuellement quand et vers quelle enveloppe les allouer (`ReserveAllocation`, généralement CTO).
Si une future fonctionnalité touche au module Revenu & Budget, ne réintroduis pas de dispatching
automatique sur cette poche — c'est un choix produit explicite, pas un oubli.

## Hypothèses financières actuelles (à garder synchronisées avec le plan PDF)

Voir `src/engines/riskAnalytics.ts` (`ASSET_VOLATILITY`, `ASSET_EXPECTED_RETURN`, `ASSET_BETA`) —
c'est la source unique consommée par le dashboard risque, le Monte Carlo, et les rapports IA.
Si le plan PDF de référence change ses hypothèses (nouvelle recalibration, nouveau titre), ce fichier
doit être mis à jour en premier — tout le reste en découle.

Le plan PDF est également la source de vérité pour la fiscalité par nature de revenu
(`REFERENCE_NET_RATES` dans `types/revenue.ts`) et pour le rythme d'achat réel par position
(`Position.dcaFrequency` dans `src/data/portfolio.ts` — PUST mensuel, tout le reste semestriel/annuel).

## Leçon du 12/08/2026 — collision de ticker

Une analyse a initialement confondu deux instruments homonymes : "GOAI" désigne à la fois une
micro-cap Nasdaq spéculative (Eva Live Inc., à proscrire) ET un ETF Amundi établi (MSCI Robotics &
AI, LU1861132840, légitime) selon la place de cotation. **Avant toute recherche sur un ticker,
vérifie la place de cotation et le nom complet de l'émetteur** — ne jamais assumer qu'un ticker à 4
lettres désigne un instrument unique, surtout entre marchés US et européens.

## Limites connues / roadmap ouverte

Voir `README.md` section "Limites connues". Résumé :
1. Le Monte Carlo (`monteCarloEngine.ts`) simule le portefeuille comme un seul actif
   (rendement/volatilité moyens pondérés injectés depuis `riskAnalytics.ts`), pas une vraie
   trajectoire par instrument multi-année comme l'Annexe C du plan PDF. Spec complète de la mission
   de correction : `ANTIGRAVITY_MISSION_MONTE_CARLO.md`. **Toujours pas fait — priorité haute.**
2. Cron mono-utilisateur (`OWNER_UID`) — pas d'itération multi-comptes.
3. Pas de réconciliation automatique entre les hypothèses de `riskAnalytics.ts` et celles
   documentées dans le plan PDF — une dérive silencieuse est possible si l'un des deux évolue seul.
4. `calculateMonthlyInvestmentPlan` respecte les fréquences d'achat par calendrier fixe, mais ne
   fait pas de vrai suivi de seuil de trésorerie accumulée avec dates (l'utilisateur a décrit un
   comportement "j'accumule jusqu'à X€ puis j'achète" — l'implémentation actuelle est une
   approximation calendaire, pas un vrai solde de trésorerie par position suivi dans le temps).
5. GOAI (ETF Amundi MSCI Robotics & AI) identifié comme complément de diversification CTO légitime
   mais son intégration chiffrée (impact sur les pondérations P1/P3, fiscalité, scénarios) n'a pas
   été faite — reste à faire si demandé.
6. Les frais de courtage réels (≈0,5 % BoursoBank/Interactive Brokers cités par l'utilisateur) ne
   sont pas modélisés dans les calculs de patrimoine — jugé d'impact marginal par l'utilisateur,
   non chiffré à ce jour.


