'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TeamResultWithHandicaps, AgentInfo } from '@/types';

interface Props {
  result: TeamResultWithHandicaps;
  bansPerTeam: number;
  onComplete: () => void;
}

interface AgentApiItem {
  uuid: string;
  displayName: string;
  displayIcon: string;
}

export function BanPhase({ bansPerTeam, onComplete }: Props) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());
  const [currentTeam, setCurrentTeam] = useState<'A' | 'B'>('A');
  const [teamABans, setTeamABans] = useState(0);
  const [teamBBans, setTeamBBans] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true')
      .then(r => r.json())
      .then(data => {
        const list: AgentInfo[] = (data.data as AgentApiItem[])
          .map(a => ({ id: a.uuid, name: a.displayName, iconUrl: a.displayIcon }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAgents(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleBan(agent: AgentInfo) {
    if (bannedIds.has(agent.id) || done) return;

    const newBanned = new Set(bannedIds);
    newBanned.add(agent.id);
    setBannedIds(newBanned);

    const newABans = currentTeam === 'A' ? teamABans + 1 : teamABans;
    const newBBans = currentTeam === 'B' ? teamBBans + 1 : teamBBans;
    setTeamABans(newABans);
    setTeamBBans(newBBans);

    if (newABans >= bansPerTeam && newBBans >= bansPerTeam) {
      setDone(true);
      return;
    }

    // Switch to other team unless they already finished
    const next = currentTeam === 'A' ? 'B' : 'A';
    const nextDone = next === 'A' ? newABans >= bansPerTeam : newBBans >= bansPerTeam;
    setCurrentTeam(nextDone ? currentTeam : next);
  }

  const bannedAgents = agents.filter(a => bannedIds.has(a.id));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
        BANフェーズ
      </h2>

      {loading ? (
        <div className="valo-panel text-center text-[#768079]">エージェント読み込み中...</div>
      ) : !done ? (
        <div className="valo-panel text-center">
          <p className="text-white text-lg font-bold">
            <span className={currentTeam === 'A' ? 'text-blue-400' : 'text-red-400'}>
              チーム {currentTeam}
            </span>{' '}
            がBANを選択
          </p>
          <p className="text-[#768079] text-sm mt-1">
            チームA: {teamABans}/{bansPerTeam} | チームB: {teamBBans}/{bansPerTeam}
          </p>
        </div>
      ) : (
        <div className="valo-panel text-center">
          <p className="text-green-400 font-bold text-lg">BANフェーズ完了！</p>
        </div>
      )}

      {bannedAgents.length > 0 && (
        <div className="valo-panel">
          <p className="text-[#768079] text-xs mb-2 uppercase tracking-wider">
            BANされたエージェント
          </p>
          <div className="flex flex-wrap gap-3">
            {bannedAgents.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1 opacity-50">
                <Image
                  src={a.iconUrl}
                  alt={a.name}
                  width={36}
                  height={36}
                  className="grayscale rounded-full"
                  unoptimized
                />
                <span className="text-xs text-[#768079] text-center">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {agents.map(agent => {
            const isBanned = bannedIds.has(agent.id);
            return (
              <button
                key={agent.id}
                onClick={() => handleBan(agent)}
                disabled={isBanned || done}
                title={agent.name}
                className={`flex flex-col items-center gap-1 p-1 rounded transition-opacity ${
                  isBanned || done
                    ? 'opacity-20 cursor-not-allowed'
                    : 'hover:bg-white/10 cursor-pointer'
                }`}
              >
                <Image
                  src={agent.iconUrl}
                  alt={agent.name}
                  width={48}
                  height={48}
                  className={isBanned ? 'grayscale' : ''}
                  unoptimized
                />
                <span className="text-[10px] text-[#768079] text-center leading-tight">
                  {agent.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {done && (
        <button className="valo-btn w-full" onClick={onComplete}>
          最初に戻る
        </button>
      )}
    </div>
  );
}
