'use client';

import { useState } from 'react';

export interface GlossaryTerm {
  term: string;
  fullName: string;
  category: 'Fiscalité' | 'Gestion & Stratégie' | 'Indicateurs de Risque' | 'Marché';
  definition: string;
  example: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'PRU',
    fullName: 'Prix Moyen d\'Acquisition (Prix de Revient Unitaire)',
    category: 'Gestion & Stratégie',
    definition: 'Le prix moyen auquel vous avez acheté une action ou un ETF, en incluant les différents achats successifs.',
    example: 'Si vous achetez 1 action à 100 € puis 1 action à 120 €, votre PRU est de (100 + 120) / 2 = 110 €.',
  },
  {
    term: 'DCA',
    fullName: 'Dollar-Cost Averaging (Investissement Programmé)',
    category: 'Gestion & Stratégie',
    definition: 'Stratégie consistant à investir un montant fixe chaque mois (ex: 500 €/mois), peu importe si les marchés montent ou descendent.',
    example: 'Le DCA lisse le prix d\'achat moyen dans le temps et évite d\'essayer de deviner le meilleur moment pour investir.',
  },
  {
    term: 'PEA',
    fullName: 'Plan d\'Épargne en Actions',
    category: 'Fiscalité',
    definition: 'Enveloppe fiscale française réservée aux actions et ETF européens. Après 5 ans, vos gains (plus-values et dividendes) sont totalement exonérés d\'impôt sur le revenu (0% IR). Seuls les prélèvements sociaux (18.6%) s\'appliquent.',
    example: 'Plafond légal de versement : 150 000 €.',
  },
  {
    term: 'PEA-PME',
    fullName: 'Plan d\'Épargne en Actions PME / ETI',
    category: 'Fiscalité',
    definition: 'Enveloppe fiscale dédiée aux petites et moyennes entreprises européennes. Mêmes avantages fiscaux que le PEA (0% IR après 5 ans).',
    example: 'Plafond cumulé PEA + PEA-PME : 225 000 € au total.',
  },
  {
    term: 'CTO',
    fullName: 'Compte-Titres Ordinaire',
    category: 'Fiscalité',
    definition: 'Enveloppe d\'investissement universelle sans aucun plafond. Permet d\'acheter des actions du monde entier (USA, Asie, etc.). Soumis à la Flat Tax / PFU de 30%.',
    example: 'Idéal pour les actions américaines (ex: Microsoft, Apple) non éligibles au PEA en direct.',
  },
  {
    term: 'PFU / Flat Tax',
    fullName: 'Prélèvement Forfaitaire Unique (31.4%)',
    category: 'Fiscalité',
    definition: 'Taxe forfaitaire de 31.4% prélevée sur les plus-values et dividendes du CTO. Elle se compose de 12.8% d\'Impôt sur le Revenu (IR) et 18.6% de Prélèvements Sociaux (PS).',
    example: 'Sur 1 000 € de gain en CTO, l\'impôt est de 314 € (686 € nets).',
  },
  {
    term: 'Prélèvements Sociaux (PS)',
    fullName: 'Cotisations Sociales (18.6%)',
    category: 'Fiscalité',
    definition: 'Prélèvements sociaux obligatoires appliqués à l\'ensemble des revenus du patrimoine en France.',
    example: 'En PEA après 5 ans, vous ne payez que les 18.6% de PS et 0% d\'impôt sur le revenu.',
  },
  {
    term: 'VaR 95%',
    fullName: 'Value at Risk 95% (Valeur à Risque à 95%)',
    category: 'Indicateurs de Risque',
    definition: 'Estimation statistique de la perte maximale probable sur 1 mois dans 95% des scénarios de marché normaux.',
    example: 'Une VaR 95% de -6.5% signifie que dans 95% des mois, votre perte ne dépassera pas 6.5%.',
  },
  {
    term: 'Ratio de Sharpe',
    fullName: 'Rendement Ajusté du Risque',
    category: 'Indicateurs de Risque',
    definition: 'Mesure l\'efficacité de votre portefeuille : combien de rendement vous obtenez pour chaque unité de risque pris.',
    example: 'Un Ratio de Sharpe > 1.0 indique une excellente performance par rapport au risque.',
  },
  {
    term: 'Bêta',
    fullName: 'Sensibilité au Marché Global',
    category: 'Indicateurs de Risque',
    definition: 'Mesure l\'amplitude de réaction de votre portefeuille aux mouvements de marché. Bêta = 1.0 signifie que votre portefeuille évolue exactement comme l\'indice mondial.',
    example: 'Bêta = 1.2 : Si le marché monte de 10%, votre portefeuille monte de 12% (et inversement à la baisse).',
  },
  {
    term: 'Overlapping',
    fullName: 'Recouvrement & Redondance',
    category: 'Marché',
    definition: 'Proportion d\'une action individuelle que vous possédez déjà indirectement à travers vos ETF indiciels.',
    example: 'Acheter du Microsoft en direct alors qu\'il représente déjà 10% de votre ETF Nasdaq PUST.PA crée de la redondance.',
  },
];

interface GlossaryInfoModalProps {
  onClose: () => void;
  initialTerm?: string;
}

export default function GlossaryInfoModal({ onClose, initialTerm }: GlossaryInfoModalProps) {
  const [search, setSearch] = useState(initialTerm || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  const categories = ['Tous', 'Fiscalité', 'Gestion & Stratégie', 'Indicateurs de Risque', 'Marché'];

  const filteredTerms = GLOSSARY_TERMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'Tous' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h2>📚 Lexique Financier & Explications Pédagogiques</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Définitions claires sans abréviations complexes pour comprendre votre portefeuille.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Search & Category Filter */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, marginTop: 12 }}>
          <input
            className="input"
            placeholder="🔍 Rechercher un terme (ex: PRU, PEA, VaR, Flat Tax, DCA...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory(cat)}
                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Term List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
          {filteredTerms.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              Aucun terme ne correspond à votre recherche.
            </div>
          ) : (
            filteredTerms.map((item) => (
              <div
                key={item.term}
                style={{
                  padding: 16,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent-cyan)' }}>{item.term}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', marginLeft: 8, fontWeight: 600 }}>({item.fullName})</span>
                  </div>
                  <span className="badge badge-violet" style={{ fontSize: 10 }}>{item.category}</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  {item.definition}
                </p>
                <div style={{ fontSize: 12, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, color: 'var(--accent-emerald)', borderLeft: '3px solid var(--accent-emerald)' }}>
                  💡 <strong>Exemple concras :</strong> {item.example}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Fermer le lexique</button>
        </div>
      </div>
    </div>
  );
}
