// src/components/MapRoulette.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { getRandomMap } from '@/data/maps';
import type { MapInfo } from '@/data/maps';

export function MapRoulette() {
  const [map, setMap] = useState<MapInfo | null>(null);

  return (
    <div className="valo-panel space-y-3">
      <button className="valo-btn-outline w-full" onClick={() => setMap(getRandomMap())}>
        🎲 ランダムマップ
      </button>
      {map && (
        <div className="text-center space-y-2">
          <p className="text-white font-bold text-xl uppercase tracking-widest">
            {map.displayName}
          </p>
          <Image
            src={map.imageUrl}
            alt={map.displayName}
            width={400}
            height={200}
            className="w-full object-cover rounded"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
