# RIANE Portfolio — Plan PEA · PEA-PME · CTO + Revenu & Recherche IA Proactive

Application personnelle unique de gestion patrimoniale : positions PEA/PEA-PME/CTO, revenu et
capacité d'épargne mensuelle, et un pipeline d'agents IA qui produit une revue de recherche
automatique (mensuelle / trimestrielle / tous les 4 mois / annuelle) — sans avoir à ouvrir l'app.

> Ce document a remplacé le README générique de bootstrap (« Ryan's Portfolio — Developer
> Showcase ») qui ne décrivait plus l'application depuis longtemps. Le nom du repo (`riane-portfolio`)
> et l'ancien README étaient un reliquat ; le code, lui, est déjà entièrement le plan patrimonial.

**Fusionné le 09/08/2026** avec le plan d'investissement PEA/PEA-PME/CTO (document de référence) et
le module Revenu & Budget (porté depuis l'app Flutter AuraBudget Pro, désormais retirée — toute
la logique utile vit ici).

---

## Ce que fait l'application

### 📊 Dashboard & Enveloppes
Positions, poids réels vs cibles, fiscalité par enveloppe (PEA/PEA-PME 18,6 %, CTO 31,4 %),
exposition change EUR/USD non couverte.

### 💰 Revenu & Budget *(nouveau)*
- Import de fiche de paie PDF → extraction structurée par Gemini (net, brut, PEE, primes)
- Historique des fiches de paie, moyenne glissante, taux d'épargne
- Synchronisation du budget mensuel d'investissement (`monthlyBudget`) sur le revenu réel

### 🔬 Analyse & Recherche IA
Pipeline multi-agents (`orchestrator` → `dataAgent` → `researchAgent` → `criticAgent`) avec
données de marché réelles (Alpha Vantage / Finnhub / Yahoo Finance) et actualités réelles (RSS).

### ⚡ Risque
VaR, stress tests, sensibilité, simulation DCA.

### 📰 Rapports périodiques — désormais proactifs *(nouveau)*
Génération à la demande **ou automatique** (voir Automatisation ci-dessous) de rapports
mensuels / trimestriels / tous les 4 mois / annuels : audit de valorisation, écarts de
pondération, plan de rééquilibrage chiffré en euros et en titres, synthèse des actualités par
ligne. Historique conservé dans Firestore (accessible depuis n'importe quel appareil).

---

## 🤖 Automatisation proactive (nouveau)

Un cron Vercel (`vercel.json`, quotidien à 7h UTC) appelle `/api/cron/periodic-review`, qui :

1. Détermine si une revue est due aujourd'hui (le 1er de chaque mois ; trimestre = Jan/Avr/Jul/Oct ;
   4 mois = Jan/Mai/Sep ; annuel = Jan)
2. Récupère vos positions et votre config via Firebase Admin (pas de session utilisateur requise)
3. Génère le rapport avec la même logique que le bouton manuel (`/api/generate-report`)
4. L'enregistre dans Firestore (visible dans l'onglet Rapports, marqué 🤖 Auto)
5. Vous l'envoie par email via Resend

**Aucune action requise de votre part au quotidien** — vous recevez l'email, vous décidez.

---

## 🛠️ Tech Stack

| Composant | Techno |
| :--- | :--- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript 5 |
| IA | Gemini (`@google/generative-ai`), rotation de modèles par quota |
| Backend | Firebase (Auth, Firestore client + Admin SDK) |
| Email | Resend |
| Données marché | Alpha Vantage, Finnhub, Yahoo Finance, RSS |
| Déploiement | Vercel (+ Vercel Cron) |

```
src/
├── app/
│   ├── api/
│   │   ├── generate-report/    # Génération de rapport (appelé manuellement ou par le cron)
│   │   ├── parse-payslip/      # NOUVEAU — extraction IA de fiche de paie
│   │   ├── cron/periodic-review/ # NOUVEAU — déclencheur automatique quotidien
│   │   └── market-quote/
│   └── page.tsx                # Single-page app, navigation par onglets
├── components/
│   ├── RevenueBudgetView.tsx   # NOUVEAU — module Revenu & Budget
│   └── ...
├── engines/                     # Monte Carlo, stress test, rééquilibrage, rapports périodiques
├── services/
│   ├── agents/                  # Pipeline multi-agents IA
│   ├── market-data/              # Connecteurs données de marché
│   ├── firebase/admin.ts        # NOUVEAU — accès serveur (cron)
│   └── email/resend.ts          # NOUVEAU — envoi des rapports
├── hooks/
│   └── useRevenue.ts            # NOUVEAU
└── types/
    └── revenue.ts                # NOUVEAU — SalaryRecord, RevenueConfig
```

---

## 🚀 Installation

### 1. Dépendances
```bash
npm install
```

### 2. Variables d'environnement
Copiez `.env.example` vers `.env.local` et remplissez chaque valeur — le fichier documente
précisément où trouver chacune (Firebase, Gemini, Resend, UID propriétaire...).

```bash
cp .env.example .env.local
```

Points d'attention pour les **nouvelles** variables :
- `FIREBASE_SERVICE_ACCOUNT_KEY` : Console Firebase → Paramètres du projet → Comptes de service →
  Générer une nouvelle clé privée. Collez le JSON entier sur une ligne.
- `OWNER_UID` : Console Firebase → Authentication → Users → copiez l'UID de votre propre compte.
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` : créez un compte sur [resend.com](https://resend.com)
  (gratuit jusqu'à 3000 emails/mois). Pour tester sans domaine vérifié, utilisez
  `onboarding@resend.dev` comme expéditeur.
- `CRON_SECRET` : générez une chaîne aléatoire (`openssl rand -hex 32`) et ajoutez-la aussi dans
  Vercel → Project Settings → Environment Variables. Vercel Cron l'envoie alors automatiquement.

### 3. Développement local
```bash
npm run dev
```

### 4. Déploiement
Push sur la branche connectée à Vercel. Le fichier `vercel.json` active automatiquement le cron
quotidien — vérifiez dans Vercel → Project → Cron Jobs qu'il apparaît après le premier déploiement.

---

## ⚠️ Limites connues de cette fusion (09/08/2026)

- L'app est conçue pour un usage **mono-utilisateur** (le cron lit un seul `OWNER_UID`). L'étendre
  à plusieurs utilisateurs demanderait d'itérer sur tous les comptes Firestore dans la route cron.
- Les volatilités par instrument utilisées dans l'Annexe C du plan PDF (recherchées : PUST 23 %,
  Riber 100 %, Memscap 57 %, Symbotic/Coherent 70 %, Constellation 40 %) ne sont pas encore
  reprises dans `monteCarloEngine.ts` (qui utilise un modèle simplifié portefeuille global, pas
  encore par instrument). Prochaine étape naturelle si vous voulez que le Monte Carlo de l'app
  corresponde exactement à celui du document.
- L'app Flutter AuraBudget Pro (Open Banking TrueLayer, catégories de dépenses détaillées) a été
  retirée du périmètre — seule la logique de revenu/investissable a été portée ici.

---

## 📜 Licence

Usage personnel.
