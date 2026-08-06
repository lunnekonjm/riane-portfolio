# 📜 Journal des Modifications (CHANGELOG) — RIANE Portfolio

## [v1.2.0] - 2026-08-06

### 🚀 Nouveautés & Améliorations Majeures

#### 📄 Audit des Bulletins de Salaire & Répartition Budgétaire
- **Détection du Bulletin Référent Actif (Pivot)** : La répartition budgétaire mensuelle du portefeuille (`monthlyBudget` / DCA) est désormais **exclusivitément pilotée par le dernier bulletin de salaire chronologique**.
- **Lissage Salarial Multi-Annuel (2025-2026)** : L'historique conserve l'ensemble des bulletins passés (2025, 2026) pour calculer le salaire net moyen lissé, le taux d'épargne moyen et la croissance salariale, **sans altérer l'allocation active** si le bulletin est antérieur.
- **Rénovation des Statuts UI/UX** : Remplacement des badges ambigus (*"En attente"*) par des statuts validés et explicites (`✓ Importé & Actif`, `✓ Importé (Historique)`).
- **Interface Modal Dédiée (`SalaryHistoryModal`)** : Ajout de la bannière référente, des cartes d'analyse KPI et du formulaire d'ajout rapide.
- **Bouton d'Accès Rapide** : Intégration du bouton `📄 Bulletins & Salaire` dans la barre supérieure de l'application.

#### 🔬 Moteur d'Analyse AI Multi-Agents
- Amélioration de l'orchestrateur d'agents avec analyse de risque et contradictions de marché.
- Rendu Markdown dynamique pour les rapports et audits personnalisés.

#### 🌐 Déploiement & Documentation
- Mise à jour des règles de sécurité et gestion des variables d'environnement sur Vercel.
- Documentation complète dans le README et changelog de version.

---

## [v1.1.0] - 2026-08-01
- Intégration de la simulation Monte Carlo FIRE et du rééquilibrage par les flux DCA.
- Module fiscal PEA, CTO, PEE et ajustement de l'inflation.

---

## [v1.0.0] - 2026-07-15
- Lancement initial de RIANE Portfolio.
