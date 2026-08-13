# Mission Antigravity — Moteur Monte Carlo par instrument (fidélité à l'Annexe C)

Copiez tout ce qui suit dans une nouvelle mission (Agent Manager → New Agent) sur le repo
`riane-portfolio`. Le fichier `AGENTS.md` à la racine est lu automatiquement par l'agent au
démarrage — ne le supprimez pas, il contient les règles non négociables du projet (fiscalité,
conventions de code, garde-fous mono-utilisateur).

---

## Contexte

Tu travailles sur RIANE Portfolio, une application personnelle de gestion patrimoniale réelle
(Next.js 16 / TypeScript / Firebase). Lis `AGENTS.md` et `README.md` avant toute action.

Le module `src/engines/monteCarloEngine.ts` simule aujourd'hui le portefeuille comme **un seul
actif** : un rendement moyen et une volatilité moyenne pondérés (calculés dans
`src/engines/riskAnalytics.ts`, fonction `calculatePortfolioRiskMetrics`) sont injectés dans une
marche aléatoire log-normale mensuelle unique. C'est une bonne approximation en espérance et en
volatilité globale, mais ce n'est PAS ce que fait l'Annexe C du plan de référence (document externe,
pas dans ce repo) : celle-ci simule **chaque instrument séparément** (son propre rendement et sa
propre volatilité), avec une corrélation entre eux via un facteur de marché commun, puis agrège
au niveau du portefeuille. Les deux approches donnent la même moyenne, mais des formes de
distribution différentes (asymétrie, queues) — notamment parce que Riber (volatilité ~100 %/an) se
comporte très différemment agrégé en amont vs simulé individuellement.

## Objectif de cette mission

Créer un **nouveau moteur** `src/engines/monteCarloPerInstrument.ts` qui simule chaque position
séparément (comme l'Annexe C), sans casser ni remplacer le moteur existant — les deux doivent
pouvoir coexister, l'utilisateur choisit lequel afficher dans `MonteCarloModal.tsx`.

## Spécification technique exacte

### 1. Registre d'hypothèses par instrument

Réutilise et étends les constantes déjà présentes dans `src/engines/riskAnalytics.ts`
(`ASSET_VOLATILITY`, `ASSET_EXPECTED_RETURN`, `ASSET_BETA`) — ne duplique pas ces valeurs, importe-les
ou factorise-les dans un module partagé si nécessaire (`src/data/assetAssumptions.ts` par exemple).

Facteur de marché commun : volatilité annuelle **16 %**.

### 2. Modèle de simulation par instrument (log-normal, un facteur)

Pour chaque simulation et chaque année `t` :
```
drift_i = ln(1 + mu_i) - 0.5 * sigma_i²
log_return_i,t = drift_i + beta_i * F_t + epsilon_i,t

où :
  F_t ~ Normal(0, sigma_marché=0.16)               — commun à tous les instruments cette année-là
  epsilon_i,t ~ Normal(0, sigma_idio_i)             — propre à l'instrument
  sigma_idio_i = sqrt(max(sigma_i² - (beta_i * 0.16)², 0.02²))
```
`price_relative_i,t = exp(log_return_i,t)`

### 3. Capitalisation des versements

Pour chaque position réelle (`Position[]`, poids = valeur de marché actuelle / valeur totale du
portefeuille — PAS des poids cibles théoriques), applique le même DCA mensuel que le moteur existant
(`monthlyDCA` réparti au prorata des poids réels), composé instrument par instrument sur l'horizon
demandé.

### 4. Fiscalité

Réutilise exactement la logique déjà présente dans `getEffectiveTaxRate` /
`applyFrenchTax` du moteur existant (`monteCarloEngine.ts`) — ne réinvente pas les règles
PEA/PEA-PME/CTO, importe les fonctions si elles sont exportables, sinon factorise-les d'abord dans
un module partagé.

### 5. Sortie attendue

Même contrat que `MonteCarloResult` existant (percentiles P1/P10/P50/P90 par année, milestones de
probabilité, capital net après impôts) — ajoute un champ optionnel `perInstrumentBreakdown` avec la
contribution de chaque position à la variance totale finale, pour affichage pédagogique.

## Validation obligatoire avant de considérer la mission terminée

1. `npm run build` passe sans erreur.
2. `npx eslint` propre sur tous les fichiers créés/modifiés.
3. Écris un test/script de sanity check (peut être un fichier temporaire exécuté puis supprimé, ou
   un vrai test si une infra de test existe) qui vérifie que la MOYENNE du nouveau moteur sur au
   moins 5000 tirages converge vers la même espérance que l'ancien moteur simplifié (± 3 %) pour un
   portefeuille donné — les deux modèles doivent être cohérents en moyenne même s'ils diffèrent en
   forme de distribution.
4. Documente dans `AGENTS.md` (section "Limites connues") que ce point est désormais résolu, avec
   un lien vers le nouveau fichier.

## Ce que tu NE dois PAS faire

- Ne touche pas à `src/app/api/cron/periodic-review/`, au module Revenu & Budget
  (`RevenueBudgetView.tsx`, `useRevenue.ts`), ni aux règles Firestore — hors scope de cette mission.
- Ne remplace pas le moteur existant — les deux coexistent, sélection par l'utilisateur dans l'UI.
- Ne modifie pas les valeurs déjà présentes dans `ASSET_VOLATILITY`/`ASSET_EXPECTED_RETURN`/
  `ASSET_BETA` sans justification sourcée — ce sont des données de recherche réelle, pas des
  placeholders.
- N'introduis pas de nouvelle dépendance npm sans la justifier explicitement dans ton plan avant de
  l'installer (checkpoint de revue attendu ici).

## Checkpoint de revue

Avant d'implémenter, présente d'abord ton plan détaillé (structure du fichier, signatures de
fonctions, stratégie de test) et attends une validation avant d'écrire le code de simulation
lui-même. C'est un calcul qui touche à de l'argent réel — la rigueur prime sur la vitesse.
