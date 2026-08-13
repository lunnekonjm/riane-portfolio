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

// Polyfill browser globals for pdf-parse / pdfjs-dist in Node.js serverless runtimes
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: any) {
      if (Array.isArray(init) && init.length >= 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2];
        this.d = init[3]; this.e = init[4]; this.f = init[5];
      }
    }
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    inverse() { return this; }
    transformPoint(p: any) { return p; }
  };
}
if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class Path2D {};
}
if (typeof (globalThis as any).ImageData === 'undefined') {
  (globalThis as any).ImageData = class ImageData {};
}

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
  baseSalaryGross: number | null;
  baseSalaryNet: number | null;
  hasExplicitBonus: boolean;
  bonusDescription: string | null;
  bonusGross: number | null;
  bonusNet: number | null;
  hasCongesRachat: boolean;
  congesRachatJours: number | null;
  congesRachatGross: number | null;
  congesRachatNet: number | null;
  confidence: 'low' | 'medium' | 'high';
  extractionNotes: string;
}

const EXTRACTION_PROMPT = `Tu es un moteur d'extraction de données pour bulletins de salaire français.
On te donne le texte brut extrait d'un PDF de fiche de paie. Extrais UNIQUEMENT les champs suivants
et réponds avec un objet JSON strict, sans aucun texte avant/après, sans balises markdown.

IMPORTANT — méthode de ventilation par composante : un bulletin mélange souvent plusieurs natures de
revenu (salaire de base, prime/bonus de performance, rachat de jours de repos/congés) qui ont CHACUNE
un taux de conversion net/brut différent (les primes et rachats sont généralement moins chargés en
cotisations sociales que le salaire de base, proportionnellement). Isole donc CHAQUE composante
séparément (montant brut et net propres à cette ligne) plutôt que de te contenter du total du
bulletin. Si le document ne permet pas de distinguer clairement une composante, laisse ses champs à
null plutôt que d'inventer une ventilation.

Champs à extraire :
- period: la période de paie au format "YYYY-MM"
- periodLabel: libellé humain, ex: "Août 2026"
- netSalary: le "Net à payer" total (toutes composantes confondues), nombre
- grossSalary: le salaire brut mensuel total si visible, sinon null
- netSocial: le "Net Social" total si visible, sinon null
- socialContributions: total des cotisations sociales salariales (nombre négatif), sinon null
- incomeTaxAmount: montant total du prélèvement à la source (nombre négatif ou 0), sinon null
- incomeTaxRatePercent: taux de prélèvement à la source en % (s'applique globalement, après le calcul net/brut de chaque composante), sinon null
- companySavingsPEE: montant versé sur un Plan d'Épargne Entreprise / PERCO ce mois-ci, sinon null
- baseSalaryGross / baseSalaryNet: la ligne de salaire de base uniquement (hors primes/rachats), sinon null
- hasExplicitBonus: true si une ligne de prime/bonus de performance est identifiable
- bonusDescription: le libellé de cette ligne si hasExplicitBonus est true, sinon null
- bonusGross / bonusNet: montants brut/net de cette seule ligne de prime, sinon null
- hasCongesRachat: true si une ligne de rachat de jours de repos/congés/RTT est identifiable
- congesRachatJours: nombre de jours rachetés si indiqué, sinon null
- congesRachatGross / congesRachatNet: montants brut/net de cette seule ligne de rachat, sinon null
- confidence: "high" si period et netSalary sont sans ambiguïté, "medium" si un doute existe, "low" si le document ne ressemble pas clairement à un bulletin de salaire
- extractionNotes: une phrase courte en français expliquant les incertitudes éventuelles, ou "" si aucune

Ne déduis JAMAIS de valeur non présente dans le texte — utilise null plutôt que d'inventer un chiffre.
Si le bulletin ne détaille pas explicitement le net par composante mais que tu peux le calculer à
partir des bruts et d'un taux de charge cohérent avec le reste du document, tu peux le faire — sinon
laisse à null, l'application appliquera des taux de référence par défaut.

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

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];

async function callGeminiWithRotation(genAI: GoogleGenerativeAI, contents: any): Promise<string> {
  let lastErr: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent(contents);
      const txt = res.response.text();
      if (txt && txt.trim().length > 0) {
        return txt;
      }
    } catch (err) {
      console.warn(`[parse-payslip] Model ${modelName} failed:`, err);
      lastErr = err;
    }
  }
  throw lastErr || new Error('Tous les modèles Gemini ont échoué');
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY non configurée côté serveur' }, { status: 500 });
    }

    const body = await request.json();
    const { base64Data, rawTextContent } = body as { base64Data?: string; rawTextContent?: string };

    const genAI = new GoogleGenerativeAI(apiKey);
    let responseText = '';

    if (base64Data) {
      // 1. Direct Multimodal PDF extraction with model rotation
      try {
        const pdfPart = {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf',
          },
        };
        responseText = await callGeminiWithRotation(genAI, [
          EXTRACTION_PROMPT.replace('{PAYSLIP_TEXT}', 'Voir le document PDF ci-joint.'),
          pdfPart,
        ]);
      } catch (geminiPdfErr) {
        console.warn('[parse-payslip] Direct PDF parsing failed, trying text fallback:', geminiPdfErr);
      }
    }

    if (!responseText && base64Data) {
      // 2. Pure Node.js text extraction fallback using pdf-parse 1.1.1
      try {
        // @ts-ignore
        const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'));
        const buffer = Buffer.from(base64Data, 'base64');
        const parsedData = await pdfParse(buffer);
        const payslipText = parsedData.text || '';
        if (payslipText.trim().length >= 20) {
          const prompt = EXTRACTION_PROMPT.replace('{PAYSLIP_TEXT}', payslipText.slice(0, 12000));
          responseText = await callGeminiWithRotation(genAI, prompt);
        }
      } catch (pdfParseErr) {
        console.error('[parse-payslip] pdf-parse fallback failed:', pdfParseErr);
      }
    }

    if (!responseText && rawTextContent) {
      const prompt = EXTRACTION_PROMPT.replace('{PAYSLIP_TEXT}', rawTextContent.slice(0, 12000));
      responseText = await callGeminiWithRotation(genAI, prompt);
    }

    if (!responseText) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire les données du bulletin de paie. Vérifiez la clé GEMINI_API_KEY.' },
        { status: 422 }
      );
    }

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
