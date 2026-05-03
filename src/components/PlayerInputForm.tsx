'use client';
import { useState, useRef } from 'react';
import { PlayerData } from '@/types';
import { RANK_VALUES } from '@/data/ranks';
import { calcTotalScore } from '@/lib/scoring';
import { PlayerCard } from './PlayerCard';

interface Props {
  players: PlayerData[];
  onPlayersChange: (players: PlayerData[]) => void;
  onNext: () => void;
}

function SkeletonCard() {
  return (
    <div className="valo-panel flex items-center gap-3 h-[72px]">
      <div className="skeleton w-10 h-10 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-20" />
      </div>
    </div>
  );
}

export function PlayerInputForm({ players, onPlayersChange, onNext }: Props) {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkProgress, setBulkProgress] = useState('');
  const tagRef = useRef<HTMLInputElement>(null);

  async function fetchPlayer(name: string, tag: string): Promise<PlayerData> {
    const res = await fetch('/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameName: name, tagLine: tag }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました');
    return data as PlayerData;
  }

  async function handleAdd() {
    const name = gameName.trim();
    const tag = tagLine.trim();
    if (!name) { setError('プレイヤー名を入力してください'); return; }
    if (!tag)  { setError('タグを入力してください'); return; }
    if (players.length >= 10) { setError('最大10人まで追加できます'); return; }
    if (players.some(p => p.gameName === name && p.tagLine === tag)) {
      setError('このプレイヤーは既に追加されています');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const player = await fetchPlayer(name, tag);
      onPlayersChange([...players, player]);
      setGameName('');
      setTagLine('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkAdd() {
    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.includes('#'));

    if (lines.length === 0) {
      setError('名前#タグ の形式で入力してください');
      return;
    }

    const errors: string[] = [];
    let current = [...players];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hashIdx = line.indexOf('#');
      const name = line.slice(0, hashIdx).trim();
      const tag = line.slice(hashIdx + 1).trim();

      if (!name || !tag) { errors.push(`${line}: 形式エラー`); continue; }
      if (current.length >= 10) { errors.push(`${line}: 上限10人に達しました`); break; }
      if (current.some(p => p.gameName === name && p.tagLine === tag)) {
        errors.push(`${line}: 既に追加済み`);
        continue;
      }

      setBulkProgress(`${i + 1}/${lines.length} 取得中...`);
      try {
        const player = await fetchPlayer(name, tag);
        current = [...current, player];
        onPlayersChange(current);
      } catch (err: unknown) {
        errors.push(`${line}: ${err instanceof Error ? err.message : 'エラー'}`);
      }
    }

    setBulkProgress('');
    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
      setBulkText('');
      setBulkOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
        プレイヤー追加
        <span className="text-[#768079] text-base ml-2 normal-case tracking-normal font-normal">
          ({players.length}/10)
        </span>
      </h2>

      {/* 通常入力 */}
      <div className="flex gap-2">
        <input
          className="valo-input flex-1"
          placeholder="プレイヤー名"
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tagRef.current?.focus()}
          disabled={loading}
        />
        <div className="flex items-center text-[#768079] font-bold select-none">#</div>
        <input
          ref={tagRef}
          className="valo-input w-24"
          placeholder="タグ"
          value={tagLine}
          onChange={e => setTagLine(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAdd()}
          disabled={loading}
        />
        <button
          className="valo-btn"
          onClick={handleAdd}
          disabled={loading || players.length >= 10}
        >
          {loading ? '取得中' : '追加'}
        </button>
      </div>

      {/* まとめて追加 */}
      <button
        className="text-[#768079] text-xs hover:text-white underline"
        onClick={() => { setBulkOpen(v => !v); setError(''); }}
      >
        {bulkOpen ? '▲ 閉じる' : '▼ まとめて追加（複数人）'}
      </button>

      {bulkOpen && (
        <div className="space-y-2">
          <textarea
            className="valo-input w-full h-28 resize-none font-mono text-sm"
            placeholder={'Faker#JP1\nTenZ#NA1\nshahzam#1234'}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
          />
          <button
            className="valo-btn w-full"
            onClick={handleBulkAdd}
            disabled={!!bulkProgress}
          >
            {bulkProgress || 'まとめて追加'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 p-3 rounded">
          {error.split('\n').map((line, i) => (
            <p key={i} className="text-red-400 text-sm">{line}</p>
          ))}
        </div>
      )}

      {loading && <SkeletonCard />}

      <div className="space-y-2">
        {players.map(p => (
          <PlayerCard
            key={p.puuid}
            player={p}
            onRemove={() => onPlayersChange(players.filter(x => x.puuid !== p.puuid))}
            onUpdateTier={(tier) => {
              const rankValue = RANK_VALUES[tier] ?? 0;
              const totalScore = calcTotalScore(rankValue, 0.5);
              onPlayersChange(players.map(x =>
                x.puuid === p.puuid
                  ? { ...x, competitiveTier: tier, rankValue, totalScore }
                  : x
              ));
            }}
          />
        ))}
      </div>

      {players.length >= 2 && (
        <button className="valo-btn w-full mt-2" onClick={onNext}>
          チーム分けへ →
        </button>
      )}
    </div>
  );
}
