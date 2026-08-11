/**
 * API Route — Parsing de fiche de paie par IA
 * POST /api/parse-payslip
 *
 * Remplace la dépendance externe non fiable de l'ancien projet AuraBudget Pro
 * (proxy vers un service tiers inconnu) par un appel direct à Gemini, dans la
 * même infrastructure IA que le reste de RIANE Portfolio.
 *
 * Flux : PDF (base64) -> extraction de texte (pdf-parse, côté serveur)
 *        -> extraction structurée par Gemini -> JSON validé -> renvoyé au client
 * Le PDF n'est jamais stocké côté serveur, seul le texte extrait transite en mémoire.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

interface ParsedPayslip {
  period: string; // YYYY-MM
  periodLabel: string;
  netSalary: number;
  grossSalary: number | null;
  netSocial: number | null;
  socialContributions: number | null;
  incomeTaxAmount: number | null;
  incomeTaxRatePercent: number | null;
  companySavingsPEE: number | null;
  hasExplicitBonus: boolean;
  bonusDescription: string | null;
  bonusAmount: number | null;
  confidence: 'low' | 'medium' | 'high';
  extractionNotes: string;
}

const EXTRACTION_PROMPT = `Tu es un moteur d'extraction de données pour bulletins de salaire français.
On te donne le texte brut extrait d'un PDF de fiche de paie. Extrais UNIQUEMENT les champs suivants
et réponds avec un objet JSON strict, sans aucun texte avant/après, sans balises markdown.

Champs à extraire :
- period: la période de paie au format "YYYY-MM" (déduis l'année si seul le mois est visible et qu'un contexte de date existe, sinon utilise l'année la plus plausible)
- periodLabel: libellé humain, ex: "Août 2026"
- netSalary: le "Net à payer" (montant réellement versé sur le compte bancaire), nombre
- grossSalary: le salaire brut mensuel si visible, sinon null
- netSocial: le "Net Social" / "Montant Net Social" si visible (différent du net à payer, sert de référence pour les aides sociales), sinon null
- socialContributions: total des cotisations sociales salariales (nombre négatif), sinon null
- incomeTaxAmount: montant du prélèvement à la source (nombre négatif ou 0), sinon null
- incomeTaxRatePercent: taux de prélèvement à la source en %, sinon null
- companySavingsPEE: montant versé sur un Plan d'Épargne Entreprise / PERCO au titre de l'intéressement ou de la participation CE MOIS-CI (pas versé en banque), sinon null si absent
- hasExplicitBonus: true si une ligne de prime, 13e mois, prime de vacances, rachat de congés/RTT est explicitement identifiable
- bonusDescription: le libellé de cette ligne si hasExplicitBonus est true, sinon null
- bonusAmount: le montant de cette prime si identifiable, sinon null
- confidence: "high" si tous les champs principaux (period, netSalary) sont sans ambiguïté, "medium" si un doute existe, "low" si le document ne ressemble pas clairement à un bulletin de salaire
- extractionNotes: une phrase courte en français expliquant les incertitudes éventuelles, ou "" si aucune

Ne déduis JAMAIS de valeur non présente dans le texte — utilise null plutôt que d'inventer un chiffre.

Texte du bulletin :
"""
{PAYSLIP_TEXT}
"""

Réponds uniquement avec l'objet JSON.`;

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Aucun JSON trouvé dans la réponse du modèle');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY non configurée côté serveur' }, { status: 500 });
    }

    const body = await request.json();
    const { base64Data, rawTextContent } = body as { base64Data?: string; rawTextContent?: string };

    let payslipText = rawTextContent || '';

    if (!payslipText && base64Data) {
      // Extraction texte côté serveur depuis le PDF brut
      const { PDFParse } = await import('pdf-parse');
      const buffer = Buffer.from(base64Data, 'base64');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      payslipText = result.text || '';
    }

    if (!payslipText || payslipText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire du texte exploitable de ce document.' },
        { status: 422 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = EXTRACTION_PROMPT.replace('{PAYSLIP_TEXT}', payslipText.slice(0, 12000));
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const parsedJson = extractJson(responseText) as ParsedPayslip;

    if (!parsedJson.period || typeof parsedJson.netSalary !== 'number') {
      return NextResponse.json(
        { error: 'Extraction incomplète — vérifiez et complétez manuellement.', partial: parsedJson },
        { status: 422 }
      );
    }

    return NextResponse.json({ data: parsedJson });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    console.error('[parse-payslip] error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
