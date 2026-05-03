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
  const mainAgent = player.topAgents[0] ?? null;

  return (
    <div className="relative p-3 border-b border-white/5 last:border-0 overflow-hidden">
      {/* エージェント背景 */}
      {mainAgent && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ zIndex: 0 }}>
          <Image
            src={mainAgent.iconUrl}
            alt={mainAgent.name}
            width={44}
            height={44}
            className="rounded-full"
            style={{ opacity: 0.10 }}
            unoptimized
          />
        </div>
      )}
      <div className="relative flex items-center gap-2" style={{ zIndex: 1 }}>
        <Image
          src={`${RANK_ICON_BASE}${player.competitiveTier}/smallicon.png`}
          alt={rankName}
          width={28}
          height={28}
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate text-sm">
            {player.gameName}
            <span className="text-[#768079] text-xs ml-1">#{player.tagLine}</span>
            {player.isSmurf && (
              <span className="ml-2 text-yellow-400 text-xs">⚠ サブ垢</span>
            )}
          </p>
          <div className="flex gap-2 text-[#768079] text-xs flex-wrap">
            <span>{rankName}</span>
            {player.matchCount > 0 && (
              <>
                <span className="text-[#4a5565]">|</span>
                <span>KD {player.avgKda.toFixed(2)}</span>
                <span>WR {(player.winRate * 100).toFixed(0)}%</span>
              </>
            )}
            <span className="text-[#4a5565]">|</span>
            <span>スコア <span className="text-white">{player.totalScore.toFixed(1)}</span></span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {player.topAgents.map(a => (
            <Image
              key={a.id}
              src={a.iconUrl}
              alt={a.name}
              width={32}
              height={32}
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

function teamTotalScore(players: PlayerWithHandicap[]): number {
  return players.reduce((sum, p) => sum + p.totalScore, 0);
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
  const scoreA = teamTotalScore(result.teamA);
  const scoreB = teamTotalScore(result.teamB);

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
        {/* チームA */}
        <div className="valo-panel border-t-4 border-blue-500 overflow-hidden">
          <div className="bg-blue-500/10 -mx-4 -mt-4 px-4 pt-3 pb-2 mb-2 border-b border-blue-500/20">
            <h3 className="text-blue-400 font-bold uppercase tracking-wider text-lg">
              チーム A
            </h3>
            <p className="text-blue-300/60 text-xs">合計スコア: {scoreA.toFixed(1)}</p>
          </div>
          {result.teamA.map(p => (
            <PlayerRow key={p.puuid} player={p} />
          ))}
        </div>

        {/* チームB */}
        <div className="valo-panel border-t-4 border-red-500 overflow-hidden">
          <div className="bg-red-500/10 -mx-4 -mt-4 px-4 pt-3 pb-2 mb-2 border-b border-red-500/20">
            <h3 className="text-red-400 font-bold uppercase tracking-wider text-lg">
              チーム B
            </h3>
            <p className="text-red-300/60 text-xs">合計スコア: {scoreB.toFixed(1)}</p>
          </div>
          {result.teamB.map(p => (
            <PlayerRow key={p.puuid} player={p} />
          ))}
        </div>
      </div>

      {/* スコア差 */}
      <div className="text-center py-3 border border-[#2a3540] bg-[#1a2530]">
        <p className="text-[#768079] text-xs uppercase tracking-widest mb-1">スコア差</p>
        <p className="text-white text-3xl font-black">{result.scoreDiff.toFixed(1)}</p>
      </div>

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
