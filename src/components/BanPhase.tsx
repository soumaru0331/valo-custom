'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TeamResultWithHandicaps, AgentInfo } from '@/types';

interface Props {
  result: TeamResultWithHandicaps;
  bansPerTeam: number;
  onComplete: () => void;
}

interface AgentWithRole extends AgentInfo {
  role: string;
}

interface AgentApiItem {
  uuid: string;
  displayName: string;
  displayIcon: string;
  role: { displayName: string } | null;
}

const ROLE_ORDER = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
const ROLE_LABELS: Record<string, string> = {
  Duelist:    'デュエリスト',
  Initiator:  'イニシエーター',
  Controller: 'コントローラー',
  Sentinel:   'センチネル',
};
const ROLE_COLORS: Record<string, string> = {
  Duelist:    'text-red-400 border-red-500/40',
  Initiator:  'text-green-400 border-green-500/40',
  Controller: 'text-purple-400 border-purple-500/40',
  Sentinel:   'text-blue-400 border-blue-500/40',
};

export function BanPhase({ bansPerTeam, onComplete }: Props) {
  const [agents, setAgents] = useState<AgentWithRole[]>([]);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());
  const [currentTeam, setCurrentTeam] = useState<'A' | 'B'>('A');
  const [teamABans, setTeamABans] = useState(0);
  const [teamBBans, setTeamBBans] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string>('Duelist');

  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true')
      .then(r => r.json())
      .then(data => {
        const list: AgentWithRole[] = (data.data as AgentApiItem[])
          .map(a => ({
            id: a.uuid,
            name: a.displayName,
            iconUrl: a.displayIcon,
            role: a.role?.displayName ?? 'Other',
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAgents(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleBan(agent: AgentWithRole) {
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

    const next = currentTeam === 'A' ? 'B' : 'A';
    const nextDone = next === 'A' ? newABans >= bansPerTeam : newBBans >= bansPerTeam;
    setCurrentTeam(nextDone ? currentTeam : next);
  }

  const roleGroups = ROLE_ORDER.map(role => ({
    role,
    agents: agents.filter(a => a.role === role),
  })).filter(g => g.agents.length > 0);

  const bannedAgents = agents.filter(a => bannedIds.has(a.id));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
        BANフェーズ
      </h2>

      {loading ? (
        <div className="valo-panel text-center text-[#768079]">エージェント読み込み中...</div>
      ) : !done ? (
        <div className={`valo-panel text-center border-t-4 ${currentTeam === 'A' ? 'border-blue-500' : 'border-red-500'}`}>
          <p className="text-white text-xl font-black tracking-wider">
            <span className={currentTeam === 'A' ? 'text-blue-400' : 'text-red-400'}>
              チーム {currentTeam}
            </span>
            {' '}がBANを選択
          </p>
          <div className="flex justify-center gap-6 mt-2">
            <div className="text-center">
              <p className="text-blue-400 text-xs uppercase tracking-wider">チーム A</p>
              <div className="flex gap-1 justify-center mt-1">
                {Array.from({ length: bansPerTeam }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm border ${i < teamABans ? 'bg-blue-500 border-blue-400' : 'border-blue-500/30'}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-red-400 text-xs uppercase tracking-wider">チーム B</p>
              <div className="flex gap-1 justify-center mt-1">
                {Array.from({ length: bansPerTeam }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm border ${i < teamBBans ? 'bg-red-500 border-red-400' : 'border-red-500/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="valo-panel text-center border-t-4 border-green-500">
          <p className="text-green-400 font-black text-xl uppercase tracking-widest">BANフェーズ完了！</p>
        </div>
      )}

      {bannedAgents.length > 0 && (
        <div className="valo-panel">
          <p className="text-[#768079] text-xs mb-2 uppercase tracking-wider">BANされたエージェント</p>
          <div className="flex flex-wrap gap-3">
            {bannedAgents.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Image
                    src={a.iconUrl}
                    alt={a.name}
                    width={36}
                    height={36}
                    className="grayscale opacity-40 rounded-full"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-red-500 font-black text-lg leading-none">✕</span>
                  </div>
                </div>
                <span className="text-xs text-[#768079] text-center leading-tight">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ロールタブ */}
          <div className="flex gap-1 flex-wrap">
            {roleGroups.map(({ role }) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  activeRole === role
                    ? ROLE_COLORS[role] ?? 'text-white border-white/40'
                    : 'text-[#768079] border-[#2a3540] hover:border-gray-500'
                }`}
              >
                {ROLE_LABELS[role] ?? role}
              </button>
            ))}
          </div>

          {/* エージェントグリッド */}
          {roleGroups
            .filter(g => g.role === activeRole)
            .map(({ role, agents: roleAgents }) => (
              <div key={role} className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {roleAgents.map(agent => {
                  const isBanned = bannedIds.has(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleBan(agent)}
                      disabled={isBanned || done}
                      title={agent.name}
                      className={`flex flex-col items-center gap-1 p-1 rounded transition-all ${
                        isBanned || done
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-white/10 cursor-pointer hover:scale-105'
                      }`}
                    >
                      <div className="relative">
                        <Image
                          src={agent.iconUrl}
                          alt={agent.name}
                          width={48}
                          height={48}
                          className={isBanned ? 'grayscale' : ''}
                          unoptimized
                        />
                        {isBanned && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-red-500 font-black text-2xl leading-none drop-shadow">✕</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#768079] text-center leading-tight">
                        {agent.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
        </>
      )}

      {done && (
        <button className="valo-btn w-full" onClick={onComplete}>
          最初に戻る
        </button>
      )}
    </div>
  );
}
