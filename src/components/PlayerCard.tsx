// src/components/PlayerCard.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { PlayerData } from '@/types';
import { RANK_NAMES, RANK_ICON_BASE, RANK_VALUES } from '@/data/ranks';
import { calcTotalScore } from '@/lib/scoring';

interface Props {
  player: PlayerData;
  onRemove?: () => void;
  onUpdateTier?: (tier: number) => void;
}

const RANK_OPTIONS = [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27];

export function PlayerCard({ player, onRemove, onUpdateTier }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const rankName = RANK_NAMES[player.competitiveTier] ?? 'アンランク';
  const rankIconUrl = `${RANK_ICON_BASE}${player.competitiveTier}/smallicon.png`;
  const noStats = player.matchCount === 0;

  return (
    <div className="valo-panel relative flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {player.isSmurf && (
          <span className="absolute top-2 right-8 text-yellow-400 text-xs font-bold bg-yellow-900/40 px-1 rounded">
            サブ垢疑惑
          </span>
        )}
        <Image
          src={rankIconUrl}
          alt={rankName}
          width={40}
          height={40}
          className="flex-shrink-0"
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">
            {player.gameName}
            <span className="text-[#768079] text-sm ml-1">#{player.tagLine}</span>
          </p>
          <p className="text-red-400 text-sm">{rankName}</p>
          <div className="flex gap-3 text-[#768079] text-xs items-center">
            {!noStats ? (
              <>
                <span>KD: {player.avgKda.toFixed(2)}</span>
                <span>WR: {(player.winRate * 100).toFixed(0)}%</span>
                <span>スコア: {player.totalScore.toFixed(1)}</span>
              </>
            ) : (
              <>
                <span>スコア: {player.totalScore.toFixed(1)}</span>
                {onUpdateTier && (
                  <button
                    onClick={() => setShowPicker(p => !p)}
                    className="text-yellow-500 hover:text-yellow-300 text-xs underline"
                  >
                    {showPicker ? '▲ 閉じる' : '⚠ ランク手動設定'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-[#768079] hover:text-red-400 text-xl ml-1 flex-shrink-0 leading-none"
            aria-label="削除"
          >
            ×
          </button>
        )}
      </div>

      {showPicker && onUpdateTier && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-[#768079]/20">
          {RANK_OPTIONS.map(tier => (
            <button
              key={tier}
              onClick={() => { onUpdateTier(tier); setShowPicker(false); }}
              title={RANK_NAMES[tier]}
              className={`rounded p-0.5 hover:bg-white/10 transition ${player.competitiveTier === tier ? 'ring-1 ring-red-400' : ''}`}
            >
              <Image
                src={`${RANK_ICON_BASE}${tier}/smallicon.png`}
                alt={RANK_NAMES[tier]}
                width={28}
                height={28}
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
