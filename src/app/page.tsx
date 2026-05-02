'use client';
import { useState } from 'react';
import { PlayerData, TeamMode, TeamResult, TeamResultWithHandicaps } from '@/types';
import { balanceTeams } from '@/lib/team-balancer';
import { assignHandicaps } from '@/lib/handicap';
import { loadHistory, saveHistory } from '@/lib/history';
import { PlayerInputForm } from '@/components/PlayerInputForm';
import { ModeSelector } from '@/components/ModeSelector';
import { TeamResultView } from '@/components/TeamResultView';
import { BanPhase } from '@/components/BanPhase';
import { AgentDecorations } from '@/components/AgentDecorations';

type AppStep = 'input' | 'mode' | 'result' | 'ban';

export default function Home() {
  const [step, setStep] = useState<AppStep>('input');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [mode, setMode] = useState<TeamMode>('simple');
  const [teamResult, setTeamResult] = useState<TeamResult | null>(null);
  const [resultWithHandicaps, setResultWithHandicaps] = useState<TeamResultWithHandicaps | null>(null);
  const [bansPerTeam, setBansPerTeam] = useState(1);

  function handleRunBalance() {
    const history = loadHistory();
    const result = balanceTeams(players, mode, history ?? undefined);
    const withHandicaps =
      mode === 'handicap' || mode === 'no-repeat-handicap'
        ? assignHandicaps(result)
        : { ...result, teamA: result.teamA.map(p => ({ ...p })), teamB: result.teamB.map(p => ({ ...p })) };
    setTeamResult(result);
    setResultWithHandicaps(withHandicaps);
    setStep('result');
  }

  function handleSaveAndBan() {
    if (teamResult) saveHistory(teamResult);
    setStep('ban');
  }

  return (
    <>
    <AgentDecorations />
    <main className="min-h-screen bg-[#0F1923] p-4 max-w-2xl mx-auto relative" style={{ zIndex: 1 }}>
      <div className="mb-8 pt-4">
        <h1 className="text-4xl font-black uppercase tracking-widest text-white">
          VALO<span className="text-red-500">CUSTOM</span>
        </h1>
        <p className="text-[#768079] text-sm">カスタムマッチ チームバランサー</p>
      </div>

      {step === 'input' && (
        <PlayerInputForm
          players={players}
          onPlayersChange={setPlayers}
          onNext={() => setStep('mode')}
        />
      )}

      {step === 'mode' && (
        <div className="space-y-4">
          <button
            className="text-[#768079] text-sm hover:text-white"
            onClick={() => setStep('input')}
          >
            ← プレイヤー編集に戻る
          </button>
          <ModeSelector
            selected={mode}
            onSelect={setMode}
            onConfirm={handleRunBalance}
          />
        </div>
      )}

      {step === 'result' && resultWithHandicaps && (
        <TeamResultView
          result={resultWithHandicaps}
          onSaveAndBan={handleSaveAndBan}
          onReshuffle={handleRunBalance}
          onBack={() => setStep('mode')}
          bansPerTeam={bansPerTeam}
          onBansPerTeamChange={setBansPerTeam}
        />
      )}

      {step === 'ban' && resultWithHandicaps && (
        <BanPhase
          result={resultWithHandicaps}
          bansPerTeam={bansPerTeam}
          onComplete={() => setStep('input')}
        />
      )}
    </main>
    </>
  );
}
