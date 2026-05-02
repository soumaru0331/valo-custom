'use client';
import { useState } from 'react';
import { PlayerData } from '@/types';
import { PlayerCard } from './PlayerCard';
import { RANK_NAMES } from '@/data/ranks';

interface Props {
  players: PlayerData[];
  onPlayersChange: (players: PlayerData[]) => void;
  onNext: () => void;
}

// Rank options: 0=Unranked, 3-27=Iron1~Radiant (skip 0,1,2 duplicates)
const RANK_OPTIONS = [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];

export function PlayerInputForm({ players, onPlayersChange, onNext }: Props) {
  const [input, setInput] = useState('');
  const [tier, setTier] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed.includes('#')) {
      setError('形式: ゲーム名#タグ (例: えすさんだー#san)');
      return;
    }
    const hashIndex = trimmed.indexOf('#');
    const gameName = trimmed.slice(0, hashIndex);
    const tagLine = trimmed.slice(hashIndex + 1);

    if (!gameName || !tagLine) {
      setError('ゲーム名とタグを正しく入力してください');
      return;
    }
    if (players.length >= 10) {
      setError('最大10人まで追加できます');
      return;
    }
    if (players.some(p => p.gameName === gameName && p.tagLine === tagLine)) {
      setError('このプレイヤーは既に追加されています');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName, tagLine, competitiveTier: tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました');
      onPlayersChange([...players, data as PlayerData]);
      setInput('');
      setTier(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
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

      <div className="flex gap-2">
        <input
          className="valo-input flex-1"
          placeholder="ゲーム名#タグ (例: えすさんだー#san)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAdd()}
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-[#768079] text-sm whitespace-nowrap">ランク:</label>
        <select
          className="valo-input flex-1 cursor-pointer"
          value={tier}
          onChange={e => setTier(Number(e.target.value))}
          disabled={loading}
        >
          {RANK_OPTIONS.map(t => (
            <option key={t} value={t}>{RANK_NAMES[t]}</option>
          ))}
        </select>
        <button
          className="valo-btn"
          onClick={handleAdd}
          disabled={loading || players.length >= 10}
        >
          {loading ? '確認中...' : '追加'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <div className="space-y-2">
        {players.map(p => (
          <PlayerCard
            key={p.puuid}
            player={p}
            onRemove={() => onPlayersChange(players.filter(x => x.puuid !== p.puuid))}
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
