import { NextRequest, NextResponse } from 'next/server';
import { verifyAndBuildPlayer } from '@/lib/riot-api';

export async function POST(req: NextRequest) {
  try {
    const { gameName, tagLine, competitiveTier } = await req.json();

    if (!gameName || !tagLine) {
      return NextResponse.json(
        { error: 'gameName and tagLine are required' },
        { status: 400 }
      );
    }

    const tier = typeof competitiveTier === 'number' ? competitiveTier : 0;
    const playerData = await verifyAndBuildPlayer(
      String(gameName).trim(),
      String(tagLine).trim(),
      tier
    );

    return NextResponse.json(playerData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
