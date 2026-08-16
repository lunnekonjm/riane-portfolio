import { NextRequest, NextResponse } from 'next/server';
import { scanWalletAllAssets } from '@/services/cryptoOnChainReader';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, institution } = body;

    if (!address || typeof address !== 'string' || !address.trim()) {
      return NextResponse.json(
        { success: false, error: 'Adresse publique blockchain manquante ou invalide' },
        { status: 400 }
      );
    }

    const result = await scanWalletAllAssets(address.trim(), institution || 'Trust Wallet');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Erreur serveur lors du scan blockchain' },
      { status: 500 }
    );
  }
}
