// src/components/TeamResultView.tsx
'use client';
import Image from 'next/image';
import { TeamResultWithHandicaps, PlayerWithHandicap } from '@/types';
import { RANK_NAMES, RANK_ICON_BASE } from '@/data/ranks';
import { HandicapBadge } from './HandicapBadge';
import { MapRoulette } from './MapRoulette';

interface PlayerRowProps {
  player: PlayerWithHandicap;
}

function PlayerRow({ player }: PlayerRowProps) {
  const rankName = RANK_NAMES[player.competitiveTier] ?? 'アンランク';
  return (
    <div className="p-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Image
          src={`${RANK_ICON_BASE}${player.competitiveTier}/smallicon.png`}
          alt={rankName}
          width={28}
          height={28}
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">
            {player.gameName}
            <span className="text-[#768079] text-xs ml-1">#{player.tagLine}</span>
            {player.isSmurf && (
              <span className="ml-2 text-yellow-400 text-xs">⚠ サブ垢</span>
            )}
          </p>
          <p className="text-[#768079] text-xs">
            {rankName} | スコア: {player.totalScore.toFixed(1)}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {player.topAgents.map(a => (
            <Image
              key={a.id}
              src={a.iconUrl}
              alt={a.name}
              width={22}
              height={22}
              className="rounded-full"
              unoptimized
            />
          ))}
        </div>
      </div>
      {player.handicap && <HandicapBadge handicap={player.handicap} />}
    </div>
  );
}

interface Props {
  result: TeamResultWithHandicaps;
  onSaveAndBan: () => void;
  onReshuffle: () => void;
  onBack: () => void;
  bansPerTeam: number;
  onBansPerTeamChange: (n: number) => void;
}

export function TeamResultView({
  result,
  onSaveAndBan,
  onReshuffle,
  onBack,
  bansPerTeam,
  onBansPerTeamChange,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
          チーム分け結果
        </h2>
        <button
          className="text-[#768079] text-sm hover:text-white"
          onClick={onBack}
        >
          ← 戻る
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="valo-panel border-t-2 border-blue-500">
          <h3 className="text-blue-400 font-bold uppercase tracking-wider mb-2">チーム A</h3>
          {result.teamA.map(p => (
            <PlayerRow key={p.puuid} player={p} />
          ))}
        </div>
        <div className="valo-panel border-t-2 border-red-500">
          <h3 className="text-red-400 font-bold uppercase tracking-wider mb-2">チーム B</h3>
          {result.teamB.map(p => (
            <PlayerRow key={p.puuid} player={p} />
          ))}
        </div>
      </div>

      <p className="text-center text-[#768079] text-sm">
        スコア差:{' '}
        <span className="text-white font-bold">{result.scoreDiff.toFixed(1)}</span>
      </p>

      <MapRoulette />

      <div className="valo-panel flex items-center gap-3 flex-wrap">
        <span className="text-white text-sm">
          BANフェーズのBAN数（1チームあたり）:
        </span>
        {([1, 2, 3] as const).map(n => (
          <button
            key={n}
            onClick={() => onBansPerTeamChange(n)}
            className={`w-8 h-8 font-bold border transition-colors ${
              bansPerTeam === n
                ? 'border-red-500 text-red-400'
                : 'border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button className="valo-btn-outline flex-1" onClick={onReshuffle}>
          もう一度
        </button>
        <button className="valo-btn flex-1" onClick={onSaveAndBan}>
          保存 → BANフェーズ
        </button>
      </div>
    </div>
  );
}
