# 📊 RIANE Portfolio — Plateforme Intelligente de Gestion de Portefeuille & Audit Financier

**RIANE Portfolio** est une application web moderne de gestion de portefeuille d'investissement, d'optimisation DCA (*Dollar-Cost Averaging*), d'analyse par agents IA et d'audit salarial multi-annuel.

🌐 **Déploiement en ligne** : [https://riane-portfolio.vercel.app](https://riane-portfolio.vercel.app)

---

## ✨ Fonctionnalités Principales

### 📄 Audit des Bulletins de Salaire & Répartition Budgétaire
- **Bulletin Référent Actif (Pivot)** : La répartition mensuelle d'investissement DCA est pilotée par le dernier bulletin de salaire chronologique en date.
- **Lissage Multi-Annuel (2025-2026)** : L'historique conserve l'ensemble des bulletins passés pour calculer la moyenne salariale lissée, le taux d'épargne effectif et la croissance salariale, **sans altérer la répartition d'allocation active**.
- **Statuts d'Importation Validés** : Identification explicite (`✓ Importé & Actif`, `✓ Importé (Historique)`), éliminant les statuts ambigus.

### 🔬 Analyse Multi-Agents par IA (Grounding & Critic)
- Réseau d'agents autonomes (Orchestrateur, Recherche, Analyse de Risque, Contradicteur/Critic, Synthèse) alimenté par Gemini 2.5/3.0.
- Analyse à la demande avec recherche en direct sur le web et vérification des fondamentaux financiers.

### 🎯 Rééquilibrage Intelligent par les Flux (Flow Rebalancing)
- Orientation automatique des versements mensuels DCA vers les lignes sous-pondérées pour minimiser les frottements fiscaux.

### 🏛️ Enveloppes Fiscales & Arbitrages
- Prise en charge des enveloppes françaises et internationales : **PEA**, **PEA-PME**, **CTO**, **PEE**, **OPPORTUNISTIC**, **SPECULATIVE**, **REVOLUT_X**.
- Simulation de la fiscalité (Flat Tax PFU 30% vs Barème Progressif TMI).

### ⚡ Stress Tests & Monte Carlo (FIRE)
- Tests de résistance basés sur les krachs historiques (2008, Covid 2020, Choc Inflationniste 2022).
- Simulation de Monte Carlo sur 5 à 40 ans pour l'indépendance financière.

---

## 🔒 Configuration & Sécurité des Clés API

L'application requiert la configuration de variables d'environnement dans un fichier `.env.local` en développement ou directement dans les **Settings > Environment Variables** du dashboard **Vercel**.

```bash
# Firebase Authentication & Firestore Database
NEXT_PUBLIC_FIREBASE_API_KEY=votre_cle_api_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef

# API Données Marché (Optionnel)
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=votre_cle_alpha_vantage
NEXT_PUBLIC_FINNHUB_API_KEY=votre_cle_finnhub

# Agent IA Gemini (Serveur)
GEMINI_API_KEY=votre_cle_gemini_api
```

> [!IMPORTANT]
> **Règles de Sécurité & Bonnes Pratiques** :
> 1. Ne pas commiter de clé d'API en clair dans le dépôt Git. Le fichier `.env.local` est exclu via `.gitignore`.
> 2. Dans la console Google Cloud / Firebase, **restreignez la clé API HTTP Referrer** pour qu'elle ne fonctionne que sur vos domaines autorisés (`riane-portfolio.vercel.app` et `localhost:3000`).
> 3. Sur Vercel, ajoutez ces variables sous l'onglet *Production* et *Preview*.

---

## 🚀 Installation & Développement Local

```bash
# 1. Cloner le dépôt
git clone https://github.com/lunnekonjm/riane-portfolio.git
cd riane-portfolio

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Compiler le projet
npm run build
```

---

## 📄 Licence & Crédits
Développé avec Next.js 16, React, TypeScript et TailwindCSS/Vanilla CSS.
Tous droits réservés © 2026 RIANE.
