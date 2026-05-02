// src/components/PlayerCard.tsx
'use client';
import Image from 'next/image';
import { PlayerData } from '@/types';
import { RANK_NAMES, RANK_ICON_BASE } from '@/data/ranks';

interface Props {
  player: PlayerData;
  onRemove?: () => void;
}

export function PlayerCard({ player, onRemove }: Props) {
  const rankName = RANK_NAMES[player.competitiveTier] ?? 'アンランク';
  const rankIconUrl = `${RANK_ICON_BASE}${player.competitiveTier}/smallicon.png`;

  return (
    <div className="valo-panel relative flex items-center gap-3">
      {player.isSmurf && (
        <span className="absolute top-2 right-8 text-yellow-400 text-xs font-bold bg-yellow-900/40 px-1 rounded">
          ⚠ サブ垢疑惑
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
        <p className="text-[#768079] text-xs">
          スコア: {player.totalScore.toFixed(1)} | KDA: {player.avgKda.toFixed(2)} | 勝率: {(player.winRate * 100).toFixed(0)}%
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {player.topAgents.map(agent => (
          <Image
            key={agent.id}
            src={agent.iconUrl}
            alt={agent.name}
            width={28}
            height={28}
            title={agent.name}
            className="rounded-full"
            unoptimized
          />
        ))}
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
  );
}
