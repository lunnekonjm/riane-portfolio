/**
 * Route API Copilote Agentique & Exécution de Skills
 * POST /api/agents/chat
 */

import { NextResponse } from 'next/server';
import { runAgenticConversation } from '@/services/agents/agenticEngine';
import { DEFAULT_POSITIONS } from '@/data/portfolio';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, positions = DEFAULT_POSITIONS, conversationHistory = [] } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Une question ou instruction est requise.' }, { status: 400 });
    }

    const agentResponse = await runAgenticConversation(query, positions, conversationHistory);

    return NextResponse.json({
      success: true,
      data: agentResponse,
    });
  } catch (error: any) {
    console.error('[API Agentic Chat] Erreur :', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'exécution agentique',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
