/**
 * Benchmarks personnalisés par poche — CDC Section "Benchmarks personnalisés"
 */

export interface BenchmarkDefinition {
  envelope: string;
  name: string;
  ticker: string;
  description: string;
}

export const BENCHMARKS: BenchmarkDefinition[] = [
  {
    envelope: 'PEA',
    name: 'MSCI ACWI',
    ticker: 'CW8.PA',
    description: 'Cœur mondial — indice large global',
  },
  {
    envelope: 'PEA-TECH',
    name: 'Nasdaq-100',
    ticker: 'PUST.PA',
    description: 'Satellite technologique',
  },
  {
    envelope: 'PEA-PME',
    name: 'MSCI Europe Small Cap',
    ticker: 'SMC.PA',
    description: 'Indice small caps européen approprié',
  },
  {
    envelope: 'CTO',
    name: 'Composite CTO',
    ticker: 'CUSTOM',
    description: 'Composite pondéré des secteurs concernés (photonique, énergie, IA)',
  },
  {
    envelope: 'SPECULATIVE',
    name: 'Budget à Risque',
    ticker: 'NONE',
    description: 'Budget de capital à risque — pas objectif de surperformance classique',
  },
];
